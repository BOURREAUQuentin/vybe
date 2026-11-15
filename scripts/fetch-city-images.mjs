// Trouve une photo libre pour des villes (V1.1) : photo principale (P18) de la fiche Wikidata de
// la commune, licence vérifiée sur Wikimedia Commons, version 640 px téléchargée.
//
// Usage : node scripts/fetch-city-images.mjs <villes.json> <dossier-de-sortie>
//   villes.json : [{ "id", "name", "lat", "lng" }] (villes sans photo, exportées de la base)
// Sortie : <dossier>/<fichier>.jpg + <dossier>/manifest.json (photos retenues) + skipped.json,
// enregistrés après CHAQUE ville : on peut relancer la commande après une interruption, les villes
// déjà traitées sont passées et une image déjà téléchargée n'est pas retéléchargée.
// L'envoi dans Storage et la mise à jour de la base se font ensuite (voir README).
//
// Garde-fous : bonne commune (coordonnées à moins de 30 km de nos salles, ou commune française au
// nom identique), vraie photo (JPEG, ni blason, ni carte, ni logo, ni montage), licence libre
// (domaine public, CC0, CC BY, CC BY-SA). Appels espacés, reprise automatique si Wikimedia
// demande de ralentir (HTTP 429). Aucune donnée personnelle envoyée.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error('Usage : node scripts/fetch-city-images.mjs <villes.json> <dossier-de-sortie>');
  process.exit(1);
}

const HEADERS = { 'User-Agent': 'VybeCityImages/1.0 (application étudiante)' };
const PAUSE_MS = 400;
const TIMEOUT_MS = 20_000; // un appel sans réponse au bout de 20 s est abandonné (jamais de blocage)
const MAX_DISTANCE_KM = 30;
const THUMB_WIDTH = 640;
const FRENCH_COMMUNE = 'Q484170';
const NOT_A_PHOTO = /blason|armoiries|coat[_ ]of[_ ]arms|logo|carte|map|plan[_ ]|location|montage|collage|drapeau|flag|panneau|sign/i;
const FREE_LICENSE = /^(public domain|cc0|cc[- ]by(-sa)?[- ][\d.]+)/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempt = 0) {
  await sleep(PAUSE_MS);
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status === 429 && attempt < 5) {
    await sleep(5000 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const wikidata = (params) =>
  getJson(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`);
const commons = (params) =>
  getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`);

const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const claimValues = (entity, property) =>
  (entity.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean);

/** Fiche Wikidata de la commune (avec photo) correspondant à la ville, ou une raison d'échec. */
async function findCommune(city) {
  const search = await wikidata({ action: 'wbsearchentities', search: city.name, language: 'fr', uselang: 'fr', type: 'item', limit: '8' });
  const ids = (search.search ?? []).map((result) => result.id);
  if (ids.length === 0) return { reason: 'aucune fiche Wikidata' };
  const { entities } = await wikidata({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels', languages: 'fr' });

  const candidates = ids
    .map((id) => entities[id])
    .filter(Boolean)
    .map((entity) => {
      const coords = claimValues(entity, 'P625')[0];
      return {
        id: entity.id,
        label: entity.labels?.fr?.value ?? '',
        image: claimValues(entity, 'P18')[0] ?? null,
        isCommune: claimValues(entity, 'P31').some((value) => value.id === FRENCH_COMMUNE),
        distance:
          coords && city.lat != null && city.lng != null
            ? distanceKm(Number(city.lat), Number(city.lng), coords.latitude, coords.longitude)
            : null,
      };
    });

  let match;
  if (city.lat != null && city.lng != null) {
    match = candidates
      .filter((c) => c.distance !== null && c.distance <= MAX_DISTANCE_KM && (c.isCommune || normalize(c.label) === normalize(city.name)))
      .sort((a, b) => a.distance - b.distance)[0];
  } else {
    match = candidates.find((c) => c.isCommune && normalize(c.label) === normalize(city.name));
  }
  if (!match) return { reason: 'commune introuvable (nom ou position)' };
  if (!match.image) return { reason: `pas de photo principale (${match.id})` };
  return { commune: match };
}

/** Licence, auteur et miniature de la photo sur Commons, ou une raison d'échec. */
async function describeImage(fileName) {
  if (!/\.jpe?g$/i.test(fileName)) return { reason: `pas un JPEG (${fileName})` };
  if (NOT_A_PHOTO.test(fileName)) return { reason: `pas une photo de ville (${fileName})` };
  const data = await commons({
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: String(THUMB_WIDTH),
  });
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return { reason: `fichier introuvable (${fileName})` };
  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? '';
  if (!FREE_LICENSE.test(license)) return { reason: `licence non retenue (${license || 'inconnue'})` };
  const author = (meta.Artist?.value ?? 'Auteur inconnu').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    image: {
      url: info.thumburl.split('?')[0],
      credit: `${author.slice(0, 120)} · ${license}`,
      source: info.descriptionurl,
      ratio: info.width / info.height,
    },
  };
}

const slug = (city) =>
  `${normalize(city.name).replace(/ /g, '-')}-${city.id.slice(0, 8)}.jpg`;

const cities = JSON.parse(readFileSync(input, 'utf8'));
mkdirSync(outDir, { recursive: true });
const manifestPath = join(outDir, 'manifest.json');
const skippedPath = join(outDir, 'skipped.json');
const readList = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : []);
const manifest = readList(manifestPath);
const skipped = readList(skippedPath);
const done = new Set([...manifest.map((item) => item.id), ...skipped.map((item) => item.id)]);
const save = () => {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  writeFileSync(skippedPath, JSON.stringify(skipped, null, 1));
};

for (const [index, city] of cities.entries()) {
  if (done.has(city.id)) continue; // déjà traitée lors d'un passage précédent
  try {
    const { commune, reason } = await findCommune(city);
    if (!commune) {
      skipped.push({ id: city.id, name: city.name, reason });
      save();
      continue;
    }
    const described = await describeImage(commune.image);
    if (!described.image) {
      skipped.push({ id: city.id, name: city.name, reason: described.reason });
      save();
      continue;
    }
    if (described.image.ratio < 0.6 || described.image.ratio > 3) {
      skipped.push({ id: city.id, name: city.name, reason: `cadrage inadapté (${described.image.ratio.toFixed(2)})` });
      save();
      continue;
    }
    const file = slug(city);
    if (!existsSync(join(outDir, file))) {
      await sleep(PAUSE_MS);
      const response = await fetch(described.image.url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`téléchargement HTTP ${response.status}`);
      writeFileSync(join(outDir, file), Buffer.from(await response.arrayBuffer()));
    }
    manifest.push({ id: city.id, name: city.name, file, credit: described.image.credit, source: described.image.source, wikidata: commune.id });
    save();
  } catch (error) {
    // Erreur passagère (délai dépassé, réseau) : la ville n'est pas notée, une relance la reprendra.
    console.error(`${city.name} : ${error.message}`);
  }
  if ((index + 1) % 25 === 0) console.log(`${index + 1}/${cities.length} villes · ${manifest.length} photos`);
}

save();
console.log(`Terminé : ${manifest.length} photos, ${skipped.length} villes sans photo.`);
