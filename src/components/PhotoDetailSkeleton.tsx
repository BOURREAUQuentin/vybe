import { StyleSheet, View } from 'react-native';

import { colors, fontSizes, radius, sizes, spacing, touch } from '@/theme/tokens';

// Silhouette d'une fiche avec photo d'en-tête (concert) pendant le premier chargement.
export function PhotoDetailSkeleton() {
  return (
    <View style={styles.container} accessibilityLabel="Chargement" importantForAccessibility="no-hide-descendants">
      <View style={styles.photo}>
        <View style={[styles.line, styles.pill]} />
        <View style={[styles.line, styles.title]} />
      </View>
      <View style={styles.body}>
        <View style={styles.button} />
        <View style={styles.pass} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photo: {
    height: sizes.detailHeader,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  line: {
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  pill: {
    width: '35%',
    height: fontSizes.md,
    borderRadius: radius.pill,
  },
  title: {
    width: '70%',
    height: fontSizes.detailTitle,
  },
  body: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  button: {
    height: touch.minSize + spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pass: {
    height: sizes.passSkeleton,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
