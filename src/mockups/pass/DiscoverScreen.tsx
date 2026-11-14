import { useMemo, useRef } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildDiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived } from '@/mockups/shared/motion';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupScreenProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, radius, spacing, touch } from '@/theme/tokens';

import { Label, PassCard, Ticket } from './components';
import { pass } from './tokens';

const SNAP = pass.cardWidth + spacing.sm;

// PASS — Découvrir : compteur, carrousel de pass, tickets, zones par ville.
export function PassDiscover({ nav }: MockupScreenProps) {
  const { data, error, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);
  const bottomSpace = useTabBarSpace();
  const lastIndex = useRef(0);

  if (!data || !sections) return <MockupState error={error} onRetry={() => void refetch()} />;

  const featured = sections.featured.map(describeEvent);
  const thisWeek = (sections.thisWeek.length > 0 ? sections.thisWeek : data.slice(0, 5)).map(describeEvent);

  // Petit « clic » haptique quand un nouveau pass s'aligne dans le carrousel.
  const onCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP);
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      haptics.select();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <View style={styles.header}>
          <Label>Vybe · France</Label>
          <View style={styles.counterRow}>
            <Text style={styles.counter} maxFontSizeMultiplier={maxFontScale.display}>
              {data.length}
            </Text>
            <View style={styles.counterText}>
              <Text style={styles.counterLabel}>concerts à venir</Text>
              <Text style={styles.counterHint}>{sections.cities.length} villes · rap en tête d’affiche</Text>
            </View>
          </View>
        </View>

        <SectionHeader title="À l’affiche" count={featured.length} />
        <FlatList
          horizontal
          data={featured}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          onScroll={onCarouselScroll}
          scrollEventThrottle={32}
          contentContainerStyle={styles.carousel}
          renderItem={({ item }) => <PassCard view={item} onPress={() => nav.openConcert(item.id)} />}
        />

        <SectionHeader title={sections.thisWeek.length > 0 ? 'Cette semaine' : 'Prochaines dates'} count={thisWeek.length} />
        <View style={styles.list}>
          {thisWeek.map((view) => (
            <Ticket key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />
          ))}
        </View>

        <SectionHeader title="Zones" count={sections.cities.length} />
        <View style={styles.zones}>
          {sections.cities.map((city) => (
            <PressableScale
              key={city.id}
              onPress={haptics.select}
              accessibilityRole="button"
              accessibilityLabel={`${city.name}, ${city.count} concerts`}
              style={styles.zone}>
              <Label>Zone</Label>
              <Text style={styles.zoneName} numberOfLines={1}>
                {city.name}
              </Text>
              <Text style={styles.zoneCount}>{String(city.count).padStart(2, '0')} dates</Text>
            </PressableScale>
          ))}
        </View>

        {sections.months.slice(0, 2).map((month) => (
          <View key={month.key}>
            <SectionHeader title={month.title} count={month.data.length} />
            <View style={styles.list}>
              {month.data.slice(0, 6).map((event) => {
                const view = describeEvent(event);
                return <Ticket key={view.id} view={view} onPress={() => nav.openConcert(view.id)} />;
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// En-tête de section : titre, filet pointillé, nombre en chiffres tabulaires.
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader} accessibilityRole="header" accessible accessibilityLabel={`${title}, ${count}`}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionRule} />
      <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  counter: {
    fontFamily: fonts.display,
    fontSize: pass.size.counter,
    lineHeight: pass.size.counter * lineHeights.display,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  counterText: {
    flex: 1,
    gap: spacing.xxs,
  },
  counterLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  counterHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    letterSpacing: pass.labelSpacing,
    color: colors.text,
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: derived.hairlineStrong,
  },
  sectionCount: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  carousel: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  zones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  zone: {
    minWidth: pass.zoneMinWidth,
    flexGrow: 1,
    minHeight: touch.minSize,
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoneName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  zoneCount: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
});
