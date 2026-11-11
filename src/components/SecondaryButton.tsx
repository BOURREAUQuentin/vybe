import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
};

// Bouton secondaire : contour clair, fond transparent, texte clair (pas de lime).
export function SecondaryButton({ label, onPress, accessibilityHint }: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
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
