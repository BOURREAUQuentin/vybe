// Liste d'envies (V1.3) : lignes de user_events avec le statut « wishlist ».
// RLS : chacun ne lit et n'écrit que ses lignes ; user_id est rempli par la base.

import { EVENT_LIST_SELECT, type EventListItem } from '@/features/events/api';
import { supabase } from '@/lib/supabase';

const WISHLIST_STATUS = 'wishlist';

/** Identifiants des concerts enregistrés (requête légère : état des cœurs). */
export async function fetchWishlistIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_events')
    .select('event_id')
    .eq('status', WISHLIST_STATUS);
  if (error) throw new Error(error.message);
  return data.map((row) => row.event_id);
}

export type Wishlist = {
  /** Concerts à venir, du plus proche au plus lointain. */
  upcoming: EventListItem[];
  /** Concerts déjà passés, du plus récent au plus ancien. */
  past: EventListItem[];
};

/**
 * Concerts enregistrés, avec salle et affiche, séparés en « à venir » et « déjà passés »
 * au moment de la requête. Un concert masqué entre-temps (is_hidden) n'est pas renvoyé
 * par la base : il est ignoré.
 */
export async function fetchWishlist(): Promise<Wishlist> {
  const { data, error } = await supabase
    .from('user_events')
    .select(`event_id, event:events ( ${EVENT_LIST_SELECT} )` as const)
    .eq('status', WISHLIST_STATUS);
  if (error) throw new Error(error.message);

  const now = Date.now();
  const events = data
    .map((row): EventListItem | null => row.event)
    .filter((event): event is EventListItem => event !== null)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return {
    upcoming: events.filter((event) => new Date(event.starts_at).getTime() >= now),
    past: events.filter((event) => new Date(event.starts_at).getTime() < now).reverse(),
  };
}

export async function addToWishlist(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('user_events')
    .upsert(
      { event_id: eventId, status: WISHLIST_STATUS },
      { onConflict: 'user_id,event_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function removeFromWishlist(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('user_events')
    .delete()
    .eq('event_id', eventId)
    .eq('status', WISHLIST_STATUS);
  if (error) throw new Error(error.message);
}
