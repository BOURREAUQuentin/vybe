import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { Grain } from '@/mockups/shared/Grain';
import { haptics } from '@/mockups/shared/haptics';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, lineHeights, maxFontScale, spacing, touch } from '@/theme/tokens';

import { Band, Caps, PosterBackground, PosterCard, PosterTitle, ProgramRow, Sticker } from './components';
import { affiche } from './tokens';

const TITLE_COLLAPSE = 140; // défilement (pt) au bout duquel le grand titre a disparu

// AFFICHE — Découvrir : grand titre, affiche principale, bandeaux, programme façon line-up.
export function AfficheDiscover({ nav }: MockupScreenProps) {
  const { data, error, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);
  const bottomSpace = useTabBarSpace();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  // Le titre géant se compresse et s'efface en remontant.
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, TITLE_COLLAPSE], [1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollY.get(), [-TITLE_COLLAPSE, 0, TITLE_COLLAPSE], [1.15, 1, 0.8], Extrapolation.CLAMP) },
    ],
    transformOrigin: 'left bottom',
  }));

  if (!data || !sections) return <MockupState error={error} onRetry={() => void refetch()} />;

  const [hero, ...others] = sections.featured.map(describeEvent);
  const program = (sections.thisWeek.length > 0 ? sections.thisWeek : data.slice(0, 6)).map(describeEvent);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Grain opacity={affiche.grainOpacity} />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <Animated.View style={[styles.header, titleStyle]}>
          <Caps>Vybe · concerts en France</Caps>
          <PosterTitle text="Découvrir" size={affiche.size.poster} />
        </Animated.View>

        {hero ? (
          <PressableScale
            onPress={() => {
              haptics.tap();
              nav.openConcert(hero.id);
            }}
            pressedScale={affiche.heroPressedScale}
            accessibilityRole="button"
            accessibilityLabel={hero.accessibilityLabel}
            style={styles.hero}>
            <PosterBackground view={hero} initialsSize={affiche.size.heroInitials} />
            <View style={styles.heroSticker}>
              <Sticker status={hero.status} />
            </View>
            <View style={styles.heroText}>
              <Caps muted={false}>À l’affiche</Caps>
              <PosterTitle text={hero.title} size={affiche.size.mega} />
              <Caps muted={false}>{`${hero.weekday} ${hero.day} ${hero.month} · ${hero.time} · ${hero.place ?? ''}`}</Caps>
            </View>
          </PressableScale>
        ) : null}

        <Band text="Rap à l’affiche" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}>
          {others.map((view) => (
            <PosterCard key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />
          ))}
        </ScrollView>

        <View style={styles.tapeWrap}>
          <Band text={sections.thisWeek.length > 0 ? 'Cette semaine' : 'Prochaines dates'} tape />
        </View>
        <View style={styles.list}>
          {program.map((view) => (
            <ProgramRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />
          ))}
        </View>

        <Band text="Par ville" />
        {/* Nuage de villes : la taille de la typo dit déjà « grosse ville ». */}
        <View style={styles.cities}>
          {sections.cities.map((city) => (
            <PressableScale
              key={city.id}
              onPress={haptics.select}
              accessibilityRole="button"
              accessibilityLabel={`${city.name}, ${city.count} concerts`}
              style={styles.city}>
              <Text style={styles.cityName} maxFontSizeMultiplier={maxFontScale.display}>
                {city.name.toUpperCase()}
              </Text>
              <Text style={styles.cityCount}>{city.count}</Text>
            </PressableScale>
          ))}
        </View>

        {sections.months.slice(0, 2).map((month) => (
          <View key={month.key}>
            <View style={styles.monthHeader}>
              <PosterTitle text={month.title} size={affiche.size.big} color={colors.textSecondary} />
            </View>
            <View style={styles.list}>
              {month.data.slice(0, 8).map((event) => {
                const view = describeEvent(event);
                return <ProgramRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
              })}
            </View>
          </View>
        ))}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  hero: {
    height: affiche.heroHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  heroSticker: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
  },
  heroText: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  carousel: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  tapeWrap: {
    marginVertical: spacing.md,
    overflow: 'visible',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  cities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    padding: spacing.md,
  },
  city: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: touch.minSize,
  },
  cityName: {
    fontFamily: fonts.display,
    fontSize: affiche.size.city,
    lineHeight: affiche.size.city * lineHeights.display,
    color: colors.text,
  },
  cityCount: {
    fontFamily: fonts.bold,
    fontSize: affiche.size.caps,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.xxs,
  },
  monthHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
