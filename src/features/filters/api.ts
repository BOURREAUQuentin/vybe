import { EVENT_LIST_SELECT } from '@/features/events/api';
import { getDateRange } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

import type { EventFilters } from './filters';

/** Nombre de concerts chargés à la fois (bouton « Voir plus » pour la suite). */
export const FILTERED_PAGE_SIZE = 50;

/**
 * Une page de concerts à venir correspondant aux filtres (fonction SQL filter_events, côté base),
 * avec le nombre total de résultats. Les bornes de dates sont calculées au moment de l'appel,
 * à l'heure de Paris. V1.1 : le catalogue réel compte des milliers de concerts, d'où la pagination.
 */
export async function fetchFilteredEvents(filters: EventFilters, offset = 0, limit = FILTERED_PAGE_SIZE) {
  const { from, to } = getDateRange(filters.date);

  const { data, count, error } = await supabase
    .rpc('filter_events', {
      p_from: from.toISOString(),
      p_to: to?.toISOString(),
      p_city_id: filters.cityId ?? undefined,
      p_genre_ids: filters.genreIds.length > 0 ? filters.genreIds : undefined,
      p_radius_km: filters.radiusKm ?? undefined,
      // Position arrondie (~1 km), envoyée seulement dans le corps de la requête, jamais enregistrée.
      p_latitude: filters.position?.latitude,
      p_longitude: filters.position?.longitude,
    }, { count: 'exact' })
    .select(EVENT_LIST_SELECT)
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }
  return { events: data, total: count ?? data.length };
}

export type FilteredPage = Awaited<ReturnType<typeof fetchFilteredEvents>>;

/** Villes et genres proposés dans les panneaux de filtres. */
export async function fetchFilterOptions() {
  const [cities, genres] = await Promise.all([
    supabase.from('cities').select('id, name').order('name'),
    supabase.from('genres').select('id, slug, name').order('name'),
  ]);

  const error = cities.error ?? genres.error;
  if (error) {
    throw new Error(error.message);
  }
  return { cities: cities.data ?? [], genres: genres.data ?? [] };
}

export type FilterOptions = Awaited<ReturnType<typeof fetchFilterOptions>>;
