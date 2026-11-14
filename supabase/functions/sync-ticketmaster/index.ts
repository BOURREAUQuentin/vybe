// Edge Function « sync-ticketmaster » (V1.1) : importe les concerts de musique en France depuis la
// Discovery API de Ticketmaster et les écrit en base avec import_ticketmaster_events.
//
// Appel : POST, en-tête « x-sync-secret » = secret SYNC_SECRET (tâche planifiée, ou à la main).
// Corps facultatif (JSON) : { "months": 1..6 (défaut 6), "dryRun": true (n'écrit rien) }.
// Secrets de la fonction (jamais dans le code ni dans Git) :
//   TICKETMASTER_API_KEY, SYNC_SECRET ; SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { createTicketmasterClient, QuotaExceededError } from './ticketmaster.ts';
import { buildWindows, toApiDate, toImportEvent, type ImportEvent } from './transform.ts';

const MAX_MONTHS = 6;
const IMPORT_BATCH_SIZE = 100; // concerts par appel à import_ticketmaster_events

type SyncSummary = {
  status: 'success' | 'partial' | 'failed';
  dryRun: boolean;
  apiCalls: number;
  received: number;
  importable: number;
  created: number;
  updated: number;
  errors: string[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Comparaison en temps constant (évite de deviner le secret à la durée de la réponse). */
function sameSecret(given: string | null, expected: string): boolean {
  if (!given || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const syncSecret = Deno.env.get('SYNC_SECRET');
  const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!syncSecret || !apiKey || !supabaseUrl || !serviceKey) {
    return json({ error: 'Configuration incomplète : secrets manquants' }, 500);
  }
  if (!sameSecret(request.headers.get('x-sync-secret'), syncSecret)) {
    return json({ error: 'Non autorisé' }, 401);
  }

  const options = await request.json().catch(() => ({}));
  const months = Math.min(Math.max(Number(options.months) || MAX_MONTHS, 1), MAX_MONTHS);
  const dryRun = options.dryRun === true;

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const startedAt = new Date();
  const summary: SyncSummary = {
    status: 'success',
    dryRun,
    apiCalls: 0,
    received: 0,
    importable: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  // Ligne du journal (sauf en essai à blanc).
  let runId: string | null = null;
  if (!dryRun) {
    const { data, error } = await db
      .from('sync_runs')
      .insert({ source: 'ticketmaster', started_at: startedAt.toISOString() })
      .select('id')
      .single();
    if (error) return json({ error: `Journal inaccessible : ${error.message}` }, 500);
    runId = data.id;
  }

  // 1. Récupération, tranche par tranche (une tranche en échec n'arrête pas les autres,
  //    sauf un dépassement de quota : on s'arrête aussitôt).
  const tm = createTicketmasterClient({ apiKey });
  const byId = new Map<string, ImportEvent>();
  for (const window of buildWindows(startedAt, months)) {
    try {
      for (const event of await tm.collectWindow(window)) {
        summary.received += 1;
        const row = toImportEvent(event, startedAt);
        if (row) byId.set(row.external_id, row); // un même concert peut apparaître dans deux tranches
      }
    } catch (error) {
      summary.errors.push(error instanceof Error ? error.message : String(error));
      if (error instanceof QuotaExceededError) break;
      console.error(`Tranche ${toApiDate(window.start)} en échec`, error);
    }
  }
  summary.apiCalls = tm.calls;
  summary.importable = byId.size;

  // 2. Écriture en base, par lots (chaque lot est tout ou rien).
  if (!dryRun) {
    const rows = [...byId.values()];
    for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
      const batch = rows.slice(i, i + IMPORT_BATCH_SIZE);
      const { data, error } = await db.rpc('import_ticketmaster_events', {
        p_events: batch,
        p_seen_at: startedAt.toISOString(),
      });
      if (error) {
        summary.errors.push(`Lot ${i / IMPORT_BATCH_SIZE + 1} : ${error.message}`);
        continue;
      }
      summary.created += data?.created ?? 0;
      summary.updated += data?.updated ?? 0;
    }
  }

  if (summary.errors.length > 0) {
    summary.status = summary.created + summary.updated > 0 || (dryRun && summary.importable > 0) ? 'partial' : 'failed';
  }

  if (runId) {
    const { error } = await db
      .from('sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: summary.status,
        api_calls: summary.apiCalls,
        events_created: summary.created,
        events_updated: summary.updated,
        errors: summary.errors,
      })
      .eq('id', runId);
    if (error) summary.errors.push(`Journal non mis à jour : ${error.message}`);
  }

  return json(summary, summary.status === 'failed' ? 502 : 200);
});
