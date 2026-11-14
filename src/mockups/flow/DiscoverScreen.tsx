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
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent, type EventView } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, radius, spacing, touch } from '@/theme/tokens';

import { ArtistImage, GlassHeader, GlassPill, ParallaxImage, PHOTO_FADE, PlaylistRow, SectionTitle } from './components';
import { flow } from './tokens';

const SNAP = flow.cardWidth + spacing.sm;

// FLOW — Découvrir : hero plein écran en parallaxe, carrousel avec profondeur, listes façon playlist.
export function FlowDiscover({ nav }: MockupScreenProps) {
  const { data, error, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const scrollY = useSharedValue(0);
  const carouselX = useSharedValue(0);
  const lastIndex = useRef(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const onCarouselScroll = useAnimatedScrollHandler((event) => {
    carouselX.set(event.contentOffset.x);
  });

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
            <ParallaxImage view={hero} height={flow.heroHeight} scrollY={scrollY} initialsSize={flow.size.heroInitials} />
            <View style={[styles.heroText, { paddingTop: insets.top }]}>
              <GlassPill>Rap à l’affiche</GlassPill>
              <Text
                style={styles.heroTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={maxFontScale.display}>
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
            contentContainerStyle={styles.carousel}
            renderItem={({ item, index }) => (
              <CarouselCard view={item} index={index} scrollX={carouselX} onPress={() => nav.openConcert(item.id)} />
            )}
          />

          <View style={styles.block}>
            <SectionTitle>{sections.thisWeek.length > 0 ? 'Cette semaine' : 'Bientôt'}</SectionTitle>
            {thisWeek.map((view) => (
              <PlaylistRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />
            ))}
          </View>

          <View style={styles.sectionHead}>
            <SectionTitle>Par ville</SectionTitle>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {sections.cities.map((city) => (
              <PressableScale
                key={city.id}
                onPress={haptics.select}
                accessibilityRole="button"
                accessibilityLabel={`${city.name}, ${city.count} concerts`}
                style={styles.city}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityCount}>{city.count} concerts</Text>
              </PressableScale>
            ))}
          </ScrollView>

          {sections.months.slice(0, 2).map((month) => (
            <View key={month.key} style={styles.block}>
              <SectionTitle>{month.title.charAt(0).toUpperCase() + month.title.slice(1)}</SectionTitle>
              {month.data.slice(0, 6).map((event) => {
                const view = describeEvent(event);
                return <PlaylistRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
              })}
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      <GlassHeader title="Découvrir" scrollY={scrollY} top={insets.top} />
    </View>
  );
}

// Carte du carrousel : la carte centrée est pleine taille, ses voisines rétrécissent et s'atténuent.
function CarouselCard({
  view,
  index,
  scrollX,
  onPress,
}: {
  view: EventView;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
    return {
      opacity: interpolate(scrollX.get(), range, [flow.carouselInactiveOpacity, 1, flow.carouselInactiveOpacity], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.get(), range, [flow.carouselInactiveScale, 1, flow.carouselInactiveScale], Extrapolation.CLAMP) },
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
        <View style={[StyleSheet.absoluteFill, styles.cardFade]} />
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
    height: flow.heroHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroText: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: flow.size.hero,
    lineHeight: flow.size.hero * lineHeights.display,
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
  carousel: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  block: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  card: {
    width: flow.cardWidth,
    height: flow.cardHeight,
    justifyContent: 'flex-end',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardFade: {
    experimental_backgroundImage: PHOTO_FADE,
  },
  cardText: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: flow.size.cardTitle,
    lineHeight: flow.size.cardTitle * lineHeights.display,
    color: colors.text,
  },
  cardMeta: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  city: {
    minWidth: flow.cardWidth / 2,
    minHeight: touch.minSize,
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  cityName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  cityCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
