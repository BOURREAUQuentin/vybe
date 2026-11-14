// Tests de la transformation Ticketmaster → import (Node 22+, sans dépendance) :
//   node --test supabase/functions/sync-ticketmaster/transform.test.mts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildWindows,
  mapStatus,
  normalizeCityName,
  pickImage,
  splitWindow,
  toApiDate,
  toImportEvent,
  zonedToUtc,
  type TmEvent,
} from './transform.ts';

const NOW = new Date('2026-11-14T12:00:00Z');

// Événement réaliste, calqué sur le format documenté de la Discovery API v2.
const sample: TmEvent = {
  id: 'G5vYZ9example',
  name: 'Josman - Tour 2027',
  url: 'https://www.ticketmaster.fr/fr/manifestation/josman-billet/idmanif/123',
  images: [
    { url: 'https://s1.ticketm.net/fallback.jpg', ratio: '16_9', width: 1024, fallback: true },
    { url: 'https://s1.ticketm.net/small.jpg', ratio: '16_9', width: 205, fallback: false },
    { url: 'https://s1.ticketm.net/good.jpg', ratio: '16_9', width: 1136, fallback: false },
    { url: 'https://s1.ticketm.net/square.jpg', ratio: '4_3', width: 1024, fallback: false },
  ],
  classifications: [
    {
      primary: true,
      segment: { name: 'Music' },
      genre: { name: 'Hip-Hop/Rap' },
      subGenre: { name: 'French Rap' },
      type: { name: 'Undefined' },
      subType: { name: 'Undefined' },
    },
  ],
  priceRanges: [{ type: 'standard', currency: 'EUR', min: 39, max: 55 }],
  sales: { public: { startDateTime: '2026-10-01T08:00:00Z', startTBD: false } },
  dates: {
    timezone: 'Europe/Paris',
    status: { code: 'onsale' },
    start: { localDate: '2027-03-12', localTime: '20:00:00', dateTime: '2027-03-12T19:00:00Z' },
  },
  _embedded: {
    venues: [
      {
        id: 'KovZ9177example',
        name: 'Zénith Nantes Métropole',
        postalCode: '44800',
        address: { line1: 'Boulevard du Zénith' },
        city: { name: 'SAINT-HERBLAIN' },
        country: { countryCode: 'FR' },
        location: { latitude: '47.2290', longitude: '-1.6276' },
      },
    ],
    attractions: [
      {
        id: 'K8vZ917Josman',
        name: 'Josman',
        url: 'https://www.ticketmaster.fr/fr/artiste/josman',
        images: [{ url: 'https://s1.ticketm.net/josman.jpg', ratio: '3_2', width: 1024 }],
        classifications: [{ primary: true, genre: { name: 'Hip-Hop/Rap' }, subGenre: { name: 'Undefined' } }],
      },
      { id: 'K8vZ917Guest', name: 'Invité' },
    ],
  },
};

test('événement complet : champs, salle, ville, artistes', () => {
  const result = toImportEvent(sample, NOW);
  assert.ok(result);
  assert.equal(result.external_id, 'G5vYZ9example');
  assert.equal(result.type, 'concert');
  assert.equal(result.status, 'on_sale');
  assert.equal(result.starts_at, '2027-03-12T19:00:00Z');
  assert.equal(result.time_tba, false);
  assert.equal(result.price_min, 39);
  assert.equal(result.price_max, 55);
  assert.equal(result.image_url, 'https://s1.ticketm.net/good.jpg');
  assert.equal(result.genre, 'Hip-Hop/Rap');
  assert.equal(result.sub_genre, 'French Rap');
  assert.deepEqual(result.venue?.city, { name: 'Saint-Herblain', country_code: 'FR' });
  assert.equal(result.venue?.latitude, 47.229);
  assert.deepEqual(
    result.attractions.map((a) => [a.external_id, a.genre, a.sub_genre]),
    [
      ['K8vZ917Josman', 'Hip-Hop/Rap', null],
      ['K8vZ917Guest', null, null],
    ],
  );
});

