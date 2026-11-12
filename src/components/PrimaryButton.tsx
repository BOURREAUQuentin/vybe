import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  /** Action en cours : petite roue de chargement, bouton inactif. */
  loading?: boolean;
};

// Bouton principal (lime). Un seul par écran : voir docs/design.md.
export function PrimaryButton({
  label,
  onPress,
  accessibilityHint,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed]}>
      {loading ? <ActivityIndicator size="small" color={colors.onAccent} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.onAccent,
  },
});
