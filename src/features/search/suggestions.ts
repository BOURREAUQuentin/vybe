// Suggestions et mises en avant de l'onglet Recherche (fonctions pures, aucun appel réseau).

import type { EventListItem } from '@/features/events/api';
import { roleLabels } from '@/lib/format';

export type TopArtist = { id: string; name: string; imageUrl: string | null; count: number };

const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

/** Minuscules sans accents, pour comparer une saisie à un nom (« beyonce » ↔ « Beyoncé »). */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Artistes qui ont le plus de concerts à venir (tous rôles confondus), puis par nom. */
export function getTopArtists(events: EventListItem[], limit: number): TopArtist[] {
  const counts = new Map<string, TopArtist>();
  for (const event of events) {
    for (const { artist } of event.lineup) {
      if (!artist) continue;
      const current = counts.get(artist.id);
      if (current) current.count += 1;
      else counts.set(artist.id, { id: artist.id, name: artist.name, imageUrl: artist.image_url, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
    .slice(0, limit);
}

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
