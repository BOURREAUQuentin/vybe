// Transformation d'un événement de la Discovery API (Ticketmaster) vers le format attendu par la
// fonction SQL import_ticketmaster_events. Fonctions pures, sans dépendance : utilisées par la
// fonction serveur (Deno) et testées avec Node (transform.test.ts).

// ---------------------------------------------------------------------------
// Types (sous-ensemble utile de la réponse de l'API)
// ---------------------------------------------------------------------------

export type TmImage = { url: string; ratio?: string; width?: number; height?: number; fallback?: boolean };
type TmNamed = { id?: string; name?: string };
export type TmClassification = {
  primary?: boolean;
  segment?: TmNamed;
  genre?: TmNamed;
  subGenre?: TmNamed;
  type?: TmNamed;
  subType?: TmNamed;
};
export type TmVenue = {
  id: string;
  name?: string;
  url?: string;
  postalCode?: string;
  address?: { line1?: string };
  city?: { name?: string };
  country?: { countryCode?: string };
  location?: { latitude?: string; longitude?: string };
};
export type TmAttraction = {
  id: string;
  name?: string;
  url?: string;
  images?: TmImage[];
  classifications?: TmClassification[];
};
export type TmEvent = {
  id: string;
  name?: string;
  url?: string;
  images?: TmImage[];
  classifications?: TmClassification[];
  priceRanges?: { type?: string; currency?: string; min?: number; max?: number }[];
  sales?: { public?: { startDateTime?: string; startTBD?: boolean } };
  dates?: {
    timezone?: string;
    status?: { code?: string };
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      dateTBD?: boolean;
      dateTBA?: boolean;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
  };
  _embedded?: { venues?: TmVenue[]; attractions?: TmAttraction[] };
};

/** Format d'un concert attendu par import_ticketmaster_events (voir la migration ticketmaster_import). */
export type ImportEvent = {
  external_id: string;
  name: string;
  type: 'concert' | 'festival';
  status: 'announced' | 'on_sale' | 'sold_out' | 'postponed' | 'cancelled' | 'past';
  starts_at: string;
  time_tba: boolean;
  on_sale_at: string | null;
  ticket_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  image_url: string | null;
  genre: string | null;
  sub_genre: string | null;
  venue: {
    external_id: string;
    name: string;
    address: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    url: string | null;
    city: { name: string; country_code: string };
  } | null;
  attractions: {
    external_id: string;
    name: string;
    image_url: string | null;
    url: string | null;
    genre: string | null;
    sub_genre: string | null;
  }[];
};

const DEFAULT_TIMEZONE = 'Europe/Paris';
/** Heure retenue quand la source n'a pas encore annoncé l'horaire (affiché « horaire à confirmer »). */
const DEFAULT_LOCAL_TIME = '20:00:00';
/** Largeur visée pour les images (cartes et en-têtes de l'app). */
const TARGET_IMAGE_WIDTH = 1024;

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------

/** « Undefined » et chaînes vides de l'API → null. */
function clean(value: string | undefined | null): string | null {
  const text = value?.trim();
  if (!text || /^undefined$/i.test(text)) return null;
  return text;
}

