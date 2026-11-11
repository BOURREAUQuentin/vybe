import { useQuery } from '@tanstack/react-query';

import { fetchEventById } from './api';
import { eventKeys } from './useUpcomingEvents';

/** Fiche concert : data vaut null si le concert est introuvable. */
export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => fetchEventById(id),
  });
}
