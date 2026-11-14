import { ScrollView, StyleSheet, View } from 'react-native';

import { TicketSkeleton } from '@/components/TicketSkeleton';
import { colors, fontSizes, radius, sizes, spacing } from '@/theme/tokens';

const CAROUSEL_COUNT = 2;
const TICKET_COUNT = 3;

// Silhouette de Découvrir pendant le premier chargement : grand visuel, carrousel, billets.
export function DiscoverSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Chargement des concerts"
      importantForAccessibility="no-hide-descendants">
      <View style={styles.hero} />
      <View style={[styles.block, styles.sectionTitle]} />
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {Array.from({ length: CAROUSEL_COUNT }, (_, index) => (
          <View key={index} style={[styles.block, styles.card]} />
        ))}
      </ScrollView>
      <View style={[styles.block, styles.sectionTitle]} />
      <View style={styles.tickets}>
        {Array.from({ length: TICKET_COUNT }, (_, index) => (
          <TicketSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hero: {
    height: sizes.heroVisual,
    backgroundColor: colors.surface,
  },
  block: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    width: '40%',
    height: fontSizes.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: sizes.carouselCardWidth,
    height: sizes.carouselCardHeight,
    borderRadius: radius.lg,
  },
  tickets: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
