// Sonde la Discovery API de Ticketmaster pour cadrer la V1.1 (aucune écriture, aucune base).
// Usage (dans l'app Terminal de macOS, pour que la clé n'apparaisse pas dans Claude Code) :
//   read -s "TICKETMASTER_API_KEY?Clé Ticketmaster : " && export TICKETMASTER_API_KEY
//   node scripts/ticketmaster-probe.mjs
// (`read -s` cache la saisie et évite que la clé reste dans l'historique du terminal.)
//
// Affiche : nombre de concerts de musique en France sur 6 mois (par mois), genres et sous-genres,
// part des événements avec prix / images, statuts, villes principales, exemples rap.
// La clé n'est jamais affichée ni enregistrée.

const KEY = process.env.TICKETMASTER_API_KEY;
if (!KEY) {
  console.error('Clé manquante : voir la méthode « read -s » en tête de scripts/ticketmaster-probe.mjs');
  process.exit(1);
}

const BASE = 'https://app.ticketmaster.com/discovery/v2/events.json';
const PAGE_SIZE = 200;
const MONTHS = 6;
const PAUSE_MS = 600; // < 2 appels par seconde
let calls = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Format attendu par l'API : 2026-11-14T00:00:00Z (sans millisecondes).
const iso = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

async function search(params) {
  const url = new URL(BASE);
  for (const [key, value] of Object.entries({ ...params, apikey: KEY })) url.searchParams.set(key, String(value));
  await sleep(PAUSE_MS);
  calls += 1;
  const response = await fetch(url);
  if (response.status === 429) throw new Error('Quota dépassé (HTTP 429)');
  if (!response.ok) throw new Error(`HTTP ${response.status} : ${(await response.text()).slice(0, 200)}`);
  return response.json();
}

const count = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const top = (map, n = 15) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ');

const now = new Date();
const events = [];
console.log('Concerts de musique en France, par mois :');
for (let m = 0; m < MONTHS; m++) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, m === 0 ? now.getUTCDate() : 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m + 1, 1));
  const first = await search({
    countryCode: 'FR',
    classificationName: 'music',
    startDateTime: iso(start),
    endDateTime: iso(end),
    size: PAGE_SIZE,
    sort: 'date,asc',
    locale: '*',
  });
  const total = first.page?.totalElements ?? 0;
  console.log(`  ${start.toISOString().slice(0, 7)} : ${total} événements${total >= 1000 ? ' (≥ 1000 : il faudra découper plus finement)' : ''}`);
  events.push(...(first._embedded?.events ?? []));
}

const genres = new Map();
const subGenres = new Map();
const statuses = new Map();
const cities = new Map();
const types = new Map();
let withPrice = 0;
let withImage = 0;
let withAttraction = 0;
const rapSamples = [];

for (const event of events) {
  const c = event.classifications?.[0];
  count(genres, c?.genre?.name ?? '(aucun)');
  count(subGenres, `${c?.genre?.name ?? '?'} / ${c?.subGenre?.name ?? '?'}`);
  count(types, c?.type?.name ?? c?.segment?.name ?? '(aucun)');
  count(statuses, event.dates?.status?.code ?? '(aucun)');
  count(cities, event._embedded?.venues?.[0]?.city?.name ?? '(aucune)');
  if (event.priceRanges?.length) withPrice += 1;
  if (event.images?.some((image) => !image.fallback)) withImage += 1;
  if (event._embedded?.attractions?.length) withAttraction += 1;
  if (/rap|hip/i.test(c?.genre?.name ?? '') && rapSamples.length < 10) {
    rapSamples.push(`${event.dates?.start?.localDate} · ${event.name} · ${event._embedded?.venues?.[0]?.name ?? '?'}`);
  }
}

const pct = (n) => (events.length ? `${Math.round((100 * n) / events.length)} %` : '–');
console.log(`\nÉchantillon analysé : ${events.length} événements (premières pages de chaque mois), ${calls} appels.`);
console.log(`Avec prix : ${pct(withPrice)} · avec image propre : ${pct(withImage)} · avec artiste : ${pct(withAttraction)}`);
console.log(`\nStatuts : ${top(statuses)}`);
console.log(`\nGenres : ${top(genres, 25)}`);
console.log(`\nGenre / sous-genre : ${top(subGenres, 25)}`);
console.log(`\nTypes : ${top(types)}`);
console.log(`\nVilles : ${top(cities, 20)}`);
console.log(`\nExemples rap / hip-hop :\n  ${rapSamples.join('\n  ') || '(aucun dans l’échantillon)'}`);
