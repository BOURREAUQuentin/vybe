import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { ArtistRow } from '@/components/ArtistRow';
import { CityTile } from '@/components/CityTile';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LinkRow } from '@/components/LinkRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import { TicketSkeleton } from '@/components/TicketSkeleton';
import { VenueRow } from '@/components/VenueRow';
import { buildDiscoverSections, filterByCity, getCityPhotos } from '@/features/discover/sections';
import type { EventListItem } from '@/features/events/api';
import { describeEvent } from '@/features/events/eventView';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { MIN_QUERY_LENGTH, type SearchResults } from '@/features/search/api';
import { getMatchNote, getTopArtists } from '@/features/search/suggestions';
import { useSearch } from '@/features/search/useSearch';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { haptics } from '@/lib/haptics';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { useTabScrollToTop } from '@/lib/useTabScrollToTop';
import { colors, fonts, fontSizes, motion, opacity, sizes, spacing, touch } from '@/theme/tokens';

const DEBOUNCE_MS = 300;
const SKELETON_COUNT = 3;
const TOP_ARTISTS = 8; // « Artistes à l'affiche »
const TOP_CITIES = 6; // « Parcourir les villes » (2 colonnes × 3)

const concertsLabel = (count: number) => `${count} concert${count > 1 ? 's' : ''}`;

// Onglet Recherche (direction Hybride) : suggestions avant de taper, puis artistes, concerts
// (en billets), salles et villes trouvés dans la base.
export default function SearchScreen() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, DEBOUNCE_MS).trim();
  const isActive = query.length >= MIN_QUERY_LENGTH;
  const { data, error, refetch, isPlaceholderData } = useSearch(query);

  let body: ReactNode;
  if (!isActive) {
    body = <Suggestions />;
  } else if (data === undefined) {
    body = error ? (
      <ErrorState title="La recherche a échoué" onRetry={() => refetch()} />
    ) : (
      <View style={styles.skeletons} accessibilityLabel="Recherche en cours">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <TicketSkeleton key={index} />
        ))}
      </View>
    );
  } else {
    body = (
      <SearchResultsList results={data} query={query} stale={isPlaceholderData} refreshFailed={Boolean(error)} />
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

// Avant de taper : artistes et villes les plus programmés (à partir de la liste déjà chargée
// pour Découvrir : aucune requête en plus).
function Suggestions() {
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  // Re-toucher l'onglet Recherche remonte la page tout en haut.
  const scrollRef = useRef<ScrollViewInstance>(null);
  useTabScrollToTop(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  const { data: upcoming } = useUpcomingEvents();

  const { artists, cities } = useMemo(() => {
    if (!upcoming) return { artists: [], cities: [] };
    const photos = getCityPhotos(upcoming);
    return {
      artists: getTopArtists(upcoming, TOP_ARTISTS),
      cities: buildDiscoverSections(upcoming)
        .cities.slice(0, TOP_CITIES)
        .map((city) => ({ ...city, imageUrl: photos.get(city.id) ?? null })),
    };
  }, [upcoming]);

  // Liste pas encore chargée (ou vide) : simple invitation.
  if (artists.length === 0 && cities.length === 0) {
    return (
      <EmptyState title="Cherche un artiste, un concert ou une ville" message="Par exemple : Josman, Zénith, Nantes…" />
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.results, { paddingBottom: bottomSpace }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">
      {artists.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Artistes à l’affiche" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artists}>
            {artists.map((artist) => (
              <Pressable
                key={artist.id}
                onPress={() => {
                  haptics.tap();
                  router.push({ pathname: '/artist/[id]', params: { id: artist.id } });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${artist.name}, ${concertsLabel(artist.count)} à venir`}
                accessibilityHint="Ouvre la fiche de l’artiste"
                style={({ pressed }) => [styles.artist, pressed && styles.pressed]}>
                <ArtistAvatar name={artist.name} imageUrl={artist.imageUrl} size="xl" />
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={styles.artistCount}>
                  {artist.count} date{artist.count > 1 ? 's' : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {cities.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Parcourir les villes" />
          <View style={styles.grid}>
            {cities.map((city) => (
              <CityTile
                key={city.id}
                name={city.name}
                count={city.count}
                imageUrl={city.imageUrl}
                width={sizes.gridTileWidth}
                onPress={() => router.push({ pathname: '/concerts', params: { city: city.id } })}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
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
  const { data: wishIds } = useWishlistIds();
  const { artists, cities, venues, events } = results;
  const bottomSpace = useTabBarSpace();
  const scrollRef = useRef<ScrollViewInstance>(null);
  useTabScrollToTop(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));

  if (!stale && artists.length + cities.length + venues.length + events.length === 0) {
    return (
      <EmptyState
        title={`Aucun résultat pour « ${query} »`}
        message="Vérifie l’orthographe, ou essaie le nom d’un artiste, d’une salle ou d’une ville."
      />
    );
  }

  return (
    // Apparition en fondu sur une vue parente : la liste garde une référence ScrollView simple.
    <Animated.View entering={FadeIn.duration(motion.enterMs)} style={styles.fill}>
    <ScrollView
      ref={scrollRef}
      style={stale && styles.stale}
      contentContainerStyle={[styles.results, { paddingBottom: bottomSpace }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">
      {refreshFailed ? (
        <Text style={styles.refreshError}>La recherche a échoué. Résultats précédents affichés.</Text>
      ) : null}

      {artists.length > 0 ? (
        <ResultSection title="Artistes">
          {artists.map((artist) => (
            <ArtistRow
              key={artist.id}
              name={artist.name}
              imageUrl={artist.image_url}
              subtitle={artist.genre?.name}
              onPress={() => router.push({ pathname: '/artist/[id]', params: { id: artist.id } })}
            />
          ))}
        </ResultSection>
      ) : null}

      {events.length > 0 ? (
        <ResultSection title="Concerts" spaced>
          {events.map((event: EventListItem) => (
            <Ticket
              key={event.id}
              view={describeEvent(event)}
              note={getMatchNote(event, query)}
              isWished={wishIds?.includes(event.id) ?? false}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: event.id } })}
            />
          ))}
        </ResultSection>
      ) : null}

      {venues.length > 0 ? (
        <ResultSection title="Salles">
          {venues.map((venue) => (
            <VenueRow
              key={venue.id}
              name={venue.name}
              subtitle={venue.city.name}
              onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
            />
          ))}
        </ResultSection>
      ) : null}

      {cities.length > 0 ? (
        <ResultSection title="Villes">
          {cities.map((city) => (
            <LinkRow
              key={city.id}
              icon={{ ios: 'building.2', android: 'location_city' }}
              title={city.name}
              subtitle={upcoming ? concertsLabel(filterByCity(upcoming, city.id).length) : null}
              accessibilityHint="Ouvre les concerts de cette ville"
              onPress={() => router.push({ pathname: '/concerts', params: { city: city.id } })}
            />
          ))}
        </ResultSection>
      ) : null}
    </ScrollView>
    </Animated.View>
  );
}

// Section de résultats : titre puis lignes ; `spaced` écarte les éléments (billets).
function ResultSection({ title, spaced = false, children }: { title: string; spaced?: boolean; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      <View style={[styles.padded, spaced && styles.tickets]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  field: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  skeletons: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  results: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  stale: {
    opacity: opacity.pressed,
  },
  section: {
    gap: spacing.sm,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
  tickets: {
    gap: spacing.sm,
  },
  artists: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  artist: {
    width: sizes.avatarXL + spacing.lg,
    minHeight: touch.minSize,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  artistName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  artistCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    paddingHorizontal: spacing.md,
  },
});
