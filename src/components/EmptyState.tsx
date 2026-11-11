import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/SecondaryButton';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

type EmptyStateProps = {
  title: string;
  message?: string;
  /** Action facultative (bouton secondaire), ex. « Retour ». */
  action?: { label: string; onPress: () => void };
};

// Message centré quand un écran n'a rien à afficher.
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? (
        <View style={styles.action}>
          <SecondaryButton label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
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
