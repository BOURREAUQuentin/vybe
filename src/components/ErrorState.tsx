import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/SecondaryButton';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

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
      <View style={styles.action}>
        <SecondaryButton label="Réessayer" onPress={onRetry} />
      </View>
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
  action: {
    marginTop: spacing.sm,
  },
});
