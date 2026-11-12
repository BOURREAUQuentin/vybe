import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useAuth } from '@/features/auth/AuthContext';
import { useFollowedArtists, useToggleFollow } from '@/features/follows/useFollows';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type FollowButtonProps = {
  artist: { id: string; name: string; image_url: string | null; genre: { id: string; name: string } | null };
};

// Bouton « Suivre » de la fiche artiste (seule action principale lime de la fiche).
// Sans compte : ouvre la connexion. Suivi : bouton secondaire « ✓ Suivi » (toucher = ne plus suivre).
export function FollowButton({ artist }: FollowButtonProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: followed, isLoading } = useFollowedArtists();
  const toggle = useToggleFollow();

  const isFollowing = followed?.some((row) => row.artist_id === artist.id) ?? false;

  if (!userId) {
    return (
      <PrimaryButton
        label="Suivre"
        accessibilityHint="Connecte-toi pour suivre cet artiste"
        onPress={() => router.push('/sign-in')}
      />
    );
  }

  const onPress = () => toggle.mutate({ artist, follow: !isFollowing });

  return (
    <View style={styles.container}>
      {isFollowing ? (
        <SecondaryButton
          label="✓ Suivi"
          accessibilityHint={`Ne plus suivre ${artist.name}`}
          disabled={toggle.isPending}
          onPress={onPress}
        />
      ) : (
        <PrimaryButton
          label="Suivre"
          accessibilityHint={`Suivre ${artist.name} et retrouver ses concerts dans Mes artistes`}
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
