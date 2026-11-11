import { useLocalSearchParams } from 'expo-router';

import { EventCollection } from '@/components/EventCollection';
import { filterByGenre } from '@/features/discover/sections';

// Concerts à venir d'un genre (ouvert depuis « Par genre » sur Découvrir).
export default function GenreScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const genreName = name ?? 'Genre';

  return (
    <EventCollection
      title={genreName}
      filter={(events) => filterByGenre(events, id)}
      emptyTitle={name ? `Aucun concert ${name} à venir` : 'Aucun concert à venir'}
    />
  );
}
