import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  /** Action en cours : petite roue de chargement, bouton inactif. */
  loading?: boolean;
  /** « danger » : action destructrice (contour et texte en couleur d'alerte). */
  tone?: 'default' | 'danger';
};

// Bouton secondaire : contour clair, fond transparent, texte clair (pas de lime).
export function SecondaryButton({
  label,
  onPress,
  accessibilityHint,
  disabled = false,
  loading = false,
  tone = 'default',
}: SecondaryButtonProps) {
  const inactive = disabled || loading;
  const isDanger = tone === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isDanger && styles.dangerButton,
        (pressed || disabled) && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={isDanger ? colors.alert : colors.text} />
      ) : null}
      <Text style={[styles.label, isDanger && styles.dangerLabel]}>{label}</Text>
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
  dangerButton: {
    borderColor: colors.alert,
  },
  dangerLabel: {
    color: colors.alert,
  },
});
