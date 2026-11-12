import { EVENT_LIST_SELECT } from '@/features/events/api';
import { isUuid } from '@/lib/ids';
import { supabase } from '@/lib/supabase';

const VENUE_SELECT = `
  id,
  name,
  address,
  postal_code,
  latitude,
  longitude,
  city:cities ( id, name )
`;

/** Fiche salle et ses concerts à venir, ou null si la salle n'existe pas. */
export async function fetchVenueWithEvents(id: string) {
  if (!isUuid(id)) return null;

  const [venueResult, eventsResult] = await Promise.all([
    supabase.from('venues').select(VENUE_SELECT).eq('id', id).maybeSingle(),
    supabase
      .from('events')
      .select(EVENT_LIST_SELECT)
      .eq('venue_id', id)
      .eq('type', 'concert')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
  ]);

  if (venueResult.error) throw new Error(venueResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (!venueResult.data) return null;

  return { venue: venueResult.data, events: eventsResult.data };
}

export type VenueWithEvents = NonNullable<Awaited<ReturnType<typeof fetchVenueWithEvents>>>;
