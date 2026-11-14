import { SymbolView } from 'expo-symbols';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, letterSpacing, radius, sizes, spacing, touch } from '@/theme/tokens';

import { Label, Ticket, VerticalPerforation } from './components';
import { pass } from './tokens';

const SEARCH_DELAY_MS = 300;

// PASS — Recherche : champ en forme de ticket, accès rapide par zone, résultats en tickets.
export function PassSearch({ nav }: MockupScreenProps) {
  const bottomSpace = useTabBarSpace();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, SEARCH_DELAY_MS);
  const isSearching = debounced.trim().length >= MIN_QUERY_LENGTH;
  const { data: results } = useSearch(debounced);
  const { data: upcoming } = useUpcomingEvents();
  const cities = useMemo(() => (upcoming ? buildDiscoverSections(upcoming).cities : []), [upcoming]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <Label>Recherche</Label>
        <Text style={styles.title}>Trouve ta prochaine date</Text>

        {/* Champ façon billet : talon avec la loupe, perforation, saisie. */}
        <View style={styles.field}>
          <View style={styles.fieldStub}>
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search' }} size={iconSizes.md} tintColor={colors.text} />
          </View>
          <VerticalPerforation />
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
        </View>

        {!isSearching ? (
          <Group title="Accès rapide · zones" count={cities.length}>
            <View style={styles.zones}>
              {cities.map((city) => (
                <PressableScale
                  key={city.id}
                  onPress={() => {
                    haptics.select();
                    setQuery(city.name);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Chercher ${city.name}`}
                  style={styles.zone}>
                  <Text style={styles.zoneText}>{city.name}</Text>
                  <Text style={styles.zoneCount}>{city.count}</Text>
                </PressableScale>
              ))}
            </View>
          </Group>
        ) : results ? (
          <>
            {results.artists.length > 0 ? (
              <Group title="Artistes" count={results.artists.length}>
                {results.artists.map((artist) => (
                  <View key={artist.id} style={styles.row}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(artist.name)}</Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{artist.name}</Text>
                      {artist.genre ? <Text style={styles.rowMeta}>{artist.genre.name}</Text> : null}
                    </View>
                  </View>
                ))}
              </Group>
            ) : null}
            {results.events.length > 0 ? (
              <Group title="Concerts" count={results.events.length}>
                {results.events.map((event) => {
                  const view = describeEvent(event);
                  return <Ticket key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
                })}
              </Group>
            ) : null}
            {results.venues.length > 0 ? (
              <Group title="Salles" count={results.venues.length}>
                {results.venues.map((venue) => (
                  <View key={venue.id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{venue.name}</Text>
                      <Text style={styles.rowMeta}>{venue.city.name}</Text>
                    </View>
                  </View>
                ))}
              </Group>
            ) : null}
            {results.artists.length + results.events.length + results.venues.length + results.cities.length === 0 ? (
              <Text style={styles.rowMeta}>Aucun billet pour « {debounced.trim()} ».</Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Label>{title}</Label>
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
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  field: {
    flexDirection: 'row',
    minHeight: touch.minSize + spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  fieldStub: {
    width: pass.searchStubWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacing.none,
    color: colors.text,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupCount: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  zones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  zone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touch.minSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  zoneText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  zoneCount: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minSize,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
