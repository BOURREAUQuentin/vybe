import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { MIN_QUERY_LENGTH, searchCatalog } from './api';

/** Résultats de recherche. Inactif tant que la saisie fait moins de 2 caractères. */
export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', trimmed.toLowerCase()],
    queryFn: () => searchCatalog(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    // Garde les résultats précédents affichés pendant qu'on continue de taper.
    placeholderData: keepPreviousData,
  });
}
