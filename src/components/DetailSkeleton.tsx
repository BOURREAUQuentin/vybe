import { StyleSheet, View } from 'react-native';

import { colors, fontSizes, radius, spacing } from '@/theme/tokens';

// Silhouette grise d'une fiche (concert ou artiste) pendant le chargement.
export function DetailSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Chargement"
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.block, styles.title]} />
      <View style={[styles.block, styles.badge]} />
      <View style={[styles.block, styles.line]} />
      <View style={[styles.block, styles.lineShort]} />
      <View style={[styles.block, styles.button]} />
      <View style={[styles.block, styles.line]} />
      <View style={[styles.block, styles.line]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.md,
  },
  block: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  title: {
    width: '80%',
    height: fontSizes.display,
  },
  badge: {
    width: '30%',
    height: fontSizes.lg,
  },
  line: {
    width: '90%',
    height: fontSizes.md,
  },
  lineShort: {
    width: '55%',
    height: fontSizes.md,
  },
  button: {
    width: '100%',
    height: spacing.xxl,
    borderRadius: radius.pill,
  },
});
