import { useRouter } from 'expo-router';
import { useMemo, useRef, type ReactNode } from 'react';
import { RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CAROUSEL_SNAP, CarouselCard } from '@/components/CarouselCard';
import { Chip } from '@/components/Chip';
import { CityTile } from '@/components/CityTile';
import { DiscoverSkeleton } from '@/components/DiscoverSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FeaturedHero } from '@/components/FeaturedHero';
import { GlassHeader } from '@/components/GlassHeader';
import { GlassIconButton } from '@/components/GlassIconButton';
import { IconButton } from '@/components/IconButton';
import { MonthHeader } from '@/components/MonthHeader';
import { NearbySection } from '@/components/NearbySection';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import { buildDiscoverSections, getCityPhotos, type DiscoverSections } from '@/features/discover/sections';
import type { EventListItem } from '@/features/events/api';
import { describeEvent } from '@/features/events/eventView';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { haptics } from '@/lib/haptics';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<EventListItem>);

const HERO_KICKER = 'Rap à l’affiche';

// Onglet Découvrir (direction Hybride) : grand visuel, À l'affiche (carrousel), Près de chez toi,
// Cette semaine, Villes, Par genre, puis À venir par mois. Concerts en billets.
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, isRefetching, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);
  const cityPhotos = useMemo(() => (data ? getCityPhotos(data) : new Map<string, string>()), [data]);
  const { data: wishIds } = useWishlistIds();
  // Le bas de la liste ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const isWished = (id: string) => wishIds?.includes(id) ?? false;
  const openConcert = (id: string) => router.push({ pathname: '/concert/[id]', params: { id } });
  const openInfos = () => router.push('/infos');

  const plainHeader = (
    <ScreenHeader
      title="Découvrir"
      action={
        <IconButton
          icon={{ ios: 'info.circle', android: 'info' }}
          accessibilityLabel="Informations"
          onPress={openInfos}
        />
      }
    />
  );

  // Premier chargement : squelette (sous la barre d'état, comme le grand visuel) ou erreur.
  if (data === undefined || sections === null) {
    return error ? (
      <SafeAreaView style={styles.container} edges={['top']}>
        {plainHeader}
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    ) : (
      <View style={styles.container}>
        <DiscoverSkeleton />
      </View>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
      tintColor={colors.text}
      progressViewOffset={insets.top}
    />
  );

  // Aucun concert à venir : état vide (on peut quand même tirer pour rafraîchir).
  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {plainHeader}
        <ScrollView contentContainerStyle={styles.emptyScroll} refreshControl={refreshControl}>
          <EmptyState
            title="Aucun concert à venir"
            message="De nouvelles dates sont annoncées régulièrement : reviens bientôt."
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const [heroEvent, ...carouselEvents] = sections.featured;

  // Haut de la page : grand visuel (ou titre simple sans concert à l'affiche) + bouton Infos.
  const top = heroEvent ? (
    <View>
      <FeaturedHero
        view={describeEvent(heroEvent)}
        kicker={HERO_KICKER}
        scrollY={scrollY}
        topInset={insets.top}
        isWished={isWished(heroEvent.id)}
        onPress={() => openConcert(heroEvent.id)}
      />
      <View style={[styles.infos, { top: insets.top + spacing.xs }]}>
        <GlassIconButton
          icon={{ ios: 'info.circle', android: 'info' }}
          accessibilityLabel="Informations"
          onPress={openInfos}
        />
      </View>
    </View>
  ) : (
    <View style={{ paddingTop: insets.top }}>{plainHeader}</View>
  );

  return (
    <View style={styles.container}>
      <AnimatedSectionList
        sections={sections.months}
        keyExtractor={(event) => event.id}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
        renderItem={({ item }) => (
          <View style={styles.ticketRow}>
            <Ticket view={describeEvent(item)} isWished={isWished(item.id)} onPress={() => openConcert(item.id)} />
          </View>
        )}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <>
            {top}
            <DiscoverTopSections
              sections={sections}
              carouselEvents={carouselEvents}
              cityPhotos={cityPhotos}
              refreshFailed={Boolean(error)}
              isWished={isWished}
              onOpenConcert={openConcert}
              onOpenCity={(id) => router.push({ pathname: '/concerts', params: { city: id } })}
              onOpenGenre={(id) => router.push({ pathname: '/concerts', params: { genres: id } })}
              onOpenAll={() => router.push('/concerts')}
            />
          </>
        }
      />
      {heroEvent ? <GlassHeader title="Découvrir" scrollY={scrollY} top={insets.top} /> : null}
    </View>
  );
}

