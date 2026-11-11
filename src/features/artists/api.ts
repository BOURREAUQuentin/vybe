import { EVENT_LIST_SELECT } from '@/features/events/api';
import { isUuid } from '@/lib/ids';
import { supabase } from '@/lib/supabase';

const ARTIST_SELECT = `
  id,
  name,
  description,
  image_url,
  genre:genres ( id, name )
`;

/** Fiche artiste et ses concerts à venir, ou null si l'artiste n'existe pas. */
export async function fetchArtistWithEvents(id: string) {
  if (!isUuid(id)) return null;

  const [artistResult, eventsResult] = await Promise.all([
    supabase.from('artists').select(ARTIST_SELECT).eq('id', id).maybeSingle(),
    supabase
      .from('events')
      // « artist_filter » ne sert qu'à garder les concerts où l'artiste est programmé.
      // « as const » garde le texte exact de la requête pour que Supabase en déduise les types.
      .select(`${EVENT_LIST_SELECT}, artist_filter:event_artists!inner ( artist_id )` as const)
      .eq('artist_filter.artist_id', id)
      .eq('type', 'concert')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
  ]);

  if (artistResult.error) throw new Error(artistResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (!artistResult.data) return null;

  return { artist: artistResult.data, events: eventsResult.data };
}

export type ArtistWithEvents = NonNullable<Awaited<ReturnType<typeof fetchArtistWithEvents>>>;
