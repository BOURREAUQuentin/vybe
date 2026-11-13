// Préférences du compte (V1.3) : villes favorites (dont une principale), salles favorites,
// genres préférés. RLS : chacun ne lit et n'écrit que ses lignes ; user_id rempli par la base.

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Villes
// ---------------------------------------------------------------------------

/** Villes favorites, la principale en premier. */
export async function fetchFavoriteCities() {
  const { data, error } = await supabase
    .from('user_favorite_cities')
    .select('city_id, is_main, radius_km, city:cities ( id, name )')
    .order('is_main', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export type FavoriteCity = Awaited<ReturnType<typeof fetchFavoriteCities>>[number];

/** Définit la ville principale et son rayon (l'ancienne reste favorite) : fonction SQL atomique. */
export async function setMainCity(cityId: string, radiusKm: number): Promise<void> {
  const { error } = await supabase.rpc('set_main_city', {
    p_city_id: cityId,
    p_radius_km: radiusKm,
  });
  if (error) throw new Error(error.message);
}

/** Retire le statut « principale » (la ville reste favorite). */
export async function unsetMainCity(): Promise<void> {
  const { error } = await supabase
    .from('user_favorite_cities')
    .update({ is_main: false })
    .eq('is_main', true);
  if (error) throw new Error(error.message);
}

export async function addFavoriteCity(cityId: string): Promise<void> {
  const { error } = await supabase
    .from('user_favorite_cities')
    .upsert({ city_id: cityId }, { onConflict: 'user_id,city_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function removeFavoriteCity(cityId: string): Promise<void> {
  const { error } = await supabase.from('user_favorite_cities').delete().eq('city_id', cityId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Salles
// ---------------------------------------------------------------------------

/** Salles favorites, de la plus récente à la plus ancienne. */
export async function fetchFavoriteVenues() {
  const { data, error } = await supabase
    .from('user_venue_follows')
    .select('venue_id, created_at, venue:venues ( id, name, city:cities ( id, name ) )')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export type FavoriteVenue = Awaited<ReturnType<typeof fetchFavoriteVenues>>[number];

export async function addFavoriteVenue(venueId: string): Promise<void> {
  const { error } = await supabase
    .from('user_venue_follows')
    .upsert({ venue_id: venueId }, { onConflict: 'user_id,venue_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function removeFavoriteVenue(venueId: string): Promise<void> {
  const { error } = await supabase.from('user_venue_follows').delete().eq('venue_id', venueId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

/** Identifiants des genres préférés. */
export async function fetchGenrePreferences(): Promise<string[]> {
  const { data, error } = await supabase.from('user_genre_preferences').select('genre_id');
  if (error) throw new Error(error.message);
  return data.map((row) => row.genre_id);
}

export async function addGenrePreference(genreId: string): Promise<void> {
  const { error } = await supabase
    .from('user_genre_preferences')
    .upsert({ genre_id: genreId }, { onConflict: 'user_id,genre_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function removeGenrePreference(genreId: string): Promise<void> {
  const { error } = await supabase.from('user_genre_preferences').delete().eq('genre_id', genreId);
  if (error) throw new Error(error.message);
}
