import { useQuery } from '@tanstack/react-query';

import { fetchArtistWithEvents } from './api';

export const artistKeys = {
  detail: (id: string) => ['artists', 'detail', id] as const,
};

/** Fiche artiste : data vaut null si l'artiste est introuvable. */
export function useArtist(id: string) {
  return useQuery({
    queryKey: artistKeys.detail(id),
    queryFn: () => fetchArtistWithEvents(id),
  });
}
