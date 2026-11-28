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
  const [follows, events, cities, venues, genres, settings, devices, notifications] = await Promise.all([
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
    // Notifications (V1.4).
    supabase
      .from('user_notification_settings')
      .select('followed_artist, favorite_city, favorite_venue, wishlist_change, updated_at')
      .maybeSingle(),
    supabase.from('user_push_tokens').select('token, platform, created_at, updated_at'),
    supabase
      .from('notification_log')
      .select('kind, detail, status, title, body, sent_at, created_at, event_id, event:events ( name )')
      .order('created_at', { ascending: false }),
  ]);

  const error =
    follows.error ??
    events.error ??
    cities.error ??
    venues.error ??
    genres.error ??
    settings.error ??
    devices.error ??
    notifications.error;
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
    // Sans ligne de réglages, tous les types sont activés.
    notificationSettings: {
      newConcertsOfFollowedArtists: settings.data?.followed_artist ?? true,
      newConcertsInFavoriteCities: settings.data?.favorite_city ?? true,
      newConcertsInFavoriteVenues: settings.data?.favorite_venue ?? true,
      wishlistChanges: settings.data?.wishlist_change ?? true,
      updatedAt: settings.data?.updated_at ?? null,
    },
    notificationDevices: (devices.data ?? []).map((row) => ({
      platform: row.platform,
      // Jeton masqué : il suffit à reconnaître le téléphone, pas à lui écrire.
      token: maskToken(row.token),
      registeredAt: row.created_at,
      lastUpdatedAt: row.updated_at,
    })),
    notifications: (notifications.data ?? []).map((row) => ({
      kind: row.kind,
      detail: row.detail || null,
      status: row.status,
      eventId: row.event_id,
      event: row.event?.name ?? null,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      sentAt: row.sent_at,
    })),
  };
}

/** « ExponentPushToken[abcdef…] » → « ExponentPushToken[…cdef] ». */
function maskToken(token: string): string {
  const inner = token.match(/\[(.+)\]$/)?.[1] ?? token;
  return `${token.split('[')[0]}[…${inner.slice(-4)}]`;
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
