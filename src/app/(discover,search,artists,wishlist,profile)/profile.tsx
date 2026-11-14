import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailSection } from '@/components/DetailSection';
import { LinkRow } from '@/components/LinkRow';
import { MyDataSection } from '@/components/MyDataSection';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SignInPrompt } from '@/components/SignInPrompt';
import { ToggleChip } from '@/components/ToggleChip';
import { useAuth } from '@/features/auth/AuthContext';
import { useFilterOptions } from '@/features/filters/useFilteredEvents';
import {
  useFavoriteCities,
  useFavoriteVenues,
  useGenrePreferences,
  useToggleGenrePreference,
} from '@/features/preferences/usePreferences';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

// Onglet « Profil » (V1.3) : compte, préférences, mes données (export, suppression),
// à propos et déconnexion.
export default function ProfileScreen() {
  const router = useRouter();
  const { email, isRestoring, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Le bas de la page (« Se déconnecter ») ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  // Pendant le menu de partage (et un court instant après), l'écran ignore les touchers :
  // le toucher qui ferme le menu ne doit pas « traverser » jusqu'à une ligne du Profil.
  const [blockTouches, setBlockTouches] = useState(false);

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
          icon={{ ios: 'person.crop.circle', android: 'account_circle' }}
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
      <View style={styles.container} pointerEvents={blockTouches ? 'none' : 'auto'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <DetailSection title="Compte">
          <Text style={styles.body} accessibilityLabel={`Connecté avec ${email}`}>
            {email}
          </Text>
        </DetailSection>

        <PreferencesSection />

        <MyDataSection onShareStateChange={setBlockTouches} />

        {aboutLink}

        <View style={styles.signOut}>
          <SecondaryButton
            label="Se déconnecter"
            loading={isSigningOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      </ScrollView>
      </View>
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
