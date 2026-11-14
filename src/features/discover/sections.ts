// Calcul des sections de la page Découvrir à partir de la liste des concerts à venir.
// Fonctions pures (aucun appel réseau) : faciles à tester.

import type { EventListItem } from '@/features/events/api';
import { sortLineup } from '@/features/events/lineup';
import { cityImageUrl } from '@/lib/cityImages';
import { formatMonthTitle, getMonthKey, isWithinNextDays } from '@/lib/dates';

const FEATURED_GENRE_SLUG = 'rap';
const FEATURED_LIMIT = 8;
const THIS_WEEK_DAYS = 7;
const NOT_FEATURED_STATUSES = new Set<EventListItem['status']>(['cancelled', 'postponed']);
const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

export type CityGroup = { id: string; name: string; image_path?: string | null; count: number };
export type GenreGroup = { id: string; slug: string; name: string; count: number };
export type MonthSection = { key: string; title: string; data: EventListItem[] };

export type DiscoverSections = {
  featured: EventListItem[];
  thisWeek: EventListItem[];
  cities: CityGroup[];
  genres: GenreGroup[];
  months: MonthSection[];
};

/** Premier artiste principal de l'affiche (pour les cartes vedettes). */
export function getMainArtist(event: EventListItem) {
  return sortLineup(event.lineup).find((entry) => MAIN_ROLES.has(entry.role))?.artist ?? null;
}

/**
 * Rap à l'affiche : prochains concerts rap (hors annulés et reportés),
 * un seul par artiste pour varier, 8 au maximum.
 */
function getFeatured(events: EventListItem[]): EventListItem[] {
  const seenArtists = new Set<string>();
  const featured: EventListItem[] = [];

  for (const event of events) {
    if (featured.length >= FEATURED_LIMIT) break;
    if (event.genre?.slug !== FEATURED_GENRE_SLUG) continue;
    if (NOT_FEATURED_STATUSES.has(event.status)) continue;

    const artistKey = getMainArtist(event)?.id ?? event.id;
    if (seenArtists.has(artistKey)) continue;

    seenArtists.add(artistKey);
    featured.push(event);
  }

  return featured;
}

/** Regroupe et compte, puis trie du plus grand nombre au plus petit (puis par nom). */
function countBy<T extends { id: string; name: string }>(items: (T | null | undefined)[]) {
  const groups = new Map<string, T & { count: number }>();
  for (const item of items) {
    if (!item) continue;
    const group = groups.get(item.id);
    if (group) group.count += 1;
    else groups.set(item.id, { ...item, count: 1 });
  }
  return [...groups.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'),
  );
}

/** Regroupe par mois, dans l'ordre chronologique (la liste d'entrée est déjà triée). */
export function groupEventsByMonth(
  events: EventListItem[],
  now: Date = new Date(),
): MonthSection[] {
  const sections: MonthSection[] = [];
  for (const event of events) {
    const key = getMonthKey(event.starts_at);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(event);
    else sections.push({ key, title: formatMonthTitle(event.starts_at, now), data: [event] });
  }
  return sections;
}

/** `events` doit être trié par date croissante (c'est le cas de fetchUpcomingEvents). */
export function buildDiscoverSections(
  events: EventListItem[],
  now: Date = new Date(),
): DiscoverSections {
  const thisWeek = events.filter((event) => isWithinNextDays(event.starts_at, THIS_WEEK_DAYS, now));
  const thisWeekIds = new Set(thisWeek.map((event) => event.id));
  const later = events.filter((event) => !thisWeekIds.has(event.id));

  return {
    featured: getFeatured(events),
    thisWeek,
    cities: countBy(events.map((event) => event.venue?.city)),
    genres: countBy(
      events.map((event) =>
        event.genre ? { id: event.genre.id, slug: event.genre.slug, name: event.genre.name } : null,
      ),
    ),
    months: groupEventsByMonth(later, now),
  };
}

/**
 * Photo d'illustration de chaque ville (tuiles « Villes ») : la photo de la ville (V1.3.2,
 * bucket Storage « city-images ») ; à défaut, celle du premier artiste principal qui y joue
 * bientôt. Les villes sans aucune photo n'apparaissent pas dans la table.
 */
export function getCityPhotos(events: EventListItem[]): Map<string, string> {
  const cityPhotos = new Map<string, string>();
  const artistPhotos = new Map<string, string>();
  for (const event of events) {
    const city = event.venue?.city;
    if (!city) continue;
    const cityPhoto = cityImageUrl(city.image_path);
    if (cityPhoto && !cityPhotos.has(city.id)) cityPhotos.set(city.id, cityPhoto);
    const artistPhoto = getMainArtist(event)?.image_url;
    if (artistPhoto && !artistPhotos.has(city.id)) artistPhotos.set(city.id, artistPhoto);
  }
  for (const [cityId, photo] of artistPhotos) {
    if (!cityPhotos.has(cityId)) cityPhotos.set(cityId, photo);
  }
  return cityPhotos;
}

/** Concerts d'une ville (utilisé pour le compteur des pastilles de ville). */
export function filterByCity(events: EventListItem[], cityId: string) {
  return events.filter((event) => event.venue?.city.id === cityId);
}
