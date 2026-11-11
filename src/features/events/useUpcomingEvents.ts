import { useQuery } from '@tanstack/react-query';

import { fetchUpcomingEvents } from './api';

export const eventKeys = {
  upcoming: ['events', 'upcoming'] as const,
};

/** Liste des concerts à venir, mise en cache par TanStack Query. */
export function useUpcomingEvents() {
  return useQuery({
    queryKey: eventKeys.upcoming,
    queryFn: fetchUpcomingEvents,
  });
}
