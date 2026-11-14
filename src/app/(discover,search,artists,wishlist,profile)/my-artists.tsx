import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MonthHeader } from '@/components/MonthHeader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Ticket } from '@/components/Ticket';
import { TicketSkeleton } from '@/components/TicketSkeleton';
import { useAuth } from '@/features/auth/AuthContext';
import { groupEventsByMonth } from '@/features/discover/sections';
import { describeEvent } from '@/features/events/eventView';
import type { FollowedArtist } from '@/features/follows/api';
import { useFollowedArtists, useFollowedArtistsEvents } from '@/features/follows/useFollows';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { haptics } from '@/lib/haptics';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  radius,
  sizes,
  spacing,
  touch,
} from '@/theme/tokens';

// Onglet « Artistes » (V1.3) : artistes suivis et leurs prochains concerts.
export default function MyArtistsScreen() {
  const { userId, isRestoring } = useAuth();

  let body;
  if (isRestoring) {
    body = (
      <View style={styles.center} accessibilityLabel="Chargement">
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    );
  } else if (!userId) {
    body = (
      <SignInPrompt
        icon={{ ios: 'person.2', android: 'group' }}
        title="Suis tes artistes"
        message="Connecte-toi pour suivre tes artistes et retrouver tous leurs concerts au même endroit."
      />
    );
  } else {
    body = <FollowedArtistsContent />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes artistes" />
      {body}
    </SafeAreaView>
  );
}

function FollowedArtistsContent() {
  const router = useRouter();
  const followed = useFollowedArtists();
  const artistIds = useMemo(() => followed.data?.map((row) => row.artist_id) ?? [], [followed.data]);
  const events = useFollowedArtistsEvents(artistIds);
  const sections = useMemo(() => (events.data ? groupEventsByMonth(events.data) : []), [events.data]);
  const bottomSpace = useTabBarSpace();
  const { data: wishIds } = useWishlistIds();

  const openOnboarding = () => router.push('/onboarding');

  // Artistes suivis : chargement / erreur / aucun.
  if (followed.data === undefined) {
    return followed.error ? (
      <ErrorState title="Impossible de charger tes artistes" onRetry={() => followed.refetch()} />
    ) : (
      <View style={styles.skeletons} accessibilityLabel="Chargement de tes artistes">
        <TicketSkeleton />
        <TicketSkeleton />
      </View>
    );
  }

  if (followed.data.length === 0) {
    return (
      <EmptyState
        title="Tu ne suis encore aucun artiste"
        message="Suis tes artistes préférés pour retrouver leurs prochains concerts ici."
        action={{ label: 'Choisir des artistes', onPress: openOnboarding }}
      />
    );
  }

  const isRefreshing = followed.isRefetching || events.isRefetching;

  const header = (
    <View style={styles.header}>
      <FlatList
        horizontal
        data={followed.data}
        keyExtractor={(row) => row.artist_id}
        renderItem={({ item }) => <FollowedArtistItem row={item} />}
        ListFooterComponent={<AddArtistItem onPress={openOnboarding} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.artistsRow}
      />
      <SectionTitle
        title={
          events.data && events.data.length > 0
            ? `Leurs prochains concerts · ${events.data.length}`
            : 'Leurs prochains concerts'
        }
      />
    </View>
  );

  let emptyConcerts;
  if (events.data === undefined) {
    emptyConcerts = events.error ? (
      <ErrorState title="Impossible de charger leurs concerts" onRetry={() => events.refetch()} />
    ) : (
      <View style={styles.skeletons}>
        <TicketSkeleton />
        <TicketSkeleton />
      </View>
    );
  } else {
    emptyConcerts = (
      <Text style={styles.emptyText}>Aucun concert annoncé pour tes artistes pour le moment.</Text>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(event) => event.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
      renderItem={({ item }) => (
        <View style={styles.cardRow}>
          <Ticket
            view={describeEvent(item)}
            isWished={wishIds?.includes(item.id) ?? false}
            onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
          />
        </View>
      )}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header}
      ListEmptyComponent={<View style={styles.emptyConcerts}>{emptyConcerts}</View>}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomSpace }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void followed.refetch();
            void events.refetch();
          }}
          tintColor={colors.text}
        />
      }
    />
  );
}

// Vignette d'un artiste suivi (toucher = fiche artiste).
function FollowedArtistItem({ row }: { row: FollowedArtist }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        router.push({ pathname: '/artist/[id]', params: { id: row.artist.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={row.artist.name}
      accessibilityHint="Ouvre la fiche de l’artiste"
      style={({ pressed }) => [styles.artistItem, pressed && styles.pressed]}>
      <ArtistAvatar name={row.artist.name} imageUrl={row.artist.image_url} size="xl" />
      <Text style={styles.artistName} numberOfLines={1}>
        {row.artist.name}
      </Text>
    </Pressable>
  );
}

// « Ajouter » en fin de rangée : ouvre l'onboarding.
function AddArtistItem({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ajouter des artistes"
      style={({ pressed }) => [styles.artistItem, pressed && styles.pressed]}>
      <View style={styles.addCircle}>
        <SymbolView
          name={{ ios: 'plus', android: 'add' }}
          size={iconSizes.md}
          tintColor={colors.text}
        />
      </View>
      <Text style={styles.artistName}>Ajouter</Text>
    </Pressable>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletons: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  artistsRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  artistItem: {
    width: sizes.avatarXL + spacing.sm,
    minHeight: touch.minSize,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  artistName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
  addCircle: {
    width: sizes.avatarXL,
    height: sizes.avatarXL,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  cardRow: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  emptyConcerts: {
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
