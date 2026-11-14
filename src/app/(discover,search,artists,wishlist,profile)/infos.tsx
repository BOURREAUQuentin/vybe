import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { SecondaryButton } from '@/components/SecondaryButton';
import { usePhotoCredits } from '@/features/infos/api';
import { about, legalNotice, privacyPolicy, publisher } from '@/features/infos/content';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, lineHeights, opacity, spacing, touch } from '@/theme/tokens';

// Page Infos, ouverte depuis Découvrir : à propos, mentions légales, confidentialité.
export default function InfosScreen() {
  const version = Constants.expoConfig?.version;
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();

  const writeToUs = () => {
    // Ouvre l'application de messagerie ; l'adresse reste lisible dans le texte si aucune n'est installée.
    Linking.openURL(`mailto:${publisher.email}`).catch(() => undefined);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
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

      <PhotoCredits />

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

// Crédits des photos de villes (Wikimedia Commons) : obligatoires pour les licences CC BY / BY-SA.
// Toucher une ligne ouvre la page de la photo. Section masquée tant qu'il n'y a rien à créditer.
function PhotoCredits() {
  const { data } = usePhotoCredits();
  if (!data || data.length === 0) return null;

  return (
    <DetailSection title="Crédits photos">
      <Text style={styles.body}>Photos des villes : Wikimedia Commons, sous licences libres.</Text>
      {data.map((credit) => (
        <Pressable
          key={credit.id}
          disabled={!credit.image_source_url}
          onPress={() => {
            if (credit.image_source_url) Linking.openURL(credit.image_source_url).catch(() => undefined);
          }}
          accessibilityRole="link"
          accessibilityLabel={`${credit.name} : ${credit.image_credit ?? ''}`}
          accessibilityHint="Ouvre la page de la photo"
          style={({ pressed }) => [styles.credit, pressed && styles.pressed]}>
          <Text style={styles.creditCity}>{credit.name}</Text>
          <Text style={styles.creditText}>{credit.image_credit} ›</Text>
        </Pressable>
      ))}
    </DetailSection>
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
  credit: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  creditCity: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  creditText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
