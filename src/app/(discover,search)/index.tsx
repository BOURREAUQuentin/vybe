import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { IconButton } from '@/components/IconButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

const SKELETON_COUNT = 6;

// Onglet Découvrir. Étape 4 : liste simple des concerts à venir.
// Les sections (« Rap à l'affiche », « Cette semaine »…) arrivent à l'étape 6.
export default function DiscoverScreen() {
  const router = useRouter();
  const { data, error, isRefetching, refetch } = useUpcomingEvents();

  const header = (
    <ScreenHeader
      title="Découvrir"
      action={
        <IconButton
          icon={{ ios: 'info.circle', android: 'info' }}
          accessibilityLabel="Informations"
          onPress={() => router.push('/infos')}
        />
      }
    />
  );

  // Pas encore de données : erreur du premier chargement, ou chargement en cours.
  if (data === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        {error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <View style={[styles.list, styles.skeletons]} accessibilityLabel="Chargement des concerts">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}
      <FlatList
        data={data}
        keyExtractor={(event) => event.id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={[styles.list, data.length === 0 && styles.emptyList]}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          // Échec d'un rafraîchissement : on garde les concerts déjà affichés.
          error ? (
            <Text style={styles.refreshError}>
              Impossible d’actualiser. Les concerts affichés peuvent ne pas être à jour.
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucun concert à venir"
            message="De nouvelles dates sont annoncées régulièrement : reviens bientôt."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.text}
          />
        }
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  skeletons: {
    gap: spacing.xs,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.xs,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    marginBottom: spacing.sm,
  },
});
