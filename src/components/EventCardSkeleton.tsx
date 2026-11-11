import { StyleSheet, View } from 'react-native';

import { colors, fontSizes, radius, spacing } from '@/theme/tokens';

// Silhouette grise d'une carte de concert, affichée pendant le premier chargement.
export function EventCardSkeleton() {
  return (
    <View style={styles.card} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.dateBlock} />
      <View style={styles.info}>
        <View style={[styles.line, styles.lineTitle]} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={[styles.line, styles.lineMedium]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  dateBlock: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  line: {
    height: fontSizes.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  lineTitle: {
    width: '60%',
    height: fontSizes.md,
  },
  lineShort: {
    width: '45%',
  },
  lineMedium: {
    width: '70%',
  },
});
