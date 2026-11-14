import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { MIN_QUERY_LENGTH } from '@/features/search/api';
import { useSearch } from '@/features/search/useSearch';
import { getInitials } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { motion } from '@/mockups/shared/motion';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, letterSpacing, radius, spacing, touch } from '@/theme/tokens';

import { Glass, PHOTO_FADE, PlaylistRow, SectionTitle } from './components';
import { flow } from './tokens';

const SEARCH_DELAY_MS = 300;

// FLOW — Recherche : grand titre, champ en verre, tuiles « Parcourir » par ville, meilleur résultat.
export function FlowSearch({ nav }: MockupScreenProps) {
  const bottomSpace = useTabBarSpace();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, SEARCH_DELAY_MS);
  const isSearching = debounced.trim().length >= MIN_QUERY_LENGTH;
  const { data: results } = useSearch(debounced);
  const { data: upcoming } = useUpcomingEvents();

  // Tuiles par ville, illustrées par la photo d'un artiste qui y joue bientôt.
  const tiles = useMemo(() => {
    if (!upcoming) return [];
    return buildDiscoverSections(upcoming).cities.map((city) => {
      const withPhoto = upcoming
        .filter((event) => event.venue?.city.id === city.id)
        .map(describeEvent)
        .find((view) => view.imageUrl !== null);
      return { ...city, imageUrl: withPhoto?.imageUrl ?? null };
    });
  }, [upcoming]);

  const best = results?.artists[0] ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <Text style={styles.largeTitle} accessibilityRole="header">
          Recherche
        </Text>
        <Glass style={styles.field}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search' }} size={iconSizes.md} tintColor={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Artistes, salles, villes"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Rechercher"
            style={styles.input}
          />
        </Glass>

        {!isSearching ? (
          <>
            <SectionTitle>Parcourir</SectionTitle>
            <View style={styles.grid}>
              {tiles.map((tile) => (
                <PressableScale
                  key={tile.id}
                  onPress={() => {
                    haptics.select();
                    setQuery(tile.name);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${tile.name}, ${tile.count} concerts`}
                  style={styles.tile}>
                  {tile.imageUrl ? (
                    <Image source={tile.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : null}
                  <View style={[StyleSheet.absoluteFill, styles.tileFade]} />
                  <Text style={styles.tileName}>{tile.name}</Text>
                  <Text style={styles.tileCount}>{tile.count} concerts</Text>
                </PressableScale>
              ))}
            </View>
          </>
        ) : results ? (
          <Animated.View entering={FadeIn.duration(motion.fadeMs)} style={styles.results}>
            {best ? (
              <>
                <SectionTitle>Meilleur résultat</SectionTitle>
                <View style={styles.best}>
                  <View style={styles.bestAvatar}>
                    {best.image_url ? (
                      <Image source={best.image_url} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Text style={styles.bestInitials}>{getInitials(best.name)}</Text>
                    )}
                  </View>
                  <Text style={styles.bestName}>{best.name}</Text>
                  <Text style={styles.bestMeta}>Artiste{best.genre ? ` · ${best.genre.name}` : ''}</Text>
                </View>
              </>
            ) : null}

            {results.events.length > 0 ? (
              <View>
                <SectionTitle>Concerts</SectionTitle>
                {results.events.map((event) => {
                  const view = describeEvent(event);
                  return <PlaylistRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
                })}
              </View>
            ) : null}

            {results.venues.length > 0 ? (
              <View style={styles.list}>
                <SectionTitle>Salles</SectionTitle>
                {results.venues.map((venue) => (
                  <View key={venue.id} style={styles.venue}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.bestMeta}>{venue.city.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {results.artists.length + results.events.length + results.venues.length + results.cities.length === 0 ? (
              <Text style={styles.bestMeta}>Aucun résultat pour « {debounced.trim()} ».</Text>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  largeTitle: {
    fontFamily: fonts.bold,
    fontSize: flow.size.largeTitle,
    color: colors.text,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touch.minSize + spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.none,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: flow.tileWidth,
    flexGrow: 1,
    height: flow.tileHeight,
    justifyContent: 'flex-end',
    padding: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  tileFade: {
    experimental_backgroundImage: PHOTO_FADE,
  },
  tileName: {
    fontFamily: fonts.bold,
    fontSize: flow.size.browseTile,
    color: colors.text,
  },
  tileCount: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
  results: {
    gap: spacing.lg,
  },
  best: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  bestAvatar: {
    width: flow.lineupAvatar + spacing.lg,
    height: flow.lineupAvatar + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  bestInitials: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textSecondary,
  },
  bestName: {
    fontFamily: fonts.bold,
    fontSize: flow.size.largeTitle,
    color: colors.text,
  },
  bestMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.xs,
  },
  venue: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  venueName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
