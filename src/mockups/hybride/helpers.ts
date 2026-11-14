// Calculs de la maquette hybride (fonctions pures, aucun appel réseau).

import type { EventListItem } from '@/features/events/api';
import { roleLabels } from '@/lib/format';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Artistes ayant le plus de concerts à venir (rangée « Artistes à l'affiche » de la Recherche). */
export function getTopArtists(events: EventListItem[], limit: number) {
  const counts = new Map<string, { id: string; name: string; imageUrl: string | null; count: number }>();
  for (const event of events) {
    for (const entry of event.lineup) {
      if (!entry.artist) continue;
      const current = counts.get(entry.artist.id);
      if (current) current.count += 1;
      else
        counts.set(entry.artist.id, {
          id: entry.artist.id,
          name: entry.artist.name,
          imageUrl: entry.artist.image_url,
          count: 1,
        });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
    .slice(0, limit);
}

/**
 * Si la recherche correspond à un artiste qui n'est pas tête d'affiche (ex. une première partie),
 * renvoie « Bekar · Première partie » pour l'afficher sur le ticket ; sinon null.
 */
export function getMatchNote(event: EventListItem, query: string): string | null {
  const search = normalize(query);
  if (search.length < 2) return null;
  const match = event.lineup.find(
    (entry) =>
      entry.artist &&
      entry.role !== 'headliner' &&
      entry.role !== 'co_headliner' &&
      normalize(entry.artist.name).includes(search),
  );
  return match?.artist ? `${match.artist.name} · ${roleLabels[match.role]}` : null;
}
