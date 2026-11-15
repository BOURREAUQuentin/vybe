import { useRouter, useSegments } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
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
import { SecondaryButton } from '@/components/SecondaryButton';
import { SearchField } from '@/components/SearchField';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import { TicketSkeleton } from '@/components/TicketSkeleton';
import { VenueRow } from '@/components/VenueRow';
import { useCityCounts, useTopArtists } from '@/features/discover/useDiscover';
import type { EventListItem } from '@/features/events/api';
import { describeEvent } from '@/features/events/eventView';
import {
  FIRST_SEARCH_LIMITS,
  MIN_QUERY_LENGTH,
  SEARCH_EVENTS_FIRST,
  SEARCH_EVENTS_STEP,
  SEARCH_LIST_FIRST,
  SEARCH_LIST_STEP,
  type SearchLimits,
  type SearchResults,
} from '@/features/search/api';
import { getMatchNote } from '@/features/search/suggestions';
import { useSearch, useSearchEvents } from '@/features/search/useSearch';
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
// Titre de section avec le total quand il dépasse ce qu'une liste affiche d'emblée.
const sectionTitle = (title: string, total: number) => (total > SEARCH_LIST_FIRST ? `${title} · ${total}` : title);

// Onglet Recherche (direction Hybride) : suggestions avant de taper, puis artistes, concerts
// (en billets), salles et villes trouvés dans la base.
export default function SearchScreen() {
  // Écran d'accueil de l'onglet Recherche, ou poussé depuis un autre onglet (Mes salles).
  const isTabRoot = useSegments()[0] === '(search)';
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, DEBOUNCE_MS).trim();
  const isActive = query.length >= MIN_QUERY_LENGTH;
  // Résultats demandés par liste (5, puis +10 par « Voir plus ») ; une nouvelle recherche repart
  // de 5 (comparaison avec la recherche mémorisée, sans effet).
  const [shown, setShown] = useState({ query, limits: FIRST_SEARCH_LIMITS });
  const limits = shown.query === query ? shown.limits : FIRST_SEARCH_LIMITS;
  const showMore = (list: keyof SearchLimits) =>
    setShown({ query, limits: { ...limits, [list]: limits[list] + SEARCH_LIST_STEP } });
  const { data, error, refetch, isPlaceholderData } = useSearch(query, limits);

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
      // key : une nouvelle recherche repart de 10 concerts (« Voir plus » remis à zéro).
      <SearchResultsList
        key={query.toLowerCase()}
        results={data}
        query={query}
        // Atténué seulement pendant qu'une AUTRE recherche charge (pas pendant « Voir plus »).
        stale={isPlaceholderData && data.query !== query}
        loadingMore={isPlaceholderData && data.query === query}
        onShowMore={showMore}
        refreshFailed={Boolean(error)}
      />
    );
  }

  return (
    // Ouverte depuis un autre onglet, la barre de navigation (retour, titre) gère déjà le haut.
    <SafeAreaView style={styles.container} edges={isTabRoot ? ['top'] : []}>
      {isTabRoot ? <ScreenHeader title="Recherche" /> : null}
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
  // Classements calculés sur tout le catalogue, côté base (V1.1).
  const artists = useTopArtists(TOP_ARTISTS).data ?? [];
  const cities = useCityCounts(TOP_CITIES).data ?? [];

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
  /** Vrai pendant le chargement d'un « Voir plus » (artistes, salles ou villes). */
  loadingMore: boolean;
  onShowMore: (list: keyof SearchLimits) => void;
  refreshFailed: boolean;
};

