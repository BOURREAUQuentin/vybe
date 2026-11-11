import { supabase } from '@/lib/supabase';

// Colonnes nécessaires à une carte de concert, avec la salle, la ville et la programmation.
// Les concerts masqués (is_hidden) sont exclus par la sécurité de la base (RLS).
const EVENT_LIST_SELECT = `
  id,
  name,
  status,
  starts_at,
  time_tba,
  venue:venues ( id, name, city:cities ( id, name ) ),
  lineup:event_artists ( role, position, artist:artists ( id, name ) )
`;

const UPCOMING_LIMIT = 100;

/** Concerts à venir, du plus proche au plus lointain. */
export async function fetchUpcomingEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_LIST_SELECT)
    .eq('type', 'concert') // festivals masqués jusqu'à la V2.3
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(UPCOMING_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type EventListItem = Awaited<ReturnType<typeof fetchUpcomingEvents>>[number];
