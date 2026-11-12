import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailSection } from '@/components/DetailSection';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SignInPrompt } from '@/components/SignInPrompt';
import { LinkRow } from '@/components/LinkRow';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// Onglet « Profil » (V1.3). Étape 4 : compte et déconnexion ; préférences (étape 7)
// et « Mes données » (étape 8) à venir.
export default function ProfileScreen() {
  const router = useRouter();
  const { email, isRestoring, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const aboutLink = <InfoLink onPress={() => router.push('/infos')} />;

  if (isRestoring) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Profil" />
        <View style={styles.center} accessibilityLabel="Chargement">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!email) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Profil" />
        <SignInPrompt
          title="Ton compte Vybe"
          message="Un compte pour suivre tes artistes, enregistrer tes envies et garder tes villes et salles favorites. Sans mot de passe."
        />
        <View style={styles.footer}>{aboutLink}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profil" />
      <ScrollView contentContainerStyle={styles.content}>
        <DetailSection title="Compte">
          <Text style={styles.body} accessibilityLabel={`Connecté avec ${email}`}>
            {email}
          </Text>
        </DetailSection>

        <DetailSection title="Préférences">
          <Text style={styles.soon}>
            Villes, salles et genres favoris : bientôt disponibles.
          </Text>
        </DetailSection>

        <DetailSection title="Mes données">
          <Text style={styles.soon}>
            Export de tes données et suppression du compte : bientôt disponibles.
          </Text>
        </DetailSection>

        {aboutLink}

        <View style={styles.signOut}>
          <SecondaryButton
            label="Se déconnecter"
            loading={isSigningOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Lien vers la page Infos (à propos, mentions légales, confidentialité).
function InfoLink({ onPress }: { onPress: () => void }) {
  return (
    <LinkRow
      icon={{ ios: 'info.circle', android: 'info' }}
      title="À propos et confidentialité"
      subtitle="Mentions légales, politique de confidentialité"
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  body: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  soon: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
  },
  signOut: {
    alignItems: 'flex-start',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});
