import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type ChipProps = {
  label: string;
  count?: number;
  onPress: () => void;
};

// Pastille cliquable (ville, genre) avec un compteur facultatif. Sombre : pas de lime.
export function Chip({ label, count, onPress }: ChipProps) {
  const countLabel = count === undefined ? '' : `${count} concert${count > 1 ? 's' : ''}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, countLabel].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      {count !== undefined ? <Text style={styles.count}>{count}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
