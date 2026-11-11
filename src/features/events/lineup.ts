import type { EventListItem } from './api';

type Lineup = EventListItem['lineup'];

const MAIN_ROLES = new Set(['headliner', 'co_headliner']);

/**
 * Prépare l'affiche d'un concert :
 * - title : têtes d'affiche (« Gazo & Tiakola »), ou le nom de l'événement à défaut ;
 * - others : premières parties et invités (« Bekar »), ou null.
 */
export function getLineupLabels(eventName: string, lineup: Lineup) {
  const sorted = [...lineup].sort((a, b) => a.position - b.position);
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
