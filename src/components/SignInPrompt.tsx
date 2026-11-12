import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

type SignInPromptProps = {
  title: string;
  message: string;
  /** Contenu facultatif sous le bouton (ex. lien « À propos »), toujours visible au centre de l'écran. */
  children?: ReactNode;
};

// Invitation à se connecter (sans compte) : explication + bouton principal « Se connecter ».
// L'application reste consultable sans compte ; la connexion ne sert qu'à suivre et enregistrer.
export function SignInPrompt({ title, message, children }: SignInPromptProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.action}>
        <PrimaryButton
          label="Se connecter"
          accessibilityHint="Ouvre la connexion par code e-mail"
          onPress={() => router.push('/sign-in')}
        />
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
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
    alignSelf: 'stretch',
  },
  extra: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