/** Petits mots qui restent en minuscules au milieu d'un nom (« Aix-en-Provence », « Le Rex de Toulouse »). */
const PARTICLES = new Set([
  'd', 'de', 'du', 'des', 'la', 'le', 'les', 'l', 'sur', 'sous', 'en', 'lès', 'et', 'à', 'au', 'aux',
]);
/** Articles qui ouvrent un nom de ville et restent séparés par un espace (« Le Havre »). */
const LEADING_ARTICLES = new Set(['le', 'la', 'les']);

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Mot d'un nom : particule en minuscules (sauf en tête), « d'ascq » → « d'Ascq », sinon majuscule initiale. */
function formatWord(word: string, isFirst: boolean): string {
  const elided = /^([dl])['’](.+)$/i.exec(word);
  if (elided) {
    const article = isFirst ? elided[1].toUpperCase() : elided[1].toLowerCase();
    return `${article}'${capitalize(elided[2])}`;
  }
  if (!isFirst && PARTICLES.has(word.toLowerCase())) return word.toLowerCase();
  return capitalize(word);
}

/**
 * Nom de ville à la française, pour éviter les doublons (« St Nazaire » ≠ « Saint-Nazaire ») :
 * « St Herblain » → « Saint-Herblain », « Aix En Provence » → « Aix-en-Provence »,
 * « CLERMONT FERRAND » → « Clermont-Ferrand », « Les Sables D'Olonne » → « Les Sables-d'Olonne »,
 * « Le Havre » reste « Le Havre ». Les accents absents de la source ne peuvent pas être restitués.
 */
export function normalizeCityName(name: string): string {
  // Tout ce qui suit une virgule n'est pas le nom (« Nantes, France » → « Nantes ») ; « Cedex » (et
  // son numéro) est une mention postale : « Castres Cedex » → « Castres ».
  const trimmed = name
    .split(',')[0]
    .trim()
    .replace(/[\s-]*\bcedex\b[\s\d]*$/i, '')
    .replace(/\s+/g, ' ');
  const base = trimmed === trimmed.toUpperCase() ? trimmed.toLowerCase() : trimmed;
  const words = base
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => (/^st\.?$/i.test(word) ? 'Saint' : /^ste\.?$/i.test(word) ? 'Sainte' : word))
    // Élision sans apostrophe ou détachée : « Sables D Olonne », « Sables D' Olonne » → « d'Olonne ».
    .reduce<string[]>((acc, word) => {
      const previous = acc[acc.length - 1];
      if (previous !== undefined && /^[dl]['’]?$/i.test(previous)) {
        acc[acc.length - 1] = `${previous.charAt(0)}'${word}`;
      } else {
        acc.push(word);
      }
      return acc;
    }, []);

  const startsWithArticle = words.length > 1 && LEADING_ARTICLES.has(words[0].toLowerCase());
  const formatted = words.map((word, index) => formatWord(word, index === 0 || (startsWithArticle && index === 1)));
  return startsWithArticle ? `${formatted[0]} ${formatted.slice(1).join('-')}` : formatted.join('-');
}

/**
 * Nom de salle écrit tout en majuscules → casse normale (« LE REX DE TOULOUSE » → « Le Rex de
 * Toulouse »). Les sigles sans voyelle restent en majuscules (« LDLC ARENA » → « LDLC Arena »).
 * Un nom déjà en casse mixte est gardé. Les noms d'artistes ne passent jamais par ici (PLK, SCH…).
 */
export function normalizeVenueName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed !== trimmed.toUpperCase() || !/\p{L}/u.test(trimmed)) return trimmed;
  return trimmed
    .split(' ')
    .map((word, index) => (/^[^AEIOUYÀÂÉÈÊËÎÏÔÛÙÜ]+$/u.test(word) && /\p{L}{2,}/u.test(word) ? word : formatWord(word.toLowerCase(), index === 0)))
    .join(' ');
}

/** Segments Ticketmaster retenus : uniquement la musique (pas le cinéma, le théâtre, l'humour…). */
const MUSIC_SEGMENT = 'Music';

