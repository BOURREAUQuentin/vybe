import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildDiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent, type EventView } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, radius, spacing, touch } from '@/theme/tokens';

import {
  ArtistImage,
  GlassHeader,
  GlassPill,
  ParallaxImage,
  PHOTO_FADE,
  SectionTitle,
  StatusChip,
  Ticket,
  WishBadge,
} from './components';
import { hybride } from './tokens';

const SNAP = hybride.cardWidth + spacing.sm;

// HYBRIDE — Découvrir : structure de Flow (hero, carrousel, sections claires), concerts en tickets (Pass),
// statut visible avant d'ouvrir la fiche.
export function HybrideDiscover({ nav }: MockupScreenProps) {
  const router = useRouter();
  const { data, error, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const scrollY = useSharedValue(0);
  const carouselX = useSharedValue(0);
  const lastIndex = useRef(0);
  // Envies du compte connecté (lecture seule) : affichées sur les cartes et les tickets.
  const { data: wishIds } = useWishlistIds();
  const isWished = (id: string) => wishIds?.includes(id) ?? false;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const onCarouselScroll = useAnimatedScrollHandler((event) => {
    carouselX.set(event.contentOffset.x);
  });

  // Photo d'un artiste qui joue dans chaque ville (tuiles « Villes »).
  const cityTiles = useMemo(() => {
    if (!data || !sections) return [];
    return sections.cities.map((city) => {
      const withPhoto = data
        .filter((event) => event.venue?.city.id === city.id)
        .map(describeEvent)
        .find((view) => view.imageUrl !== null);
      return { ...city, imageUrl: withPhoto?.imageUrl ?? null };
    });
  }, [data, sections]);

  if (!data || !sections) return <MockupState error={error} onRetry={() => void refetch()} />;

  const [hero, ...featured] = sections.featured.map(describeEvent);
  const thisWeek = (sections.thisWeek.length > 0 ? sections.thisWeek : data.slice(0, 5)).map(describeEvent);

  return (
    <View style={styles.container}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
        {hero ? (
          <PressableScale
            onPress={() => {
              haptics.tap();
              nav.openConcert(hero.id);
            }}
            pressedScale={1}
            accessibilityRole="button"
            accessibilityLabel={hero.accessibilityLabel}
            style={styles.hero}>
            <ParallaxImage view={hero} height={hybride.heroHeight} scrollY={scrollY} initialsSize={hybride.size.heroInitials} />
            <View style={[styles.corners, { top: insets.top + spacing.md }]}>
              <StatusChip status={hero.status} />
              <View style={styles.flex} />
              {isWished(hero.id) ? <WishBadge /> : null}
            </View>
            <View style={styles.heroText}>
              <GlassPill>Rap à l’affiche</GlassPill>
              <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit maxFontSizeMultiplier={maxFontScale.display}>
                {hero.title.toUpperCase()}
              </Text>
              <Text style={styles.heroMeta}>
                {hero.dateLabel}
                {hero.place ? `  ·  ${hero.place}` : ''}
              </Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Voir le concert</Text>
              </View>
            </View>
          </PressableScale>
        ) : null}

        <View style={styles.sections}>
          <View style={styles.sectionHead}>
            <SectionTitle>À l’affiche</SectionTitle>
          </View>
          <Animated.FlatList
            horizontal
            data={featured}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP}
            decelerationRate="fast"
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SNAP);
              if (index !== lastIndex.current) {
                lastIndex.current = index;
                haptics.select();
              }
            }}
            contentContainerStyle={styles.row}
            renderItem={({ item, index }) => (
              <CarouselCard
                view={item}
                index={index}
                scrollX={carouselX}
                isWished={isWished(item.id)}
                onPress={() => nav.openConcert(item.id)}
              />
            )}
          />

          <View style={styles.block}>
            <SectionTitle>{sections.thisWeek.length > 0 ? 'Cette semaine' : 'Bientôt'}</SectionTitle>
            {thisWeek.map((view) => (
              <Ticket key={view.id} view={view} isWished={isWished(view.id)} onPress={() => nav.openConcert(view.id)} />
            ))}
          </View>

          <View style={styles.sectionHead}>
            <SectionTitle>Villes</SectionTitle>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {cityTiles.map((city) => (
              <PressableScale
                key={city.id}
                onPress={() => {
                  haptics.tap();
                  router.push({ pathname: '/concerts', params: { city: city.id } });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${city.name}, ${city.count} concerts`}
                accessibilityHint="Ouvre les concerts de cette ville"
                style={styles.cityTile}>
                {city.imageUrl ? <ArtistImage view={{ imageUrl: city.imageUrl, title: city.name }} initialsSize={fontSizes.xl} /> : null}
                <View style={[StyleSheet.absoluteFill, styles.tileFade]} />
                <Text style={styles.cityName} numberOfLines={1}>
                  {city.name}
                </Text>
                <Text style={styles.cityCount}>{city.count} concerts</Text>
              </PressableScale>
            ))}
          </ScrollView>

          {sections.months.slice(0, 2).map((month) => (
            <View key={month.key} style={styles.block}>
              <SectionTitle>{month.title.charAt(0).toUpperCase() + month.title.slice(1)}</SectionTitle>
              {month.data.slice(0, 6).map((event) => {
                const view = describeEvent(event);
                return (
                  <Ticket key={view.id} view={view} isWished={isWished(view.id)} onPress={() => nav.openConcert(view.id)} />
                );
              })}
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      <GlassHeader title="Découvrir" scrollY={scrollY} top={insets.top} />
    </View>
  );
}

// Carte du carrousel : profondeur (voisines plus petites) et tampon de statut lisible sur la photo.
function CarouselCard({
  view,
  index,
  scrollX,
  isWished,
  onPress,
}: {
  view: EventView;
  index: number;
  scrollX: SharedValue<number>;
  isWished: boolean;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
    return {
      opacity: interpolate(scrollX.get(), range, [hybride.carouselInactiveOpacity, 1, hybride.carouselInactiveOpacity], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.get(), range, [hybride.carouselInactiveScale, 1, hybride.carouselInactiveScale], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={style}>
      <PressableScale
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={view.accessibilityLabel}
        style={styles.card}>
        <ArtistImage view={view} initialsSize={fontSizes.initials} />
        <View style={[StyleSheet.absoluteFill, styles.tileFade]} />
        <View style={[styles.corners, styles.cardCorners]}>
          <StatusChip status={view.status} />
          <View style={styles.flex} />
          {isWished ? <WishBadge /> : null}
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={2} maxFontSizeMultiplier={maxFontScale.display}>
            {view.title.toUpperCase()}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {view.dateLabel}
          </Text>
          {view.cityName ? <Text style={styles.cardMeta}>{view.cityName}</Text> : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: hybride.heroHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // Coins d'une photo : statut à gauche, cœur à droite.
  corners: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCorners: {
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  heroText: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: hybride.size.hero,
    lineHeight: hybride.size.hero * lineHeights.display,
    color: colors.text,
  },
  heroMeta: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  heroButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.background,
  },
  sections: {
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionHead: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  block: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    width: hybride.cardWidth,
    height: hybride.cardHeight,
    justifyContent: 'flex-end',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tileFade: {
    experimental_backgroundImage: PHOTO_FADE,
  },
  cardText: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: hybride.size.cardTitle,
    lineHeight: hybride.size.cardTitle * lineHeights.display,
    color: colors.text,
  },
  cardMeta: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  cityTile: {
    width: hybride.thumbTileWidth,
    height: hybride.tileHeight,
    justifyContent: 'flex-end',
    padding: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  cityName: {
    fontFamily: fonts.bold,
    fontSize: hybride.size.tile,
    color: colors.text,
  },
  cityCount: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
});
