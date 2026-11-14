// Mise en forme d'un concert commune aux trois prototypes (aucun appel réseau).

import type { EventDetail, EventListItem } from '@/features/events/api';
import { getLineupLabels, sortLineup } from '@/features/events/lineup';
import { formatEventDate, getParisDate } from '@/lib/dates';
import { statusBadges } from '@/theme/tokens';

const WEEKDAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

type AnyEvent = EventListItem | EventDetail;

export type EventView = {
  id: string;
  title: string;
  others: string | null;
  venueName: string | null;
  cityName: string | null;
  place: string | null; // « Stereolux · Nantes »
  dateLabel: string; // « sam. 21 mars · 20h00 »
  weekday: string; // « SAM »
  day: string; // « 21 »
  month: string; // « MARS »
  time: string; // « 20H00 » ou « À CONF. »
  imageUrl: string | null;
  status: EventListItem['status'];
  statusLabel: string;
  isCancelled: boolean;
  accessibilityLabel: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function describeEvent(event: AnyEvent): EventView {
  const { title, others } = getLineupLabels(event.name, event.lineup);
  const paris = getParisDate(new Date(event.starts_at));
  const main = sortLineup(event.lineup).find((entry) => MAIN_ROLES.has(entry.role))?.artist;
  const venueName = event.venue?.name ?? null;
  const cityName = event.venue?.city?.name ?? null;
  const place = [venueName, cityName].filter(Boolean).join(' · ') || null;
  const dateLabel = formatEventDate(event.starts_at, event.time_tba);
  const statusLabel = statusBadges[event.status].label;

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
    statusLabel,
    isCancelled: event.status === 'cancelled',
    accessibilityLabel: [title, others ? `avec ${others}` : null, dateLabel, place, statusLabel]
      .filter(Boolean)
      .join(', '),
  };
}

/** Premier concert avec une photo d'artiste (pour ouvrir une fiche de démonstration parlante). */
export function pickShowcaseEvent(events: EventListItem[]): EventListItem | null {
  return events.find((event) => describeEvent(event).imageUrl !== null) ?? events[0] ?? null;
}

/** Artistes principaux distincts des prochains concerts (suggestions de recherche). */
export function getTrendingArtists(events: EventListItem[], limit: number) {
  const seen = new Map<string, { id: string; name: string; imageUrl: string | null }>();
  for (const event of events) {
    for (const entry of sortLineup(event.lineup)) {
      if (!entry.artist || !MAIN_ROLES.has(entry.role) || seen.has(entry.artist.id)) continue;
      seen.set(entry.artist.id, {
        id: entry.artist.id,
        name: entry.artist.name,
        imageUrl: entry.artist.image_url,
      });
    }
    if (seen.size >= limit) break;
  }
  return [...seen.values()].slice(0, limit);
}

/** Faux code-barres déterministe (largeurs de barres) tiré de l'identifiant du concert. */
export function barcodeFromId(id: string, bars: number): number[] {
  const digits = id.replace(/[^0-9a-f]/gi, '');
  return Array.from({ length: bars }, (_, index) => {
    const value = parseInt(digits[index % digits.length] ?? '0', 16);
    return 1 + (value % 4);
  });
}
