import { ScrollView, StyleSheet, View } from 'react-native';

import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { colors, fontSizes, radius, sizes, spacing } from '@/theme/tokens';

const FEATURED_COUNT = 3;
const CARD_COUNT = 3;

// Silhouette de la page Découvrir pendant le premier chargement.
export function DiscoverSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Chargement des concerts"
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.block, styles.sectionTitle]} />
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {Array.from({ length: FEATURED_COUNT }, (_, index) => (
          <View key={index} style={[styles.block, styles.featured]} />
        ))}
      </ScrollView>
      <View style={[styles.block, styles.sectionTitle]} />
      <View style={styles.cards}>
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  block: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    width: '40%',
    height: fontSizes.lg,
    marginHorizontal: spacing.md,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  featured: {
    width: sizes.featuredWidth,
    height: sizes.featuredHeight,
    borderRadius: radius.lg,
  },
  cards: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
