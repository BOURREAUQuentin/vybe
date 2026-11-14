import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { MIN_QUERY_LENGTH } from '@/features/search/api';
import { useSearch } from '@/features/search/useSearch';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, letterSpacing, opacity, radius, sizes, spacing, touch } from '@/theme/tokens';

import { Avatar, Glass, LinkRow, PHOTO_FADE, quickFade, SectionTitle, Ticket } from './components';
import { getMatchNote, getTopArtists } from './helpers';
import { hybride } from './tokens';

const SEARCH_DELAY_MS = 300;

// HYBRIDE — Recherche : avant de taper, « Artistes à l'affiche » (les plus programmés, 8 max) et
// « Parcourir les villes » (triées par nombre de concerts). Résultats : artistes, concerts en tickets
// (l'artiste cherché est mis en avant s'il joue en première partie), salles et villes avec icône.
export function HybrideSearch({ nav }: MockupScreenProps) {
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, SEARCH_DELAY_MS);
  const isSearching = debounced.trim().length >= MIN_QUERY_LENGTH;
  const { data: results } = useSearch(debounced);
  const { data: upcoming } = useUpcomingEvents();
  const { data: wishIds } = useWishlistIds();

  const topArtists = useMemo(() => (upcoming ? getTopArtists(upcoming, hybride.topArtists) : []), [upcoming]);
  const cityTiles = useMemo(() => {
    if (!upcoming) return [];
    // Villes triées par nombre de concerts à venir, limitées pour garder l'écran court.
    return buildDiscoverSections(upcoming).cities.slice(0, hybride.topCities).map((city) => {
      const withPhoto = upcoming
        .filter((event) => event.venue?.city.id === city.id)
        .map(describeEvent)
        .find((view) => view.imageUrl !== null);
      return { ...city, imageUrl: withPhoto?.imageUrl ?? null };
    });
  }, [upcoming]);

  const openArtist = (id: string) => router.push({ pathname: '/artist/[id]', params: { id } });
  const isEmpty =
    results !== undefined &&
    results.artists.length + results.events.length + results.venues.length + results.cities.length === 0;

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
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              hitSlop={touch.minSize / 4}
              style={({ pressed }) => pressed && styles.pressed}>
              <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={iconSizes.md} tintColor={colors.textSecondary} />
            </Pressable>
          ) : null}
        </Glass>

        {!isSearching ? (
          <>
            <SectionTitle>Artistes à l’affiche</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artists}>
              {topArtists.map((artist) => (
                <Pressable
                  key={artist.id}
                  onPress={() => {
                    haptics.tap();
                    openArtist(artist.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${artist.name}, ${artist.count} concerts à venir`}
                  style={({ pressed }) => [styles.artist, pressed && styles.pressed]}>
                  <Avatar name={artist.name} imageUrl={artist.imageUrl} size={hybride.avatar} />
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistCount}>
                    {artist.count} date{artist.count > 1 ? 's' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <SectionTitle>Parcourir les villes</SectionTitle>
            <View style={styles.grid}>
              {cityTiles.map((tile) => (
                <PressableScale
                  key={tile.id}
                  onPress={() => {
                    haptics.select();
                    setQuery(tile.name);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${tile.name}, ${tile.count} concerts`}
                  style={styles.tile}>
                  {tile.imageUrl ? <Image source={tile.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                  <View style={[StyleSheet.absoluteFill, styles.tileFade]} />
                  <Text style={styles.tileName}>{tile.name}</Text>
                  <Text style={styles.tileCount}>{tile.count} concerts</Text>
                </PressableScale>
              ))}
            </View>
          </>
        ) : results ? (
          <Animated.View entering={quickFade} style={styles.results}>
            {results.artists.length > 0 ? (
              <View>
                <SectionTitle>Artistes</SectionTitle>
                {results.artists.map((artist) => (
                  <LinkRow
                    key={artist.id}
                    avatar={<Avatar name={artist.name} imageUrl={artist.image_url} size={sizes.avatar + spacing.xxs} />}
                    title={artist.name}
                    subtitle={artist.genre?.name}
                    onPress={() => openArtist(artist.id)}
                  />
                ))}
              </View>
            ) : null}

            {results.events.length > 0 ? (
              <View style={styles.tickets}>
                <SectionTitle>Concerts</SectionTitle>
                {results.events.map((event) => {
                  const view = describeEvent(event);
                  return (
                    <Ticket
                      key={view.id}
                      view={view}
                      note={getMatchNote(event, debounced)}
                      isWished={wishIds?.includes(view.id) ?? false}
                      onPress={() => nav.openConcert(view.id)}
                    />
                  );
                })}
              </View>
            ) : null}

            {results.venues.length > 0 ? (
              <View>
                <SectionTitle>Salles</SectionTitle>
                {results.venues.map((venue) => (
                  <LinkRow
                    key={venue.id}
                    icon={{ ios: 'mappin.and.ellipse', android: 'location_on' }}
                    title={venue.name}
                    subtitle={venue.city.name}
                    onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
                  />
                ))}
              </View>
            ) : null}

            {results.cities.length > 0 ? (
              <View>
                <SectionTitle>Villes</SectionTitle>
                {results.cities.map((city) => (
                  <LinkRow
                    key={city.id}
                    icon={{ ios: 'building.2', android: 'location_city' }}
                    title={city.name}
                    subtitle="Voir les concerts"
                    onPress={() => router.push({ pathname: '/concerts', params: { city: city.id } })}
                  />
                ))}
              </View>
            ) : null}

            {isEmpty ? (
              <Text style={styles.empty}>Aucun résultat pour « {debounced.trim()} ». Vérifie l’orthographe ou essaie une ville.</Text>
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
    fontSize: hybride.size.largeTitle,
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
    minHeight: touch.minSize,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.none,
    color: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  artists: {
    gap: spacing.md,
  },
  artist: {
    width: hybride.avatar + spacing.lg,
    alignItems: 'center',
    gap: spacing.xxs,
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
  },
  tile: {
    width: hybride.tileWidth,
    flexGrow: 1,
    height: hybride.tileHeight,
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
    fontSize: hybride.size.tile,
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
  tickets: {
    gap: spacing.sm,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
