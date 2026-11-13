import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { DetailSkeleton } from '@/components/DetailSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SignInPrompt } from '@/components/SignInPrompt';
import { VenueRow } from '@/components/VenueRow';
import { useAuth } from '@/features/auth/AuthContext';
import { useFavoriteVenues } from '@/features/preferences/usePreferences';
import { colors, spacing } from '@/theme/tokens';

// « Mes salles » (V1.3) : salles favorites (ajoutées depuis la fiche salle).
export default function FavoriteVenuesScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data, error, refetch } = useFavoriteVenues();

  if (!userId) {
    return (
      <View style={styles.container}>
        <SignInPrompt
          title="Tes salles"
          message="Connecte-toi pour garder tes salles favorites."
        />
      </View>
    );
  }

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState title="Impossible de charger tes salles" onRetry={() => refetch()} />
        ) : (
          <DetailSkeleton />
        )}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Aucune salle favorite"
          message="Ouvre la fiche d’une salle et touche « Ajouter à mes salles »."
          action={{ label: 'Chercher une salle', onPress: () => router.navigate('/search') }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {data.map((row) => (
        <VenueRow
          key={row.venue_id}
          name={row.venue.name}
          subtitle={row.venue.city.name}
          onPress={() => router.push({ pathname: '/venue/[id]', params: { id: row.venue.id } })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
