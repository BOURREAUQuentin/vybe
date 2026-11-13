import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailSection } from '@/components/DetailSection';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SignInPrompt } from '@/components/SignInPrompt';
import { ToggleChip } from '@/components/ToggleChip';
import { useFilterOptions } from '@/features/filters/useFilteredEvents';
import {
  useFavoriteCities,
  useFavoriteVenues,
  useGenrePreferences,
  useToggleGenrePreference,
} from '@/features/preferences/usePreferences';
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
        {/* Le lien « À propos » est sous le bouton : en bas d'écran, la barre d'onglets le masquait. */}
        <SignInPrompt
          title="Ton compte Vybe"
          message="Un compte pour suivre tes artistes, enregistrer tes envies et garder tes villes et salles favorites. Sans mot de passe.">
          {aboutLink}
        </SignInPrompt>
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

        <PreferencesSection />

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

// Préférences (V1.3) : villes (dont la principale), salles favorites, genres préférés.
function PreferencesSection() {
  const router = useRouter();
  const options = useFilterOptions();
  const cities = useFavoriteCities();
  const venues = useFavoriteVenues();
  const genres = useGenrePreferences();
  const toggleGenre = useToggleGenrePreference();

  const main = cities.data?.find((row) => row.is_main);
  const otherCities = cities.data?.filter((row) => !row.is_main) ?? [];
  const citiesSummary = cities.data
    ? [main ? `${main.city.name} (principale)` : null, ...otherCities.map((row) => row.city.name)]
        .filter(Boolean)
        .join(' · ') || 'Aucune ville'
    : 'Chargement…';
  const venuesSummary = venues.data
    ? venues.data.map((row) => row.venue.name).join(' · ') || 'Aucune salle'
    : 'Chargement…';
  const selectedGenres = new Set(genres.data ?? []);

  return (
    <DetailSection title="Préférences">
      <LinkRow
        icon={{ ios: 'building.2', android: 'location_city' }}
        title="Mes villes"
        subtitle={citiesSummary}
        onPress={() => router.push('/favorite-cities')}
      />
      <LinkRow
        icon={{ ios: 'music.mic', android: 'stadium' }}
        title="Mes salles"
        subtitle={venuesSummary}
        onPress={() => router.push('/favorite-venues')}
      />
      <Text style={styles.subTitle}>Mes genres</Text>
      <View style={styles.chips}>
        {(options.data?.genres ?? []).map((genre) => {
          const selected = selectedGenres.has(genre.id);
          return (
            <ToggleChip
              key={genre.id}
              label={genre.name}
              selected={selected}
              onPress={() => toggleGenre.mutate({ genreId: genre.id, add: !selected })}
            />
          );
        })}
      </View>
      {toggleGenre.isError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Impossible d’enregistrer ce genre. Vérifie ta connexion et réessaie.
        </Text>
      ) : null}
    </DetailSection>
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
  subTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
  },
});
