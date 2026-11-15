// Vérifie si la fiche détaillée d'un concert (Discovery API, /events/{id}) contient un prix quand
// la recherche n'en donne pas (V1.1). Lecture seule, ~21 appels, rien n'est écrit en base.
// Usage (dans l'app Terminal de macOS) :
//   read -s "TICKETMASTER_API_KEY?Clé Ticketmaster : " && export TICKETMASTER_API_KEY
//   node scripts/ticketmaster-price-probe.mjs
// La clé n'est jamais affichée.

const KEY = process.env.TICKETMASTER_API_KEY;
if (!KEY) {
  console.error('Clé manquante : voir la méthode « read -s » en tête de scripts/ticketmaster-price-probe.mjs');
  process.exit(1);
}

const SAMPLE = 20;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path, params = {}) {
  await sleep(600);
  const url = new URL(`https://app.ticketmaster.com/discovery/v2/${path}`);
  for (const [key, value] of Object.entries({ ...params, apikey: KEY })) url.searchParams.set(key, String(value));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} sur ${path}`);
  return response.json();
}

// Champs qui pourraient porter un prix, selon la documentation et ce qu'on observe.
const priceFields = (event) =>
  ['priceRanges', 'products', 'ticketLimit', 'accessibility', 'ageRestrictions', 'ticketing']
    .filter((field) => event[field] !== undefined)
    .map((field) => (field === 'priceRanges' ? `priceRanges=${JSON.stringify(event.priceRanges)}` : field));

const search = await get('events.json', {
  countryCode: 'FR',
  classificationName: 'music',
  size: SAMPLE,
  sort: 'date,asc',
  locale: '*',
});
const events = search._embedded?.events ?? [];
console.log(`Recherche : ${events.length} concerts, ${events.filter((e) => e.priceRanges?.length).length} avec prix.\n`);

let detailsWithPrice = 0;
for (const event of events) {
  const detail = await get(`events/${event.id}.json`, { locale: '*' });
  const hasPrice = Boolean(detail.priceRanges?.length);
  if (hasPrice) detailsWithPrice += 1;
  const fields = priceFields(detail);
  console.log(`${hasPrice ? '€' : '·'} ${detail.name?.slice(0, 45).padEnd(45)} ${fields.join(', ') || '(aucun champ prix)'}`);
}

console.log(`\nFiches détaillées avec prix : ${detailsWithPrice}/${events.length}.`);
console.log('Rubriques présentes dans une fiche détaillée (1er concert) :', Object.keys(events[0] ? await get(`events/${events[0].id}.json`, { locale: '*' }) : {}).join(', '));
