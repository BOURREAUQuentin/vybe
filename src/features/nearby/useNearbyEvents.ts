import { useQuery } from '@tanstack/react-query';

import { fetchFilteredEvents } from '@/features/filters/api';
import {
  EMPTY_FILTERS,
  RADIUS_OPTIONS,
  type EventFilters,
  type RadiusKm,
} from '@/features/filters/filters';

import { NEARBY_RADIUS_KM, type NearbyPlace } from './NearbyContext';

/** Rayon proposé par les filtres le plus proche (10, 25, 50 ou 100 km). */
export function toRadiusOption(radiusKm: number): RadiusKm {
  return RADIUS_OPTIONS.find((option) => option === radiusKm) ?? NEARBY_RADIUS_KM;
}

/** Filtres correspondant à un lieu de « Près de chez toi » et à son rayon. */
export function nearbyFilters(place: NearbyPlace, radiusKm: number): EventFilters {
  return {
    ...EMPTY_FILTERS,
    radiusKm: toRadiusOption(radiusKm),
    cityId: place.kind === 'city' ? place.cityId : null,
    position: place.kind === 'position' ? place.position : null,
  };
}

/** Concerts montrés dans « Près de chez toi » (le total renvoie vers « Concerts »). */
export const NEARBY_PREVIEW_COUNT = 5;

/** Premiers concerts à venir autour du lieu choisi, et leur nombre total (inactif sans lieu). */
export function useNearbyEvents(place: NearbyPlace | null, radiusKm: number) {
  const filters = place ? nearbyFilters(place, radiusKm) : null;
  return useQuery({
    queryKey: ['events', 'nearby', filters],
    queryFn: () =>
      filters ? fetchFilteredEvents(filters, 0, NEARBY_PREVIEW_COUNT) : Promise.resolve({ events: [], total: 0 }),
    enabled: filters !== null,
  });
}
