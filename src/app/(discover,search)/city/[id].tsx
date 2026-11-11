import { useLocalSearchParams } from 'expo-router';

import { EventCollection } from '@/components/EventCollection';
import { filterByCity } from '@/features/discover/sections';

// Concerts à venir dans une ville (ouverte depuis « Par ville » sur Découvrir).
export default function CityScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const cityName = name ?? 'Ville';

  return (
    <EventCollection
      title={cityName}
      filter={(events) => filterByCity(events, id)}
      emptyTitle={name ? `Aucun concert à venir à ${name}` : 'Aucun concert à venir'}
    />
  );
}
