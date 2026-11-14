import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, fonts, fontSizes, iconSizes, lineHeights, radius, sizes, spacing } from '@/theme/tokens';

type SignInPromptProps = {
  title: string;
  message: string;
  /** Grande icône au-dessus du titre (symbole SF sur iOS, Material Symbol sur Android). */
  icon?: SymbolViewProps['name'];
  /** Contenu facultatif sous le bouton (ex. lien « À propos »), toujours visible au centre de l'écran. */
  children?: ReactNode;
};

// Invitation à se connecter (sans compte) : explication + bouton principal « Se connecter ».
// L'application reste consultable sans compte ; la connexion ne sert qu'à suivre et enregistrer.
export function SignInPrompt({ title, message, icon, children }: SignInPromptProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {icon ? (
        <View style={styles.icon}>
          <SymbolView name={icon} size={iconSizes.lg} tintColor={colors.text} />
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    width: sizes.avatarXL,
    height: sizes.avatarXL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.normal,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
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
