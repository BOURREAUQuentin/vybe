// Requêtes de Découvrir et des suggestions de la Recherche (V1.1, catalogue réel) : chaque section
// a sa propre requête ciblée côté base, au lieu d'être déduite des « 100 prochains concerts ».

import { EVENT_LIST_SELECT } from '@/features/events/api';
import { cityImageUrl } from '@/lib/cityImages';
import { getDateRange } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

/** Genre mis en avant par Vybe (« Rap à l'affiche », rap en premier dans « Cette semaine »). */
export const FEATURED_GENRE_SLUG = 'rap';

/** « Rap à l'affiche » : prochains concerts rap, un par artiste, ceux avec photo d'abord. */
export async function fetchFeatured(limit: number) {
  const { data, error } = await supabase
    .rpc('discover_featured', { p_genre_slug: FEATURED_GENRE_SLUG, p_limit: limit })
    .select(EVENT_LIST_SELECT);
  if (error) throw new Error(error.message);
  return data;
}

/** « Cette semaine » : les prochains concerts des 7 jours, rap d'abord. */
export async function fetchThisWeek(limit: number) {
  const { data, error } = await supabase
    .rpc('discover_this_week', { p_priority_slug: FEATURED_GENRE_SLUG, p_limit: limit })
    .select(EVENT_LIST_SELECT);
  if (error) throw new Error(error.message);
  return data;
}

/** Nombre total de concerts cette semaine (même période que le filtre « Cette semaine »). */
export async function fetchThisWeekCount() {
  const { from, to } = getDateRange('week');
  const { count, error } = await supabase
    .rpc('filter_events', { p_from: from.toISOString(), p_to: to?.toISOString() }, { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type CityCount = { id: string; name: string; count: number; imageUrl: string | null };

/**
 * Villes classées par nombre de concerts à venir. Photo : celle de la ville (Storage, V1.3.2),
 * sinon celle d'un artiste qui y joue bientôt. `limit` null : toutes les villes qui ont des concerts.
 */
export async function fetchCityCounts(limit: number | null): Promise<CityCount[]> {
  const { data, error } = await supabase.rpc('city_event_counts', limit === null ? {} : { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []).map((city) => ({
    id: city.id,
    name: city.name,
    count: Number(city.event_count),
    imageUrl: cityImageUrl(city.image_path) ?? city.fallback_image_url,
  }));
}

export type GenreCount = { id: string; slug: string; name: string; count: number };

/** Genres classés par nombre de concerts à venir (« Par genre »). */
export async function fetchGenreCounts(): Promise<GenreCount[]> {
  const { data, error } = await supabase.rpc('genre_event_counts');
  if (error) throw new Error(error.message);
  return (data ?? []).map((genre) => ({ ...genre, count: Number(genre.event_count) }));
}

export type TopArtist = { id: string; name: string; imageUrl: string | null; count: number };

/** Artistes qui ont le plus de concerts à venir (« Artistes à l'affiche » de la Recherche). */
export async function fetchTopArtists(limit: number): Promise<TopArtist[]> {
  const { data, error } = await supabase.rpc('top_artists', { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []).map((artist) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.image_url,
    count: Number(artist.event_count),
  }));
}