type TopSectionsProps = {
  sections: DiscoverSections;
  /** Concerts « À l'affiche » après celui du grand visuel. */
  carouselEvents: EventListItem[];
  cityPhotos: Map<string, string>;
  refreshFailed: boolean;
  isWished: (id: string) => boolean;
  onOpenConcert: (id: string) => void;
  onOpenCity: (id: string) => void;
  onOpenGenre: (id: string) => void;
  /** Ouvre « Tous les concerts » (filtres). */
  onOpenAll: () => void;
};

// Sections entre le grand visuel et la liste par mois. Une section vide n'est pas affichée.
function DiscoverTopSections({
  sections,
  carouselEvents,
  cityPhotos,
  refreshFailed,
  isWished,
  onOpenConcert,
  onOpenCity,
  onOpenGenre,
  onOpenAll,
}: TopSectionsProps) {
  const { thisWeek, cities, genres, months } = sections;

  return (
    <View style={styles.topSections}>
      {refreshFailed ? (
        <Text style={styles.refreshError}>
          Impossible d’actualiser. Les concerts affichés peuvent ne pas être à jour.
        </Text>
      ) : null}

      {carouselEvents.length > 0 ? (
        <Section title="À l’affiche">
          <AfficheCarousel events={carouselEvents} isWished={isWished} onOpenConcert={onOpenConcert} />
        </Section>
      ) : null}

      <NearbySection />

      {thisWeek.length > 0 ? (
        <Section title="Cette semaine">
          <View style={styles.tickets}>
            {thisWeek.map((event) => (
              <Ticket
                key={event.id}
                view={describeEvent(event)}
                isWished={isWished(event.id)}
                onPress={() => onOpenConcert(event.id)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      {cities.length > 0 ? (
        <Section title="Villes">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
            {cities.map((city) => (
              <CityTile
                key={city.id}
                name={city.name}
                count={city.count}
                imageUrl={cityPhotos.get(city.id) ?? null}
                onPress={() => onOpenCity(city.id)}
              />
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {genres.length > 0 ? (
        <Section title="Par genre">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
            {genres.map((genre) => (
              <Chip key={genre.id} label={genre.name} count={genre.count} onPress={() => onOpenGenre(genre.id)} />
            ))}
          </ScrollView>
        </Section>
      ) : null}

      {months.length > 0 ? (
        <SectionTitle
          title="À venir"
          action={{
            label: 'Tout voir',
            accessibilityLabel: 'Voir tous les concerts et les filtrer',
            onPress: onOpenAll,
          }}
        />
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      {children}
    </View>
  );
}

type AfficheCarouselProps = {
  events: EventListItem[];
  isWished: (id: string) => boolean;
  onOpenConcert: (id: string) => void;
};

// Carrousel « À l'affiche » : aimanté carte par carte, petit retour haptique à chaque nouvelle carte.
function AfficheCarousel({ events, isWished, onOpenConcert }: AfficheCarouselProps) {
  const scrollX = useSharedValue(0);
  const lastIndex = useRef(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.set(event.contentOffset.x);
  });

  return (
    <Animated.FlatList
      horizontal
      data={events}
      keyExtractor={(event) => event.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CAROUSEL_SNAP}
      decelerationRate="fast"
      onScroll={onScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_SNAP);
        if (index !== lastIndex.current) {
          lastIndex.current = index;
          haptics.select();
        }
      }}
      contentContainerStyle={styles.horizontalRow}
      renderItem={({ item, index }) => (
        <CarouselCard
          view={describeEvent(item)}
          index={index}
          scrollX={scrollX}
          isWished={isWished(item.id)}
          onPress={() => onOpenConcert(item.id)}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  infos: {
    position: 'absolute',
    right: spacing.md,
  },
  topSections: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tickets: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ticketRow: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    paddingHorizontal: spacing.md,
  },
});
