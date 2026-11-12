import { useQuery } from '@tanstack/react-query';

import { fetchVenueWithEvents } from './api';

export const venueKeys = {
  detail: (id: string) => ['venues', 'detail', id] as const,
};

/** Fiche salle : data vaut null si la salle est introuvable. */
export function useVenue(id: string) {
  return useQuery({
    queryKey: venueKeys.detail(id),
    queryFn: () => fetchVenueWithEvents(id),
  });
}
