import { isUuid } from '@/lib/ids';
import { supabase } from '@/lib/supabase';

// Colonnes nécessaires à une carte de concert, avec la salle, la ville et la programmation.
// Les concerts masqués (is_hidden) sont exclus par la sécurité de la base (RLS).
export const EVENT_LIST_SELECT = `
  id,
  name,
  status,
  starts_at,
  time_tba,
  genre:genres ( id, slug, name ),
  venue:venues ( id, name, city:cities ( id, name, image_path ) ),
  lineup:event_artists ( role, position, artist:artists ( id, name, image_url ) )
`;

// Colonnes de la fiche concert.
const EVENT_DETAIL_SELECT = `
  id,
  name,
  status,
  starts_at,
  time_tba,
  on_sale_at,
  ticket_url,
  price_min,
  price_max,
  currency,
  description,
  source,
  venue:venues ( id, name, address, postal_code, city:cities ( id, name ) ),
  lineup:event_artists ( role, position, artist:artists ( id, name, image_url ) )
`;

const UPCOMING_LIMIT = 100;

/**
 * Concerts à venir, du plus proche au plus lointain.
 * MVP : une seule requête alimente toute la page Découvrir et les listes par ville / genre.
 * À revoir en V1.1 (catalogue Ticketmaster complet) : une requête filtrée côté serveur par section.
 */
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

/** Fiche concert, ou null si le concert n'existe pas (ou est masqué). */
export async function fetchEventById(id: string) {
  if (!isUuid(id)) return null;

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_DETAIL_SELECT)
    .eq('id', id)
    .eq('type', 'concert')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type EventDetail = NonNullable<Awaited<ReturnType<typeof fetchEventById>>>;
