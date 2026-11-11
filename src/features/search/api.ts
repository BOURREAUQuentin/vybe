import { EVENT_LIST_SELECT } from '@/features/events/api';
import { supabase } from '@/lib/supabase';

/** Nombre minimal de caractères pour lancer une recherche (même règle côté base). */
export const MIN_QUERY_LENGTH = 2;

/**
 * Recherche dans la base (fonctions SQL search_*, insensibles à la casse et aux accents) :
 * artistes, villes et concerts à venir, en parallèle.
 */
export async function searchCatalog(query: string) {
  const [artists, cities, events] = await Promise.all([
    supabase
      .rpc('search_artists', { search_query: query })
      .select('id, name, image_url, genre:genres ( id, name )'),
    supabase.rpc('search_cities', { search_query: query }).select('id, name'),
    supabase
      .rpc('search_events', { search_query: query })
      .select(EVENT_LIST_SELECT)
      .order('starts_at', { ascending: true }),
  ]);

  const error = artists.error ?? cities.error ?? events.error;
  if (error) {
    throw new Error(error.message);
  }

  return {
    artists: artists.data ?? [],
    cities: cities.data ?? [],
    events: events.data ?? [],
  };
}

export type SearchResults = Awaited<ReturnType<typeof searchCatalog>>;
