// Client minimal de la Discovery API : recherche des concerts de musique en France, au rythme
// autorisé (≤ 2 appels/s), avec découpage des tranches trop chargées (l'API ne laisse pas
// parcourir au-delà du 1000e résultat). Sans dépendance : utilisable par Deno et Node.

import { splitWindow, toApiDate, type TmEvent, type Window } from './transform.ts';

const API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
const PAGE_SIZE = 200; // maximum autorisé par l'API
const MAX_RESULTS = 1000; // pagination limitée : size × page < 1000
const MIN_WINDOW_MS = 24 * 60 * 60 * 1000; // une tranche n'est jamais coupée sous une journée
const DEFAULT_PAUSE_MS = 600; // ≈ 1,7 appel par seconde

/** Quota Ticketmaster dépassé (HTTP 429) : la synchronisation s'arrête proprement. */
export class QuotaExceededError extends Error {
  constructor() {
    super('Quota Ticketmaster dépassé (HTTP 429)');
    this.name = 'QuotaExceededError';
  }
}

type SearchPage = { events: TmEvent[]; totalElements: number; totalPages: number };

type ClientOptions = {
  apiKey: string;
  countryCode?: string;
  pauseMs?: number;
  fetchImpl?: typeof fetch;
};

export function createTicketmasterClient({
  apiKey,
  countryCode = 'FR',
  pauseMs = DEFAULT_PAUSE_MS,
  fetchImpl = fetch,
}: ClientOptions) {
  let calls = 0;
  let lastCallAt = 0;

  /** Une page de résultats pour une tranche de dates. */
  async function searchPage(window: Window, page: number): Promise<SearchPage> {
    // Respecte le rythme : au moins `pauseMs` entre deux appels.
    const wait = lastCallAt + pauseMs - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
    calls += 1;

    const url = new URL(API_URL);
    const params: Record<string, string> = {
      apikey: apiKey,
      countryCode,
      classificationName: 'music',
      startDateTime: toApiDate(window.start),
      endDateTime: toApiDate(window.end),
      size: String(PAGE_SIZE),
      page: String(page),
      sort: 'date,asc',
      locale: '*',
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const response = await fetchImpl(url);
    if (response.status === 429) throw new QuotaExceededError();
    if (!response.ok) {
      // Message sans l'adresse complète (qui contient la clé).
      throw new Error(`Ticketmaster HTTP ${response.status} (${toApiDate(window.start)} → ${toApiDate(window.end)}, page ${page})`);
    }
    const body = await response.json();
    return {
      events: body._embedded?.events ?? [],
      totalElements: body.page?.totalElements ?? 0,
      totalPages: body.page?.totalPages ?? 0,
    };
  }

  /**
   * Tous les événements d'une tranche. Si elle dépasse ce que l'API laisse parcourir, elle est
   * coupée en deux (récursivement, jusqu'à une journée).
   */
  async function collectWindow(window: Window): Promise<TmEvent[]> {
    const first = await searchPage(window, 0);
    const tooMany = first.totalElements >= MAX_RESULTS;
    if (tooMany && window.end.getTime() - window.start.getTime() > MIN_WINDOW_MS) {
      const [left, right] = splitWindow(window);
      return [...(await collectWindow(left)), ...(await collectWindow(right))];
    }
    const events = [...first.events];
    const lastPage = Math.min(first.totalPages, Math.floor((MAX_RESULTS - 1) / PAGE_SIZE) + 1);
    for (let page = 1; page < lastPage; page++) {
      events.push(...(await searchPage(window, page)).events);
    }
    return events;
  }

  return {
    collectWindow,
    /** Nombre d'appels faits à l'API depuis la création du client. */
    get calls() {
      return calls;
    },
  };
}
