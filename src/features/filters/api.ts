import { EVENT_LIST_SELECT } from '@/features/events/api';
import { getDateRange } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

import type { EventFilters } from './filters';

/**
 * Concerts à venir correspondant aux filtres (fonction SQL filter_events, côté base).
 * Les bornes de dates sont calculées au moment de l'appel, à l'heure de Paris.
 */
export async function fetchFilteredEvents(filters: EventFilters) {
  const { from, to } = getDateRange(filters.date);

  const { data, error } = await supabase
    .rpc('filter_events', {
      p_from: from.toISOString(),
      p_to: to?.toISOString(),
      p_city_id: filters.cityId ?? undefined,
      p_genre_ids: filters.genreIds.length > 0 ? filters.genreIds : undefined,
      p_radius_km: filters.radiusKm ?? undefined,
    })
    .select(EVENT_LIST_SELECT)
    .order('starts_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

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