function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Image la plus adaptée : une vraie image (pas l'image générique de secours), au format paysage
 * 16:9 ou 3:2, de largeur la plus proche de TARGET_IMAGE_WIDTH.
 */
export function pickImage(images: TmImage[] | undefined): string | null {
  const candidates = (images ?? []).filter((image) => image.url && !image.fallback);
  if (candidates.length === 0) return null;
  const score = (image: TmImage) =>
    (image.ratio === '16_9' || image.ratio === '3_2' ? 0 : 10_000) + Math.abs((image.width ?? 0) - TARGET_IMAGE_WIDTH);
  return [...candidates].sort((a, b) => score(a) - score(b))[0].url;
}

/** Classification principale (genre, sous-genre, type). */
function mainClassification(classifications: TmClassification[] | undefined): TmClassification | undefined {
  return classifications?.find((c) => c.primary) ?? classifications?.[0];
}

/**
 * Instant UTC d'une date et heure locales dans un fuseau (ex. 2026-12-01 20:00 à Paris → 19:00Z).
 * Calcule le décalage du fuseau à cet instant (heure d'été comprise).
 */
export function zonedToUtc(localDate: string, localTime: string, timeZone: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute, second = 0] = localTime.split(':').map(Number);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(asIfUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const zoned = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return new Date(asIfUtc - (zoned - asIfUtc)).toISOString();
}

// ---------------------------------------------------------------------------
// Statut et type
// ---------------------------------------------------------------------------

/**
 * Statut Vybe à partir du code Ticketmaster (dates.status.code) :
 * - onsale → billetterie ouverte ; canceled → annulé ; postponed → reporté ;
 * - rescheduled (nouvelle date) → billetterie ouverte si la vente a commencé, sinon annoncé ;
 * - offsale → annoncé si la vente n'a pas encore commencé, sinon complet (vente terminée).
 */
export function mapStatus(event: TmEvent, now: Date): ImportEvent['status'] {
  const code = event.dates?.status?.code;
  const saleStart = event.sales?.public?.startDateTime;
  const saleStarted = !saleStart || event.sales?.public?.startTBD ? false : new Date(saleStart) <= now;

  switch (code) {
    case 'onsale':
      return 'on_sale';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'postponed':
      return 'postponed';
    case 'rescheduled':
      return saleStarted ? 'on_sale' : 'announced';
    case 'offsale':
      return saleStarted ? 'sold_out' : 'announced';
    default:
      return 'announced';
  }
}

/** Mots du nom qui signalent un festival ou un pass de festival (« PASS 1 JOUR »). */
const FESTIVAL_NAME = /\b(festival|fest|pass)\b/i;
/** Formules de vente (packs VIP, hospitalité…) : pas des événements, ignorées à l'import. */
const PACKAGE_NAME = /\bpackages?\b/i;

/**
 * Festival si une classification l'indique (type ou sous-type « Festival »), ou si le nom le dit
 * (« … FESTIVAL 2026 », « PASS 1 JOUR ») : Ticketmaster classe souvent ces événements en simple
 * « musique ». Les festivals sont enregistrés mais pas affichés avant la V2.3.
 */
export function isFestival(event: TmEvent): boolean {
  const byClassification = (event.classifications ?? []).some((c) =>
    [c.type?.name, c.subType?.name].some((name) => /festival/i.test(name ?? '')),
  );
  return byClassification || FESTIVAL_NAME.test(event.name ?? '');
}

/** Formule de vente (« PACKAGE GOSPEL… », « VIP PACKAGE ») plutôt qu'un événement. */
export function isPackage(event: TmEvent): boolean {
  return PACKAGE_NAME.test(event.name ?? '');
}

// ---------------------------------------------------------------------------
// Événement complet
// ---------------------------------------------------------------------------

/**
 * Événement Ticketmaster → concert à importer, ou null s'il est inexploitable
 * (pas de nom ou pas de date connue). `now` sert au statut (vente commencée ou non).
 */
export function toImportEvent(event: TmEvent, now: Date): ImportEvent | null {
  const name = clean(event.name);
  const start = event.dates?.start;
  if (!name || !start) return null;

  // Date : l'instant exact quand il est fourni, sinon la date locale (+ heure par défaut).
  let startsAt: string | null = start.dateTime ?? null;
  const timeTba = Boolean(start.timeTBA || start.noSpecificTime || !start.localTime);
  if (!startsAt) {
    if (!start.localDate || start.dateTBD || start.dateTBA) return null;
    startsAt = zonedToUtc(start.localDate, start.localTime ?? DEFAULT_LOCAL_TIME, event.dates?.timezone ?? DEFAULT_TIMEZONE);
  }

  const classification = mainClassification(event.classifications);
  // Hors musique (film, théâtre, humour…) : ignoré, même s'il remonte avec le filtre « musique ».
  const segment = clean(classification?.segment?.name);
  if (segment && segment !== MUSIC_SEGMENT) return null;
  // Formule de vente (pack VIP, hospitalité…) : doublon commercial d'un vrai concert, ignorée.
  if (isPackage(event)) return null;
  const price = event.priceRanges?.find((range) => range.type === 'standard') ?? event.priceRanges?.[0];
  const priceMin = typeof price?.min === 'number' ? price.min : null;
  const priceMax = typeof price?.max === 'number' ? price.max : null;

  const rawVenue = event._embedded?.venues?.[0];
  const cityName = clean(rawVenue?.city?.name);
  const venue =
    rawVenue?.id && cityName
      ? {
          external_id: rawVenue.id,
          name: normalizeVenueName(clean(rawVenue.name) ?? 'Salle à confirmer'),
          address: clean(rawVenue.address?.line1),
          postal_code: clean(rawVenue.postalCode),
          latitude: toNumber(rawVenue.location?.latitude),
          longitude: toNumber(rawVenue.location?.longitude),
          url: clean(rawVenue.url),
          city: { name: normalizeCityName(cityName), country_code: rawVenue.country?.countryCode ?? 'FR' },
        }
      : null;

  const attractions = (event._embedded?.attractions ?? [])
    .filter((attraction) => attraction.id && clean(attraction.name))
    .map((attraction) => {
      const c = mainClassification(attraction.classifications);
      return {
        external_id: attraction.id,
        name: clean(attraction.name) as string,
        image_url: pickImage(attraction.images),
        url: clean(attraction.url),
        genre: clean(c?.genre?.name),
        sub_genre: clean(c?.subGenre?.name),
      };
    });

  return {
    external_id: event.id,
    name,
    type: isFestival(event) ? 'festival' : 'concert',
    status: mapStatus(event, now),
    starts_at: startsAt,
    time_tba: timeTba,
    on_sale_at: event.sales?.public?.startTBD ? null : (event.sales?.public?.startDateTime ?? null),
    ticket_url: clean(event.url),
    // Prix cohérents uniquement (le minimum ne dépasse jamais le maximum).
    price_min: priceMin !== null && priceMax !== null && priceMin > priceMax ? priceMax : priceMin,
    price_max: priceMin !== null && priceMax !== null && priceMin > priceMax ? priceMin : priceMax,
    currency: price?.currency ?? 'EUR',
    image_url: pickImage(event.images),
    genre: clean(classification?.genre?.name),
    sub_genre: clean(classification?.subGenre?.name),
    venue,
    attractions,
  };
}

// ---------------------------------------------------------------------------
// Découpage de la période en tranches
// ---------------------------------------------------------------------------

export type Window = { start: Date; end: Date };

/** Tranches d'une semaine de `now` à `now + months` (la dernière est raccourcie). */
export function buildWindows(now: Date, months: number, days = 7): Window[] {
  const end = new Date(now);
  end.setUTCMonth(end.getUTCMonth() + months);
  const windows: Window[] = [];
  for (let start = new Date(now); start < end; ) {
    const next = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    windows.push({ start, end: next < end ? next : end });
    start = next;
  }
  return windows;
}

/** Coupe une tranche en deux (quand elle contient plus de résultats que l'API n'en laisse parcourir). */
export function splitWindow(window: Window): [Window, Window] {
  const middle = new Date((window.start.getTime() + window.end.getTime()) / 2);
  return [
    { start: window.start, end: middle },
    { start: middle, end: window.end },
  ];
}

/** Format de date attendu par l'API : 2026-11-14T00:00:00Z (sans millisecondes). */
export function toApiDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
