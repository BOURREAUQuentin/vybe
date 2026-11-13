import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { SecondaryButton } from '@/components/SecondaryButton';
import { about, legalNotice, privacyPolicy, publisher } from '@/features/infos/content';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// Page Infos, ouverte depuis Découvrir : à propos, mentions légales, confidentialité.
export default function InfosScreen() {
  const version = Constants.expoConfig?.version;

  const writeToUs = () => {
    // Ouvre l'application de messagerie ; l'adresse reste lisible dans le texte si aucune n'est installée.
    Linking.openURL(`mailto:${publisher.email}`).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DetailSection title="À propos">
        <Paragraphs items={about} />
      </DetailSection>

      <DetailSection title="Mentions légales">
        <Paragraphs items={legalNotice} />
      </DetailSection>

      <DetailSection title="Politique de confidentialité">
        <View style={styles.policy}>
          {privacyPolicy.map((section) => (
            <View key={section.title} style={styles.policySection}>
              <Text style={styles.policyTitle} accessibilityRole="header">
                {section.title}
              </Text>
              <Paragraphs items={section.paragraphs} />
            </View>
          ))}
        </View>
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
  policy: {
    gap: spacing.md,
  },
  policySection: {
    gap: spacing.xs,
  },
  policyTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
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
