// Mise en avant de l'onglet Recherche (fonction pure, aucun appel réseau). Les suggestions
// « Artistes à l'affiche » viennent de la base depuis la V1.1 (features/discover/api.ts).

import type { EventListItem } from '@/features/events/api';
import { roleLabels } from '@/lib/format';
import { normalizeText as normalize } from '@/lib/text';

const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

/**
 * Si la recherche correspond à un artiste qui n'est pas tête d'affiche (première partie, invité),
 * renvoie « Bekar · Première partie » pour le billet ; sinon null (le billet affiche « avec … »).
 */
export function getMatchNote(event: EventListItem, query: string): string | null {
  const search = normalize(query);
  if (search.length === 0) return null;
  const match = event.lineup.find(
    (entry) => entry.artist && !MAIN_ROLES.has(entry.role) && normalize(entry.artist.name).includes(search),
  );
  return match?.artist ? `${match.artist.name} · ${roleLabels[match.role]}` : null;
}
