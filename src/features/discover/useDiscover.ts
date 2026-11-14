import { useQuery } from '@tanstack/react-query';

import {
  fetchCityCounts,
  fetchFeatured,
  fetchGenreCounts,
  fetchThisWeek,
  fetchThisWeekCount,
  fetchTopArtists,
} from './api';

/** Les classements (villes, genres, artistes) bougent peu : cache de 10 minutes. */
const RANKING_STALE_MS = 10 * 60 * 1000;

export const discoverKeys = {
  all: ['discover'] as const,
  featured: (limit: number) => ['discover', 'featured', limit] as const,
  thisWeek: (limit: number) => ['discover', 'this-week', limit] as const,
  thisWeekCount: ['discover', 'this-week-count'] as const,
  cities: (limit: number | null) => ['discover', 'cities', limit] as const,
  genres: ['discover', 'genres'] as const,
  topArtists: (limit: number) => ['discover', 'top-artists', limit] as const,
};

export function useFeatured(limit: number) {
  return useQuery({ queryKey: discoverKeys.featured(limit), queryFn: () => fetchFeatured(limit) });
}

export function useThisWeek(limit: number) {
  return useQuery({ queryKey: discoverKeys.thisWeek(limit), queryFn: () => fetchThisWeek(limit) });
}

export function useThisWeekCount() {
  return useQuery({ queryKey: discoverKeys.thisWeekCount, queryFn: fetchThisWeekCount });
}

/** Villes classées par nombre de concerts (`limit` null : toutes celles qui en ont). */
export function useCityCounts(limit: number | null) {
  return useQuery({
    queryKey: discoverKeys.cities(limit),
    queryFn: () => fetchCityCounts(limit),
    staleTime: RANKING_STALE_MS,
  });
}

export function useGenreCounts() {
  return useQuery({ queryKey: discoverKeys.genres, queryFn: fetchGenreCounts, staleTime: RANKING_STALE_MS });
}

export function useTopArtists(limit: number) {
  return useQuery({
    queryKey: discoverKeys.topArtists(limit),
    queryFn: () => fetchTopArtists(limit),
    staleTime: RANKING_STALE_MS,
  });
}
