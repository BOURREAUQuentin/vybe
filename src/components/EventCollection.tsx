import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import type { EventListItem } from '@/features/events/api';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, spacing } from '@/theme/tokens';

const SKELETON_COUNT = 5;

type EventCollectionProps = {
  /** Grand titre de la page (« NANTES », « RAP »). */
  title: string;
  /** Garde les concerts de la collection parmi les concerts à venir. */
  filter: (events: EventListItem[]) => EventListItem[];
  emptyTitle: string;
};

// Page de liste : tous les concerts à venir d'une ville ou d'un genre.
// Réutilise la requête de la page Découvrir (même cache, pas de nouvel appel).
export function EventCollection({ title, filter, emptyTitle }: EventCollectionProps) {
  const router = useRouter();
  const { data, error, isRefetching, refetch } = useUpcomingEvents();

  const header = (
    <Text
      style={styles.title}
      accessibilityRole="header"
      numberOfLines={2}
      maxFontSizeMultiplier={maxFontScale.display}>
      {title}
    </Text>
  );

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <View style={styles.list}>
            {header}
            <View style={styles.skeletons} accessibilityLabel="Chargement des concerts">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  const events = filter(data);

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(event) => event.id}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
        />
      )}
      contentContainerStyle={[styles.list, events.length === 0 && styles.emptyList]}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          {header}
          <Text style={styles.count}>
            {events.length} concert{events.length > 1 ? 's' : ''} à venir
          </Text>
          {error ? (
            <Text style={styles.refreshError}>
              Impossible d’actualiser. Les concerts affichés peuvent ne pas être à jour.
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title={emptyTitle}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  skeletons: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  separator: {
    height: spacing.xs,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    marginTop: spacing.xs,
  },
});
