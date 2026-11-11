// Formatage des dates en français, toujours dans le fuseau de Paris.

const TIME_ZONE = 'Europe/Paris';

const formatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

type DateParts = {
  weekday: string; // « sam. »
  day: string; // « 21 »
  month: string; // « mars », « janv. »
  hour: string; // « 20 »
  minute: string; // « 00 »
};

function getParisParts(isoDate: string): DateParts {
  const parts = formatter.formatToParts(new Date(isoDate));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** « sam. 21 mars · 20h00 », ou « sam. 21 mars · horaire à confirmer ». */
export function formatEventDate(isoDate: string, timeTba = false): string {
  const { weekday, day, month, hour, minute } = getParisParts(isoDate);
  const time = timeTba ? 'horaire à confirmer' : `${hour}h${minute}`;
  return `${weekday} ${day} ${month} · ${time}`;
}

const longFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getLongParts(isoDate: string) {
  const parts = longFormatter.formatToParts(new Date(isoDate));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const currentYear = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, year: 'numeric' }).format(
    new Date(),
  );
  const year = get('year');
  // L'année n'est affichée que si elle diffère de l'année en cours.
  const date = `${get('weekday')} ${get('day')} ${get('month')}${year !== currentYear ? ` ${year}` : ''}`;
  return { date, time: `${get('hour')}h${get('minute')}` };
}

/** « samedi 14 novembre · 20h00 » (année ajoutée si différente de l'année en cours). */
export function formatEventDateLong(isoDate: string, timeTba = false): string {
  const { date, time } = getLongParts(isoDate);
  return `${date} · ${timeTba ? 'horaire à confirmer' : time}`;
}

/** « jeudi 3 décembre à 10h00 ». */
export function formatDayAndTime(isoDate: string): string {
  const { date, time } = getLongParts(isoDate);
  return `${date} à ${time}`;
}

/** Jour et mois pour le bloc date des cartes : { day: '21', month: 'MARS' }. */
export function getDateBlock(isoDate: string): { day: string; month: string } {
  const { day, month } = getParisParts(isoDate);
  return { day, month: month.replace('.', '').toUpperCase() };
}