function SearchResultsList({ results, query, stale, loadingMore, onShowMore, refreshFailed }: SearchResultsListProps) {
  const router = useRouter();
  // Nombre de concerts à venir par ville (classement mis en cache, partagé avec le filtre « Ville »).
  const { data: cityCounts } = useCityCounts(null);
  const countByCity = new Map((cityCounts ?? []).map((city) => [city.id, city.count]));
  const { data: wishIds } = useWishlistIds();
  const artists = results.artists.items;
  const venues = results.venues.items;
  const cities = results.cities.items;
  // Bouton « Voir plus » d'une liste courte, s'il reste des résultats.
  const moreButton = (list: keyof SearchLimits, hint: string) => {
    const { items, total } = results[list];
    return total > items.length ? (
      <SecondaryButton
        label={`Voir plus (${items.length} sur ${total})`}
        accessibilityHint={hint}
        loading={loadingMore}
        onPress={() => {
          haptics.tap();
          onShowMore(list);
        }}
      />
    ) : null;
  };
  // Concerts : 10 d'abord, « Voir plus » en ajoute 20 (V1.1 : « zenith » en donne plus de 500).
  const [eventLimit, setEventLimit] = useState(SEARCH_EVENTS_FIRST);
  const eventsQuery = useSearchEvents(query, eventLimit);
  const events = eventsQuery.data?.events ?? [];
  const eventsTotal = eventsQuery.data?.total ?? 0;
  const bottomSpace = useTabBarSpace();
  const scrollRef = useRef<ScrollViewInstance>(null);
  useTabScrollToTop(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));

  const eventsLoaded = eventsQuery.data !== undefined;
  if (!stale && eventsLoaded && artists.length + cities.length + venues.length + eventsTotal === 0) {
    return (
      <EmptyState
        title={`Aucun résultat pour « ${query} »`}
        message="Vérifie l’orthographe, ou essaie le nom d’un artiste, d’une salle ou d’une ville. Tu peux combiner : « orelsan nantes »."
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
      {refreshFailed || eventsQuery.error ? (
        <Text style={styles.refreshError}>La recherche a échoué. Résultats précédents affichés.</Text>
      ) : null}

      {/* Listes courtes d'abord (5, puis « Voir plus ») : elles mènent souvent ailleurs (fiche). */}
      {artists.length > 0 ? (
        <ResultSection title={sectionTitle('Artistes', results.artists.total)}>
          {artists.map((artist) => (
            <ArtistRow
              key={artist.id}
              name={artist.name}
              imageUrl={artist.image_url}
              subtitle={artist.genre?.name}
              onPress={() => router.push({ pathname: '/artist/[id]', params: { id: artist.id } })}
            />
          ))}
          {moreButton('artists', 'Affiche les artistes suivants')}
        </ResultSection>
      ) : null}

      {venues.length > 0 ? (
        <ResultSection title={sectionTitle('Salles', results.venues.total)}>
          {venues.map((venue) => (
            <VenueRow
              key={venue.id}
              name={venue.name}
              subtitle={venue.city.name}
              onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
            />
          ))}
          {moreButton('venues', 'Affiche les salles suivantes')}
        </ResultSection>
      ) : null}

      {cities.length > 0 ? (
        <ResultSection title={sectionTitle('Villes', results.cities.total)}>
          {cities.map((city) => (
            <LinkRow
              key={city.id}
              icon={{ ios: 'building.2', android: 'location_city' }}
              title={city.name}
              subtitle={cityCounts ? concertsLabel(countByCity.get(city.id) ?? 0) : null}
              accessibilityHint="Ouvre les concerts de cette ville"
              onPress={() => router.push({ pathname: '/concerts', params: { city: city.id } })}
            />
          ))}
          {moreButton('cities', 'Affiche les villes suivantes')}
        </ResultSection>
      ) : null}

      {/* Concerts en dernier : la liste longue. */}
      {!eventsLoaded ? (
        <ResultSection title="Concerts" spaced>
          <TicketSkeleton />
          <TicketSkeleton />
        </ResultSection>
      ) : events.length > 0 ? (
        <ResultSection title={sectionTitle('Concerts', eventsTotal)} spaced>
          {events.map((event: EventListItem) => (
            <Ticket
              key={event.id}
              view={describeEvent(event)}
              note={getMatchNote(event, query)}
              isWished={wishIds?.includes(event.id) ?? false}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: event.id } })}
            />
          ))}
          {eventsTotal > events.length ? (
            <SecondaryButton
              label={`Voir plus (${events.length} sur ${eventsTotal})`}
              accessibilityHint="Affiche les concerts suivants"
              loading={eventsQuery.isFetching}
              onPress={() => {
                haptics.tap();
                setEventLimit((limit) => limit + SEARCH_EVENTS_STEP);
              }}
            />
          ) : null}
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
