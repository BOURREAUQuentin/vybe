import { isUuid } from '@/lib/ids';
import { supabase } from '@/lib/supabase';

// Colonnes nécessaires à une carte de concert, avec la salle, la ville et la programmation.
// Les concerts masqués (is_hidden) sont exclus par la sécurité de la base (RLS) ; les concerts
// retirés par la source (withdrawn_at) doivent être exclus par chaque liste du catalogue (V1.1).
export const EVENT_LIST_SELECT = `
  id,
  name,
  status,
  starts_at,
  time_tba,
  image_url,
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
  image_url,
  price_min,
  price_max,
  currency,
  description,
  source,
  venue:venues ( id, name, address, postal_code, city:cities ( id, name ) ),
  lineup:event_artists ( role, position, artist:artists ( id, name, image_url ) )
`;

/** Nombre de concerts « À venir » montrés sur Découvrir (le reste est dans « Concerts »). */
export const UPCOMING_PREVIEW_LIMIT = 30;

/**
 * Prochains concerts, du plus proche au plus lointain (V1.1 : un aperçu, pas tout le catalogue ;
 * les autres sections de Découvrir ont leurs propres requêtes, voir features/discover/api.ts).
 */
export async function fetchUpcomingEvents(limit: number = UPCOMING_PREVIEW_LIMIT) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_LIST_SELECT)
    .eq('type', 'concert') // festivals masqués jusqu'à la V2.3
    .is('withdrawn_at', null)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

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
