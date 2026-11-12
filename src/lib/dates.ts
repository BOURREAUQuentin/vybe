// Formatage des dates en français, toujours dans le fuseau de Paris.
//
// On ne demande au moteur JavaScript que des CHIFFRES (année, mois, jour, heure, minute),
// puis on écrit nous-mêmes les noms français. Raison : sur iPhone, Hermes gère mal
// Intl.DateTimeFormat#formatToParts (morceaux manquants ou mal étiquetés), ce qui
// affichait par exemple « 30h » au lieu de « 20h30 ».

const TIME_ZONE = 'Europe/Paris';

const WEEKDAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];
const MONTHS_LONG = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// Format numérique stable : « 11/14/2026, 20:00 » (mois/jour/année, heure:minute).
const numericFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

type ParisDate = {
  year: number;
  month: number; // 1 à 12
  day: number;
  weekday: number; // 0 = dimanche
  hour: number;
  minute: number;
};

export function getParisDate(date: Date): ParisDate {
  const numbers = numericFormatter.format(date).match(/\d+/g)?.map(Number);

  // Repli de sécurité si le format n'est pas celui attendu : heure locale du téléphone.
  const [month, day, year, hour, minute] =
    numbers && numbers.length === 5
      ? numbers
      : [date.getMonth() + 1, date.getDate(), date.getFullYear(), date.getHours(), date.getMinutes()];

  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    hour: hour % 24, // certains moteurs écrivent minuit « 24 »
    minute,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');
const formatTime = ({ hour, minute }: ParisDate) => `${pad(hour)}h${pad(minute)}`;

/** « sam. 21 mars · 20h00 », ou « sam. 21 mars · horaire à confirmer ». */
export function formatEventDate(isoDate: string, timeTba = false): string {
  const paris = getParisDate(new Date(isoDate));
  const date = `${WEEKDAYS_SHORT[paris.weekday]} ${paris.day} ${MONTHS_SHORT[paris.month - 1]}`;
  return `${date} · ${timeTba ? 'horaire à confirmer' : formatTime(paris)}`;
}

/** « samedi 14 novembre » (année ajoutée si elle diffère de l'année en cours). */
function formatLongDate(paris: ParisDate): string {
  const currentYear = getParisDate(new Date()).year;
  const year = paris.year !== currentYear ? ` ${paris.year}` : '';
  return `${WEEKDAYS_LONG[paris.weekday]} ${paris.day} ${MONTHS_LONG[paris.month - 1]}${year}`;
}

/** « samedi 14 novembre · 20h00 ». */
export function formatEventDateLong(isoDate: string, timeTba = false): string {
  const paris = getParisDate(new Date(isoDate));
  return `${formatLongDate(paris)} · ${timeTba ? 'horaire à confirmer' : formatTime(paris)}`;
}

/** « jeudi 3 décembre à 10h00 ». */
export function formatDayAndTime(isoDate: string): string {
  const paris = getParisDate(new Date(isoDate));
  return `${formatLongDate(paris)} à ${formatTime(paris)}`;
}

/** Clé de regroupement par mois : « 2026-12 ». */
export function getMonthKey(isoDate: string): string {
  const { year, month } = getParisDate(new Date(isoDate));
  return `${year}-${pad(month)}`;
}

/** Intertitre de mois : « décembre », ou « janvier 2027 » si l'année diffère de l'année en cours. */
export function formatMonthTitle(isoDate: string, now: Date = new Date()): string {
  const { year, month } = getParisDate(new Date(isoDate));
  const currentYear = getParisDate(now).year;
  return `${MONTHS_LONG[month - 1]}${year !== currentYear ? ` ${year}` : ''}`;
}

/** Vrai si la date tombe dans les `days` prochains jours à partir de `now`. */
export function isWithinNextDays(isoDate: string, days: number, now: Date = new Date()): boolean {
  const time = new Date(isoDate).getTime();
  return time >= now.getTime() && time < now.getTime() + days * 24 * 60 * 60 * 1000;
}

/** Jour et mois pour le bloc date des cartes : { day: '21', month: 'MARS' }. */
export function getDateBlock(isoDate: string): { day: string; month: string } {
  const paris = getParisDate(new Date(isoDate));
  return {
    day: String(paris.day),
    month: MONTHS_SHORT[paris.month - 1].replace('.', '').toUpperCase(),
  };
}

// ---------------------------------------------------------------------------
// Périodes des filtres (V1.2), calculées à l'heure de Paris.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Instant correspondant à une heure « murale » de Paris (ex. vendredi 18h00).
 * Le jour peut déborder (32 → 1er du mois suivant) : Date.UTC normalise.
 */
export function fromParisWallClock(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Décalage de Paris à cet instant (+1 h en hiver, +2 h en été).
  const paris = getParisDate(new Date(asIfUtc));
  const offset =
    Date.UTC(paris.year, paris.month - 1, paris.day, paris.hour, paris.minute) - asIfUtc;
  return new Date(asIfUtc - offset);
}

export type DatePreset = 'all' | 'today' | 'weekend' | 'week' | 'month';

export const datePresetLabels: Record<DatePreset, string> = {
  all: 'Toutes les dates',
  today: 'Aujourd’hui',
  weekend: 'Ce week-end',
  week: 'Cette semaine',
  month: 'Ce mois-ci',
};

/**
 * Bornes d'une période : de `from` (inclus) à `to` (exclu, ou null = sans fin).
 * - Aujourd'hui : jusqu'à minuit (Paris).
 * - Ce week-end : du vendredi 18h00 au lundi 00h00 (ou à partir de maintenant si le week-end a commencé).
 * - Cette semaine : les 7 prochains jours (comme la section de Découvrir).
 * - Ce mois-ci : jusqu'au 1er du mois suivant.
 */
export function getDateRange(preset: DatePreset, now: Date = new Date()): { from: Date; to: Date | null } {
  const today = getParisDate(now);
  const at = (dayOffset: number, hour = 0) =>
    fromParisWallClock(today.year, today.month, today.day + dayOffset, hour);
  const fromNowOr = (start: Date) => (start.getTime() > now.getTime() ? start : now);

  switch (preset) {
    case 'today':
      return { from: now, to: at(1) };
    case 'weekend': {
      // weekday : 0 = dimanche … 5 = vendredi, 6 = samedi.
      const daysToFriday = today.weekday === 0 ? -2 : 5 - today.weekday;
      const daysToMonday = today.weekday === 0 ? 1 : 8 - today.weekday;
      return { from: fromNowOr(at(daysToFriday, 18)), to: at(daysToMonday) };
    }
    case 'week':
      return { from: now, to: new Date(now.getTime() + 7 * DAY_MS) };
    case 'month':
      return {
        from: now,
        to: fromParisWallClock(today.year, today.month + 1, 1),
      };
    case 'all':
    default:
      return { from: now, to: null };
  }
}