test('horaire inconnu : heure locale par défaut convertie en UTC, marqué « à confirmer »', () => {
  const result = toImportEvent(
    { ...sample, dates: { timezone: 'Europe/Paris', start: { localDate: '2027-07-01', timeTBA: true } } },
    NOW,
  );
  assert.equal(result?.starts_at, '2027-07-01T18:00:00.000Z'); // 20h00 à Paris en été = 18h00 UTC
  assert.equal(result?.time_tba, true);
});

test('événement sans date ou sans nom ignoré', () => {
  assert.equal(toImportEvent({ ...sample, dates: { start: { dateTBA: true } } }, NOW), null);
  assert.equal(toImportEvent({ ...sample, name: '  ' }, NOW), null);
});

test('salle sans ville : concert importé sans salle', () => {
  const result = toImportEvent({ ...sample, _embedded: { venues: [{ id: 'X', name: 'Salle' }] } }, NOW);
  assert.equal(result?.venue, null);
});

test('statuts', () => {
  const withCode = (code: string, saleStart?: string): TmEvent => ({
    ...sample,
    dates: { ...sample.dates, status: { code } },
    sales: saleStart ? { public: { startDateTime: saleStart } } : undefined,
  });
  assert.equal(mapStatus(withCode('canceled'), NOW), 'cancelled');
  assert.equal(mapStatus(withCode('postponed'), NOW), 'postponed');
  assert.equal(mapStatus(withCode('offsale', '2027-01-10T09:00:00Z'), NOW), 'announced'); // vente à venir
  assert.equal(mapStatus(withCode('offsale', '2026-09-01T09:00:00Z'), NOW), 'sold_out'); // vente terminée
  assert.equal(mapStatus(withCode('rescheduled', '2026-09-01T09:00:00Z'), NOW), 'on_sale');
  assert.equal(mapStatus(withCode('inconnu'), NOW), 'announced');
});

test('festival détecté par sa classification', () => {
  const festival = toImportEvent(
    { ...sample, classifications: [{ primary: true, genre: { name: 'Pop' }, type: { name: 'Festival' } }] },
    NOW,
  );
  assert.equal(festival?.type, 'festival');
});

test('prix incohérents remis dans l’ordre', () => {
  const result = toImportEvent({ ...sample, priceRanges: [{ type: 'standard', min: 60, max: 40 }] }, NOW);
  assert.deepEqual([result?.price_min, result?.price_max], [40, 60]);
});

test('utilitaires : villes, images, fuseau, tranches', () => {
  assert.equal(normalizeCityName('PARIS'), 'Paris');
  assert.equal(normalizeCityName("VILLENEUVE-D'ASCQ"), "Villeneuve-d'Ascq");
  assert.equal(normalizeCityName('BOULOGNE-SUR-MER'), 'Boulogne-sur-Mer');
  assert.equal(normalizeCityName('SAINT-NAZAIRE'), 'Saint-Nazaire');
  assert.equal(normalizeCityName('Lyon'), 'Lyon');
  assert.equal(pickImage([{ url: 'a', fallback: true }]), null);
  assert.equal(zonedToUtc('2027-01-15', '20:00:00', 'Europe/Paris'), '2027-01-15T19:00:00.000Z'); // hiver : UTC+1

  const windows = buildWindows(NOW, 6);
  assert.ok(windows.length >= 26 && windows.length <= 27);
  assert.equal(windows[0].start.getTime(), NOW.getTime());
  assert.ok(windows.every((w, i) => i === 0 || w.start.getTime() === windows[i - 1].end.getTime()));
  const [left, right] = splitWindow(windows[0]);
  assert.equal(left.end.getTime(), right.start.getTime());
  assert.equal(toApiDate(NOW), '2026-11-14T12:00:00Z');
});
