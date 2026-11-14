import { useMemo, useState, type ReactNode } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { MIN_QUERY_LENGTH } from '@/features/search/api';
import { useSearch } from '@/features/search/useSearch';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent, getTrendingArtists } from '@/mockups/shared/eventView';
import { Grain } from '@/mockups/shared/Grain';
import { haptics } from '@/mockups/shared/haptics';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, letterSpacing, lineHeights, maxFontScale, spacing, touch } from '@/theme/tokens';

import { Caps, PosterTitle, ProgramRow } from './components';
import { affiche } from './tokens';

const SEARCH_DELAY_MS = 300;
const TRENDING_COUNT = 10;

// AFFICHE — Recherche : champ souligné en gros caractères, nuage d'artistes, résultats en programme.
export function AfficheSearch({ nav }: MockupScreenProps) {
  const bottomSpace = useTabBarSpace();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, SEARCH_DELAY_MS);
  const isSearching = debounced.trim().length >= MIN_QUERY_LENGTH;
  const { data: results, isFetching } = useSearch(debounced);
  const { data: upcoming } = useUpcomingEvents();
  const trending = useMemo(() => (upcoming ? getTrendingArtists(upcoming, TRENDING_COUNT) : []), [upcoming]);

  const fill = (text: string) => {
    haptics.select();
    setQuery(text);
    Keyboard.dismiss();
  };

  const total = results
    ? results.artists.length + results.events.length + results.venues.length + results.cities.length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Grain opacity={affiche.grainOpacity} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <PosterTitle text="Cherche" size={affiche.size.poster} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Artiste, salle, ville…"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Rechercher"
          style={styles.input}
        />

        {!isSearching ? (
          <>
            <Caps>Ça tourne en ce moment</Caps>
            <View style={styles.cloud}>
              {trending.map((artist, index) => (
                <PressableScale
                  key={artist.id}
                  onPress={() => fill(artist.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chercher ${artist.name}`}
                  style={styles.cloudItem}>
                  <Text
                    style={[styles.cloudText, index % 3 === 0 ? styles.cloudBig : styles.cloudSmall]}
                    maxFontSizeMultiplier={maxFontScale.display}>
                    {artist.name.toUpperCase()}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </>
        ) : (
          <>
            <Caps>{isFetching && !results ? 'Recherche…' : `${total} résultat${total > 1 ? 's' : ''}`}</Caps>

            {results && results.artists.length > 0 ? (
              <ResultGroup title="Artistes" count={results.artists.length}>
                {results.artists.map((artist) => (
                  <View key={artist.id} style={styles.artistRow}>
                    <Text style={styles.artistName} numberOfLines={1} maxFontSizeMultiplier={maxFontScale.display}>
                      {artist.name.toUpperCase()}
                    </Text>
                    {artist.genre ? <Caps>{artist.genre.name}</Caps> : null}
                  </View>
                ))}
              </ResultGroup>
            ) : null}

            {results && results.events.length > 0 ? (
              <ResultGroup title="Concerts" count={results.events.length}>
                {results.events.map((event) => {
                  const view = describeEvent(event);
                  return <ProgramRow key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
                })}
              </ResultGroup>
            ) : null}

            {results && results.venues.length + results.cities.length > 0 ? (
              <ResultGroup title="Lieux" count={results.venues.length + results.cities.length}>
                {results.venues.map((venue) => (
                  <Text key={venue.id} style={styles.placeRow}>
                    {venue.name.toUpperCase()} <Text style={styles.placeCity}>· {venue.city.name.toUpperCase()}</Text>
                  </Text>
                ))}
                {results.cities.map((city) => (
                  <Text key={city.id} style={styles.placeRow}>
                    {city.name.toUpperCase()}
                  </Text>
                ))}
              </ResultGroup>
            ) : null}

            {results && total === 0 ? (
              <Text style={styles.empty}>Rien pour « {debounced.trim()} ». Essaie un autre nom.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Caps muted={false}>{title}</Caps>
        <Text style={styles.groupCount}>{String(count).padStart(2, '0')}</Text>
      </View>
      {children}
    </View>
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
  input: {
    minHeight: touch.minSize,
    paddingVertical: spacing.xs,
    fontFamily: fonts.bold,
    fontSize: affiche.size.input,
    letterSpacing: letterSpacing.none,
    color: colors.text,
    borderBottomWidth: affiche.inputBorder,
    borderBottomColor: colors.text,
  },
  cloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: spacing.sm,
  },
  cloudItem: {
    minHeight: touch.minSize,
    justifyContent: 'center',
  },
  cloudText: {
    fontFamily: fonts.display,
  },
  cloudBig: {
    fontSize: affiche.size.big,
    lineHeight: affiche.size.big * lineHeights.display,
    color: colors.text,
  },
  cloudSmall: {
    fontSize: affiche.size.lineupOther,
    lineHeight: affiche.size.lineupOther * lineHeights.display,
    color: colors.textSecondary,
  },
  group: {
    gap: spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCount: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.display,
    color: colors.textSecondary,
  },
  artistRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  artistName: {
    fontFamily: fonts.display,
    fontSize: affiche.size.lineupOther,
    lineHeight: affiche.size.lineupOther * lineHeights.display,
    color: colors.text,
  },
  placeRow: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  placeCity: {
    color: colors.textSecondary,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
