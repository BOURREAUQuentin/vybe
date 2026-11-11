import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry: () => void;
};

// Écran d'erreur avec un bouton « Réessayer » (bouton secondaire : pas de lime).
export function ErrorState({
  title = 'Impossible de charger les concerts',
  message = 'Vérifie ta connexion internet puis réessaie.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonLabel}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
