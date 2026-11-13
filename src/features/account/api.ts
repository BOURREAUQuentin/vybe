// Droits RGPD du compte (V1.3) : export des données (accès, portabilité) et suppression
// du compte (effacement). RLS : chaque requête ne renvoie que les lignes du compte connecté.

import { clearOnboardingSeen } from '@/features/follows/onboarding';
import { supabase } from '@/lib/supabase';

type ExportAccount = { email: string | null; createdAt: string | null };

/**
 * Rassemble toutes les données du compte, au moment de la demande.
 * Les identifiants techniques sont conservés pour que l'export soit complet
 * (même si un concert a été retiré du catalogue entre-temps).
 */
export async function collectMyData(account: ExportAccount) {
  const [follows, events, cities, venues, genres] = await Promise.all([
    supabase.from('user_artist_follows').select('artist_id, created_at, artist:artists ( name )'),
    supabase
      .from('user_events')
      .select(
        'event_id, status, created_at, event:events ( name, starts_at, venue:venues ( name, city:cities ( name ) ) )',
      ),
    supabase
      .from('user_favorite_cities')
      .select('city_id, is_main, radius_km, created_at, city:cities ( name )'),
    supabase.from('user_venue_follows').select('venue_id, created_at, venue:venues ( name )'),
    supabase.from('user_genre_preferences').select('genre_id, created_at, genre:genres ( name )'),
  ]);

  const error = follows.error ?? events.error ?? cities.error ?? venues.error ?? genres.error;
  if (error) throw new Error(error.message);

  return {
    application: 'Vybe',
    exportedAt: new Date().toISOString(),
    account: { email: account.email, createdAt: account.createdAt },
    followedArtists: (follows.data ?? []).map((row) => ({
      artistId: row.artist_id,
      name: row.artist?.name ?? null,
      followedAt: row.created_at,
    })),
    events: (events.data ?? []).map((row) => ({
      eventId: row.event_id,
      status: row.status,
      name: row.event?.name ?? null,
      startsAt: row.event?.starts_at ?? null,
      venue: row.event?.venue?.name ?? null,
      city: row.event?.venue?.city.name ?? null,
      savedAt: row.created_at,
    })),
    favoriteCities: (cities.data ?? []).map((row) => ({
      cityId: row.city_id,
      name: row.city?.name ?? null,
      isMain: row.is_main,
      radiusKm: row.radius_km,
      addedAt: row.created_at,
    })),
    favoriteVenues: (venues.data ?? []).map((row) => ({
      venueId: row.venue_id,
      name: row.venue?.name ?? null,
      addedAt: row.created_at,
    })),
    favoriteGenres: (genres.data ?? []).map((row) => ({
      genreId: row.genre_id,
      name: row.genre?.name ?? null,
      addedAt: row.created_at,
    })),
  };
}

export type MyDataExport = Awaited<ReturnType<typeof collectMyData>>;

/** Texte lisible (JSON indenté) partagé via le menu de partage du téléphone. */
export function formatMyData(data: MyDataExport): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Supprime le compte connecté et toutes ses données (fonction SQL delete_my_account,
 * cascade), puis efface la session et l'indicateur d'onboarding du téléphone.
 * Si la suppression échoue, rien n'est effacé localement.
 */
export async function deleteMyAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message);

  clearOnboardingSeen(userId);
  // Le compte n'existe plus côté serveur : déconnexion locale uniquement.
  await supabase.auth.signOut({ scope: 'local' });
}
