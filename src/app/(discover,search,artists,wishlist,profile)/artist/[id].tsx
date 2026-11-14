import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { DetailTopBar } from '@/components/DetailTopBar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FollowButton } from '@/components/FollowButton';
import { GlassPill } from '@/components/GlassPill';
import { PhotoDetailSkeleton } from '@/components/PhotoDetailSkeleton';
import { PhotoHeader } from '@/components/PhotoHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import type { ArtistWithEvents } from '@/features/artists/api';
import { useArtist } from '@/features/artists/useArtist';
import { describeEvent } from '@/features/events/eventView';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, spacing } from '@/theme/tokens';

// Fiche artiste (direction Hybride) : photo, Suivre (seul lime), à propos, concerts en billets.
// Barre native masquée : bouton retour en verre.
export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, refetch } = useArtist(id);

  let content: ReactNode;
  if (data === undefined) {
    content = error ? (
      <View style={styles.centered}>
        <ErrorState title="Impossible de charger cet artiste" onRetry={() => refetch()} />
      </View>
    ) : (
      <PhotoDetailSkeleton />
    );
  } else if (data === null) {
    content = (
      <View style={styles.centered}>
        <EmptyState title="Artiste introuvable" message="Cette fiche n’existe plus ou le lien n’est plus valide." />
      </View>
    );
  } else {
    content = <ArtistDetail artist={data.artist} events={data.events} />;
  }

  return (
    <View style={styles.container}>
      {content}
      <DetailTopBar />
    </View>
  );
}

function ArtistDetail({ artist, events }: ArtistWithEvents) {
  const router = useRouter();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const { data: wishIds } = useWishlistIds();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const countLabel =
    events.length > 0 ? `${events.length} concert${events.length > 1 ? 's' : ''} à venir` : 'Aucun concert annoncé';

  return (
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
      <PhotoHeader name={artist.name} imageUrl={artist.image_url} scrollY={scrollY}>
        <View style={styles.pills}>
          {artist.genre ? <GlassPill label={artist.genre.name} /> : null}
          <GlassPill label={countLabel} />
        </View>
        <Text style={styles.name} accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={maxFontScale.display}>
          {artist.name.toUpperCase()}
        </Text>
      </PhotoHeader>

      <View style={styles.body}>
        {/* Seule action principale (lime) de la fiche artiste. */}
        <FollowButton artist={artist} />
      </View>

      {artist.description ? (
        <View style={styles.section}>
          <SectionTitle title="À propos" />
          <Text style={styles.description}>{artist.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionTitle title="Concerts à venir" />
        {events.length > 0 ? (
          <View style={styles.tickets}>
            {events.map((event) => (
              <Ticket
                key={event.id}
                view={describeEvent(event)}
                isWished={wishIds?.includes(event.id) ?? false}
                onPress={() => router.push({ pathname: '/concert/[id]', params: { id: event.id } })}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Aucun concert annoncé pour le moment. Suis l’artiste pour le retrouver dans tes artistes.</Text>
        )}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: fontSizes.detailTitle,
    lineHeight: fontSizes.detailTitle * lineHeights.display,
    color: colors.text,
  },
  body: {
    padding: spacing.md,
  },
  section: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  description: {
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
  tickets: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  empty: {
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
});
