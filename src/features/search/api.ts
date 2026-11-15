import { EVENT_LIST_SELECT } from '@/features/events/api';
import { supabase } from '@/lib/supabase';

/** Nombre minimal de caractères pour lancer une recherche (même règle côté base). */
export const MIN_QUERY_LENGTH = 2;

/** Concerts affichés au départ dans les résultats (« Voir plus » en ajoute SEARCH_EVENTS_STEP). */
export const SEARCH_EVENTS_FIRST = 10;
export const SEARCH_EVENTS_STEP = 20;

/** Artistes, salles et villes affichés au départ ; « Voir plus » en ajoute SEARCH_LIST_STEP. */
export const SEARCH_LIST_FIRST = 5;
export const SEARCH_LIST_STEP = 10;

/** Nombre de résultats demandés pour chaque liste courte. */
export type SearchLimits = { artists: number; venues: number; cities: number };

export const FIRST_SEARCH_LIMITS: SearchLimits = {
  artists: SEARCH_LIST_FIRST,
  venues: SEARCH_LIST_FIRST,
  cities: SEARCH_LIST_FIRST,
};

/**
 * Recherche dans la base (fonctions SQL search_*, insensibles à la casse et aux accents,
 * multi-mots depuis la V1.1 : « orelsan nantes ») : artistes, salles et villes, en parallèle,
 * chacun avec son total. L'ordre vient de la base : tes choix d'abord (artistes suivis, salles et
 * villes favorites), puis le plus de concerts à venir, puis le nom.
 * Les concerts, potentiellement nombreux, ont leur propre requête paginée (searchEvents).
 */
export async function searchCatalog(query: string, limits: SearchLimits) {
  const [artists, venues, cities] = await Promise.all([
    supabase
      .rpc('search_artists', { search_query: query }, { count: 'exact' })
      .select('id, name, image_url, genre:genres ( id, name )')
      .range(0, limits.artists - 1),
    supabase
      .rpc('search_venues', { search_query: query }, { count: 'exact' })
      .select('id, name, city:cities ( id, name )')
      .range(0, limits.venues - 1),
    supabase
      .rpc('search_cities', { search_query: query }, { count: 'exact' })
      .select('id, name')
      .range(0, limits.cities - 1),
  ]);

  const error = artists.error ?? venues.error ?? cities.error;
  if (error) {
    throw new Error(error.message);
  }

  // Une liste et son total (le total vaut au moins le nombre de lignes reçues).
  const page = <T,>(rows: T[] | null, count: number | null) => {
    const items = rows ?? [];
    return { items, total: Math.max(count ?? 0, items.length) };
  };

  return {
    query,
    artists: page(artists.data, artists.count),
    venues: page(venues.data, venues.count),
    cities: page(cities.data, cities.count),
  };
}

export type SearchResults = Awaited<ReturnType<typeof searchCatalog>>;

/** Les `limit` premiers concerts à venir correspondant à la recherche, et leur nombre total. */
export async function searchEvents(query: string, limit: number) {
  const { data, count, error } = await supabase
    .rpc('search_events', { search_query: query }, { count: 'exact' })
    .select(EVENT_LIST_SELECT)
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return { events: data, total: count ?? data.length };
}
