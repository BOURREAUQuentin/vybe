import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useAuth } from '@/features/auth/AuthContext';
import { about, legalNotice, privacyPolicy, publisher } from '@/features/infos/content';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// Page Infos, ouverte depuis Découvrir : à propos, mentions légales, confidentialité.
export default function InfosScreen() {
  const version = Constants.expoConfig?.version;
  const router = useRouter();
  const { email, signOut } = useAuth();

  const writeToUs = () => {
    // Ouvre l'application de messagerie ; l'adresse reste lisible dans le texte si aucune n'est installée.
    Linking.openURL(`mailto:${publisher.email}`).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* TEMPORAIRE (V1.3, étape 3) : déplacé dans l'onglet Profil à l'étape 4. */}
      <DetailSection title="Compte">
        {email ? (
          <>
            <Text style={styles.body}>Connecté : {email}</Text>
            <View style={styles.contact}>
              <SecondaryButton label="Se déconnecter" onPress={() => void signOut()} />
            </View>
          </>
        ) : (
          <View style={styles.contact}>
            <SecondaryButton label="Se connecter" onPress={() => router.push('/sign-in')} />
          </View>
        )}
      </DetailSection>

      <DetailSection title="À propos">
        <Paragraphs items={about} />
      </DetailSection>

      <DetailSection title="Mentions légales">
        <Paragraphs items={legalNotice} />
      </DetailSection>

      <DetailSection title="Politique de confidentialité">
        <Paragraphs items={privacyPolicy} />
      </DetailSection>

      <View style={styles.contact}>
        <SecondaryButton
          label="Nous écrire"
          onPress={writeToUs}
          accessibilityHint={`Ouvre un e-mail vers ${publisher.email}`}
        />
      </View>

      {version ? <Text style={styles.version}>Version {version}</Text> : null}
    </ScrollView>
  );
}

function Paragraphs({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.paragraphs}>
      {items.map((text) => (
        <Text key={text} style={styles.body}>
          {text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  paragraphs: {
    gap: spacing.sm,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
  contact: {
    alignItems: 'flex-start',
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
