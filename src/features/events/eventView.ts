// Mise en forme d'un concert pour l'affichage (billets, cartes, fiche). Fonctions pures.

import type { EventDetail, EventListItem } from '@/features/events/api';
import { getLineupLabels, sortLineup } from '@/features/events/lineup';
import { formatEventDate, getParisDate } from '@/lib/dates';
import { statusBadges } from '@/theme/tokens';

const WEEKDAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

export type EventView = {
  id: string;
  title: string; // têtes d'affiche
  others: string | null; // premières parties et invités
  venueName: string | null;
  cityName: string | null;
  place: string | null; // « Stereolux · Nantes »
  dateLabel: string; // « sam. 21 mars · 20h00 »
  weekday: string; // « SAM »
  day: string; // « 21 »
  month: string; // « MARS »
  time: string; // « 20H00 » ou « À CONF. »
  imageUrl: string | null; // photo de la première tête d'affiche
  status: EventListItem['status'];
  isCancelled: boolean;
  accessibilityLabel: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function describeEvent(event: EventListItem | EventDetail): EventView {
  const { title, others } = getLineupLabels(event.name, event.lineup);
  const paris = getParisDate(new Date(event.starts_at));
  const main = sortLineup(event.lineup).find((entry) => MAIN_ROLES.has(entry.role))?.artist;
  const venueName = event.venue?.name ?? null;
  const cityName = event.venue?.city?.name ?? null;
  const place = [venueName, cityName].filter(Boolean).join(' · ') || null;
  const dateLabel = formatEventDate(event.starts_at, event.time_tba);

  return {
    id: event.id,
    title,
    others,
    venueName,
    cityName,
    place,
    dateLabel,
    weekday: WEEKDAYS[paris.weekday],
    day: pad(paris.day),
    month: MONTHS[paris.month - 1],
    time: event.time_tba ? 'À CONF.' : `${pad(paris.hour)}H${pad(paris.minute)}`,
    imageUrl: main?.image_url ?? null,
    status: event.status,
    isCancelled: event.status === 'cancelled',
    accessibilityLabel: [
      title,
      others ? `avec ${others}` : null,
      dateLabel,
      place,
      statusBadges[event.status].label,
    ]
      .filter(Boolean)
      .join(', '),
  };
}

/** Faux code-barres décoratif (largeurs de barres), toujours le même pour un concert donné. */
export function barcodeFromId(id: string, bars: number): number[] {
  const digits = id.replace(/[^0-9a-f]/gi, '');
  return Array.from({ length: bars }, (_, index) => {
    const value = parseInt(digits[index % digits.length] ?? '0', 16);
    return 1 + (value % 4);
  });
}
