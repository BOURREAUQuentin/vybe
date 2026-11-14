// Regroupement des concerts par mois (Découvrir « À venir », Concerts, Artistes, Envies).
// Fonction pure (aucun appel réseau). V1.1 : les autres sections de Découvrir viennent de requêtes
// ciblées côté base (voir features/discover/api.ts), plus d'une liste unique de 100 concerts.

import type { EventListItem } from '@/features/events/api';
import { formatMonthTitle, getMonthKey } from '@/lib/dates';

export type MonthSection = { key: string; title: string; data: EventListItem[] };

/** Regroupe par mois, dans l'ordre chronologique (la liste d'entrée est déjà triée). */
export function groupEventsByMonth(events: EventListItem[], now: Date = new Date()): MonthSection[] {
  const sections: MonthSection[] = [];
  for (const event of events) {
    const key = getMonthKey(event.starts_at);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(event);
    else sections.push({ key, title: formatMonthTitle(event.starts_at, now), data: [event] });
  }
  return sections;
}
