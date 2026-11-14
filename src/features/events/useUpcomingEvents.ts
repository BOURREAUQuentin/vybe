import { useQuery } from '@tanstack/react-query';

import { fetchUpcomingEvents, UPCOMING_PREVIEW_LIMIT } from './api';

export const eventKeys = {
  upcoming: (limit: number) => ['events', 'upcoming', limit] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};

/** Prochains concerts (aperçu « À venir » de Découvrir), mis en cache par TanStack Query. */
export function useUpcomingEvents(limit: number = UPCOMING_PREVIEW_LIMIT) {
  return useQuery({
    queryKey: eventKeys.upcoming(limit),
    queryFn: () => fetchUpcomingEvents(limit),
  });
}
