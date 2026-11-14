import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchFilteredEvents, fetchFilterOptions, FILTERED_PAGE_SIZE } from './api';
import type { EventFilters } from './filters';

/**
 * Concerts filtrés, chargés par pages de 50 (« Voir plus » charge la suivante).
 * Les résultats précédents restent affichés pendant un changement de filtre.
 */
export function useFilteredEvents(filters: EventFilters) {
  return useInfiniteQuery({
    queryKey: ['events', 'filtered', filters],
    queryFn: ({ pageParam }) => fetchFilteredEvents(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.events.length, 0);
      return loaded < lastPage.total && lastPage.events.length === FILTERED_PAGE_SIZE ? loaded : undefined;
    },
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
