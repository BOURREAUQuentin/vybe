import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/lib/useTabBarSpace';

import { ArtistRow } from '@/components/ArtistRow';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { SectionTitle } from '@/components/SectionTitle';
import { VenueRow } from '@/components/VenueRow';
import { filterByCity } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { MIN_QUERY_LENGTH, type SearchResults } from '@/features/search/api';
import { useSearch } from '@/features/search/useSearch';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { colors, fonts, fontSizes, opacity, spacing } from '@/theme/tokens';

const DEBOUNCE_MS = 300;
const SKELETON_COUNT = 3;

// Onglet Recherche : artistes, villes et concerts à venir (recherche côté base).
export default function SearchScreen() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, DEBOUNCE_MS).trim();
  const isActive = query.length >= MIN_QUERY_LENGTH;
  const { data, error, refetch, isPlaceholderData } = useSearch(query);

  let body: ReactNode;
  if (!isActive) {
    body = (
      <EmptyState
        title="Cherche un artiste, un concert ou une ville"
        message="Par exemple : Josman, Zénith, Nantes…"
      />
    );
  } else if (data === undefined) {
    body = error ? (
      <ErrorState title="La recherche a échoué" onRetry={() => refetch()} />
    ) : (
      <View style={styles.skeletons} accessibilityLabel="Recherche en cours">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </View>
    );
  } else {
    body = (
      <SearchResultsList
        results={data}
        query={query}
        stale={isPlaceholderData}
        refreshFailed={Boolean(error)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Recherche" />
      <View style={styles.field}>
        <SearchField value={text} onChangeText={setText} />
      </View>
      {body}
    </SafeAreaView>
  );
}

type SearchResultsListProps = {
  results: SearchResults;
  query: string;
  /** Vrai pendant qu'une nouvelle recherche remplace des résultats précédents. */
  stale: boolean;
  refreshFailed: boolean;
};

function SearchResultsList({ results, query, stale, refreshFailed }: SearchResultsListProps) {
  const router = useRouter();
  // Nombre de concerts par ville, si la liste de Découvrir est déjà en cache.
  const { data: upcoming } = useUpcomingEvents();
  const { artists, cities, venues, events } = results;
  const bottomSpace = useTabBarSpace();

  if (!stale && artists.length + cities.length + venues.length + events.length === 0) {
    return (
      <EmptyState
        title={`Aucun résultat pour « ${query} »`}
        message="Vérifie l’orthographe, ou essaie le nom d’un artiste, d’une salle ou d’une ville."
      />
    );
  }

  return (
    <ScrollView
      style={stale && styles.stale}
      contentContainerStyle={[styles.results, { paddingBottom: bottomSpace }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">
      {refreshFailed ? (
        <Text style={styles.refreshError}>La recherche a échoué. Résultats précédents affichés.</Text>
      ) : null}

      {artists.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Artistes" />
          <View style={styles.padded}>
            {artists.map((artist) => (
              <ArtistRow
                key={artist.id}
                name={artist.name}
                imageUrl={artist.image_url}
                subtitle={artist.genre?.name}
                onPress={() =>
                  router.push({ pathname: '/artist/[id]', params: { id: artist.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {cities.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Villes" />
          <View style={[styles.padded, styles.chips]}>
            {cities.map((city) => (
              <Chip
                key={city.id}
                label={city.name}
                count={upcoming ? filterByCity(upcoming, city.id).length : undefined}
                onPress={() =>
                  router.push({ pathname: '/concerts', params: { city: city.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {venues.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Salles" />
          <View style={styles.padded}>
            {venues.map((venue) => (
              <VenueRow
                key={venue.id}
                name={venue.name}
                subtitle={venue.city.name}
                onPress={() =>
                  router.push({ pathname: '/venue/[id]', params: { id: venue.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {events.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Concerts" />
          <View style={[styles.padded, styles.cards]}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() =>
                  router.push({ pathname: '/concert/[id]', params: { id: event.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  field: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  skeletons: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  results: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  stale: {
    opacity: opacity.pressed,
  },
  section: {
    gap: spacing.xs,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cards: {
    gap: spacing.xs,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    paddingHorizontal: spacing.md,
  },
});
