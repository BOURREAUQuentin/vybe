import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  /** Action en cours : petite roue de chargement, bouton inactif. */
  loading?: boolean;
};

// Bouton secondaire : contour clair, fond transparent, texte clair (pas de lime).
export function SecondaryButton({
  label,
  onPress,
  accessibilityHint,
  disabled = false,
  loading = false,
}: SecondaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed]}>
      {loading ? <ActivityIndicator size="small" color={colors.text} /> : null}
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
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
