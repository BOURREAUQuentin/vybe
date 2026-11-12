import { useQuery } from '@tanstack/react-query';

import { fetchFilteredEvents } from '@/features/filters/api';
import { EMPTY_FILTERS, type EventFilters } from '@/features/filters/filters';

import { NEARBY_RADIUS_KM, type NearbyPlace } from './NearbyContext';

/** Filtres correspondant à un lieu de « Près de chez toi » (rayon de 50 km). */
export function nearbyFilters(place: NearbyPlace): EventFilters {
  return {
    ...EMPTY_FILTERS,
    radiusKm: NEARBY_RADIUS_KM,
    cityId: place.kind === 'city' ? place.cityId : null,
    position: place.kind === 'position' ? place.position : null,
  };
}

/** Concerts à venir autour du lieu choisi (inactif tant qu'aucun lieu n'est choisi). */
export function useNearbyEvents(place: NearbyPlace | null) {
  const filters = place ? nearbyFilters(place) : null;
  return useQuery({
    queryKey: ['events', 'nearby', filters],
    queryFn: () => (filters ? fetchFilteredEvents(filters) : Promise.resolve([])),
    enabled: filters !== null,
  });
}
