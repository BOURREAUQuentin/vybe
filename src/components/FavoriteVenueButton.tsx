import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useAuth } from '@/features/auth/AuthContext';
import { useFavoriteVenues, useToggleFavoriteVenue } from '@/features/preferences/usePreferences';
import { haptics } from '@/lib/haptics';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type FavoriteVenueButtonProps = {
  venue: { id: string; name: string; city: { id: string; name: string } };
};

// Bouton « Ajouter à mes salles » de la fiche salle (seule action principale lime de la fiche).
// Sans compte : ouvre la connexion. Favorite : bouton secondaire « ✓ Salle favorite ».
export function FavoriteVenueButton({ venue }: FavoriteVenueButtonProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: favorites, isLoading } = useFavoriteVenues();
  const toggle = useToggleFavoriteVenue();

  const isFavorite = favorites?.some((row) => row.venue_id === venue.id) ?? false;

  if (!userId) {
    return (
      <PrimaryButton
        label="Ajouter à mes salles"
        accessibilityHint="Connecte-toi pour garder cette salle en favori"
        onPress={() => router.push('/sign-in')}
      />
    );
  }

  const onPress = () => {
    // Vibration de succès quand on ajoute, simple appui quand on retire.
    if (isFavorite) haptics.tap();
    else haptics.success();
    toggle.mutate({ venue, add: !isFavorite });
  };

  return (
    <View style={styles.container}>
      {isFavorite ? (
        <SecondaryButton
          label="✓ Salle favorite"
          accessibilityHint={`Retirer ${venue.name} de mes salles`}
          disabled={toggle.isPending}
          onPress={onPress}
        />
      ) : (
        <PrimaryButton
          label="Ajouter à mes salles"
          accessibilityHint={`Ajouter ${venue.name} à mes salles favorites`}
          disabled={isLoading || toggle.isPending}
          onPress={onPress}
        />
      )}
      {toggle.isError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Impossible d’enregistrer ton choix. Vérifie ta connexion et réessaie.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
  },
});
