// Suivi d'artistes (V1.3). La sécurité de la base (RLS) garantit que chaque utilisateur
// ne lit et n'écrit que ses propres lignes ; user_id est rempli par la base (auth.uid()).

import { EVENT_LIST_SELECT } from '@/features/events/api';
import { supabase } from '@/lib/supabase';

const FOLLOWED_SELECT = `
  artist_id,
  created_at,
  artist:artists ( id, name, image_url, genre:genres ( id, name ) )
`;

/** Artistes suivis par l'utilisateur connecté, du plus récent au plus ancien. */
export async function fetchFollowedArtists() {
  const { data, error } = await supabase
    .from('user_artist_follows')
    .select(FOLLOWED_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export type FollowedArtist = Awaited<ReturnType<typeof fetchFollowedArtists>>[number];

/** Suit un ou plusieurs artistes (sans erreur si un artiste est déjà suivi). */
export async function followArtists(artistIds: string[]): Promise<void> {
  if (artistIds.length === 0) return;
  const { error } = await supabase
    .from('user_artist_follows')
    .upsert(
      artistIds.map((artist_id) => ({ artist_id })),
      { onConflict: 'user_id,artist_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function unfollowArtist(artistId: string): Promise<void> {
  const { error } = await supabase.from('user_artist_follows').delete().eq('artist_id', artistId);
  if (error) throw new Error(error.message);
}

/** Prochains concerts des artistes suivis (un concert n'apparaît qu'une fois). */
export async function fetchFollowedArtistsEvents(artistIds: string[]) {
  if (artistIds.length === 0) return [];
  const { data, error } = await supabase
    .from('events')
    // « artist_filter » ne sert qu'à garder les concerts où un artiste suivi est programmé.
    .select(`${EVENT_LIST_SELECT}, artist_filter:event_artists!inner ( artist_id )` as const)
    .in('artist_filter.artist_id', artistIds)
    .eq('type', 'concert')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/** Artistes proposés à l'onboarding : les artistes rap du catalogue. */
export async function fetchOnboardingArtists() {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, image_url, genre:genres!inner ( slug )')
    .eq('genre.slug', 'rap')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Recherche d'artistes pour l'onboarding, dans tout le catalogue (fonction SQL search_artists :
 * insensible à la casse et aux accents, 2 caractères minimum).
 */
export async function searchOnboardingArtists(query: string) {
  const { data, error } = await supabase
    .rpc('search_artists', { search_query: query })
    .select('id, name, image_url');
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Nombre d'artistes suivis (pour décider d'afficher l'onboarding). */
export async function countFollowedArtists(): Promise<number> {
  const { count, error } = await supabase
    .from('user_artist_follows')
    .select('artist_id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
