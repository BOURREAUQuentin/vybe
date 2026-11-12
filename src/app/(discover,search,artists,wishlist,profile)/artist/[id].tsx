import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArtistHero } from '@/components/ArtistHero';
import { DetailSection } from '@/components/DetailSection';
import { DetailSkeleton } from '@/components/DetailSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { FollowButton } from '@/components/FollowButton';
import type { ArtistWithEvents } from '@/features/artists/api';
import { useArtist } from '@/features/artists/useArtist';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// Fiche artiste.
export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, error, refetch } = useArtist(id);

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState title="Impossible de charger cet artiste" onRetry={() => refetch()} />
        ) : (
          <DetailSkeleton />
        )}
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Artiste introuvable"
          message="Cette fiche n’existe plus ou le lien n’est plus valide."
          action={{
            label: 'Retour',
            onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
          }}
        />
      </View>
    );
  }

  return <ArtistDetail artist={data.artist} events={data.events} />;
}

function ArtistDetail({ artist, events }: ArtistWithEvents) {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <ArtistHero name={artist.name} imageUrl={artist.image_url} />

      <View style={styles.content}>
        {artist.genre ? <Text style={styles.genre}>{artist.genre.name}</Text> : null}

        {/* V1.3 : seule action principale (lime) de la fiche artiste. */}
        <FollowButton artist={artist} />

        {artist.description ? (
          <Text style={styles.description}>{artist.description}</Text>
        ) : null}

        <DetailSection title="Concerts à venir">
          {events.length > 0 ? (
            <View style={styles.events}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() =>
                    router.push({ pathname: '/concert/[id]', params: { id: event.id } })
                  }
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Aucun concert annoncé pour le moment.</Text>
          )}
        </DetailSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  genre: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
  events: {
    gap: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
