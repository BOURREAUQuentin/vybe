import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, opacity, spacing, touch } from '@/theme/tokens';

type SectionTitleProps = {
  title: string;
  /** Lien facultatif à droite du titre (ex. « Tout voir »). */
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
};

// Titre d'une section de la page Découvrir (Inter : Anton est réservé aux grands titres).
export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="link"
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionLabel}>{action.label} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  action: {
    minHeight: touch.minSize,
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressed,
  },
  actionLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
