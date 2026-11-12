import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchFilteredEvents, fetchFilterOptions } from './api';
import type { EventFilters } from './filters';

/** Concerts filtrés. Les résultats précédents restent affichés pendant un changement de filtre. */
export function useFilteredEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ['events', 'filtered', filters],
    queryFn: () => fetchFilteredEvents(filters),
    placeholderData: keepPreviousData,
  });
}

/** Villes et genres des panneaux de filtres (changent rarement : cache d'une heure). */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['filters', 'options'],
    queryFn: fetchFilterOptions,
    staleTime: 60 * 60 * 1000,
  });
}
