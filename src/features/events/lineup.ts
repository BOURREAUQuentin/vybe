import type { ArtistRole } from '@/lib/format';

type LineupEntry<TArtist extends { name: string }> = {
  role: ArtistRole;
  position: number;
  artist: TArtist | null;
};

const MAIN_ROLES = new Set<ArtistRole>(['headliner', 'co_headliner']);

/** Programmation triée dans l'ordre de l'affiche. */
export function sortLineup<T extends LineupEntry<{ name: string }>>(lineup: readonly T[]): T[] {
  return [...lineup].sort((a, b) => a.position - b.position);
}

/**
 * Prépare l'affiche d'un concert :
 * - title : têtes d'affiche (« Gazo & Tiakola »), ou le nom de l'événement à défaut ;
 * - others : premières parties et invités (« Bekar »), ou null.
 */
export function getLineupLabels(
  eventName: string,
  lineup: readonly LineupEntry<{ name: string }>[],
) {
  const sorted = sortLineup(lineup);
  const names = (onlyMain: boolean) =>
    sorted
      .filter((entry) => MAIN_ROLES.has(entry.role) === onlyMain)
      .map((entry) => entry.artist?.name)
      .filter((name): name is string => Boolean(name));

  const main = names(true);
  const others = names(false);

  return {
    title: main.length > 0 ? main.join(' & ') : eventName,
    others: others.length > 0 ? others.join(', ') : null,
  };
}
