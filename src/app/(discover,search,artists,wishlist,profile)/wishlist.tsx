import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/lib/useTabBarSpace';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { IconButton } from '@/components/IconButton';
import { MonthHeader } from '@/components/MonthHeader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { UndoRow } from '@/components/UndoRow';
import { useAuth } from '@/features/auth/AuthContext';
import { groupEventsByMonth, type MonthSection } from '@/features/discover/sections';
import type { EventListItem } from '@/features/events/api';
import { getLineupLabels } from '@/features/events/lineup';
import { useToggleWishlist, useWishlist, useWishlistIds } from '@/features/wishlist/useWishlist';
import { colors, fonts, fontSizes, opacity, spacing } from '@/theme/tokens';

/** Délai pendant lequel « Annuler » reste proposé après un retrait. */
const UNDO_DELAY_MS = 4000;

type WishlistSection = MonthSection & { past?: boolean };

// Onglet « Envies » (V1.3) : concerts enregistrés, à venir puis déjà passés.
export default function WishlistScreen() {
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
        title="Garde tes concerts en tête"
        message="Connecte-toi pour enregistrer les concerts qui te font envie et les retrouver ici."
      />
    );
  } else {
    body = <WishlistContent />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes envies" />
      {body}
    </SafeAreaView>
  );
}

// Retrait avec annulation : ♥ → la carte devient une ligne « … retiré · Annuler »,
// qui disparaît d'elle-même après quelques secondes. Un concert retiré depuis sa fiche
// disparaît directement (le choix a déjà été fait sur la fiche).
function WishlistContent() {
  const router = useRouter();
  const { data, error, isRefetching, refetch } = useWishlist();
  const { data: savedIds } = useWishlistIds();
  const toggle = useToggleWishlist();
  const saved = useMemo(() => new Set(savedIds ?? []), [savedIds]);
  const bottomSpace = useTabBarSpace();

  // Concerts retirés depuis cet onglet, encore affichés avec « Annuler ».
  const [pending, setPending] = useState<Set<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  const stopPending = (eventId: string) => {
    clearTimeout(timers.current.get(eventId));
    timers.current.delete(eventId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPending((current) => {
      const next = new Set(current);
      next.delete(eventId);
      return next;
    });
  };

  const remove = (eventId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPending((current) => new Set(current).add(eventId));
    timers.current.set(
      eventId,
      setTimeout(() => stopPending(eventId), UNDO_DELAY_MS),
    );
    toggle.mutate(
      { eventId, add: false },
      {
        onError: () => {
          stopPending(eventId); // le cœur revient : la carte réapparaît telle quelle
          Alert.alert('Envie non retirée', 'Vérifie ta connexion internet et réessaie.');
        },
      },
    );
  };

  const undo = (eventId: string) => {
    stopPending(eventId);
    toggle.mutate(
      { eventId, add: true },
      {
        onError: () =>
          Alert.alert('Envie non remise', 'Vérifie ta connexion internet et réessaie.'),
      },
    );
  };

  // Concerts affichés : enregistrés, ou retirés depuis cet onglet il y a moins de 4 s.
  const isVisible = (event: EventListItem) => saved.has(event.id) || pending.has(event.id);

  const sections = useMemo(() => {
    if (!data) return [] as WishlistSection[];
    const visible = (event: EventListItem) => saved.has(event.id) || pending.has(event.id);
    const result: WishlistSection[] = groupEventsByMonth(data.upcoming.filter(visible));
    const past = data.past.filter(visible);
    if (past.length > 0) result.push({ key: 'past', title: 'Déjà passés', data: past, past: true });
    return result;
  }, [data, saved, pending]);

  const upcomingCount = data?.upcoming.filter((event) => saved.has(event.id)).length ?? 0;

  if (data === undefined) {
    return error ? (
      <ErrorState title="Impossible de charger tes envies" onRetry={() => refetch()} />
    ) : (
      <View style={styles.skeletons} accessibilityLabel="Chargement de tes envies">
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="Aucune envie pour l’instant"
        message="Touche le ♡ sur la fiche d’un concert pour le retrouver ici."
        action={{ label: 'Découvrir des concerts', onPress: () => router.navigate('/') }}
      />
    );
  }

  return (
    <SectionList<EventListItem, WishlistSection>
      sections={sections}
      keyExtractor={(event) => event.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
      ItemSeparatorComponent={Separator}
      renderItem={({ item, section }) =>
        isVisible(item) && !saved.has(item.id) ? (
          <View style={styles.undoRow}>
            <UndoRow
              message={`${getLineupLabels(item.name, item.lineup).title} retiré de tes envies`}
              onUndo={() => undo(item.id)}
            />
          </View>
        ) : (
          <View style={styles.item}>
            <View style={[styles.card, section.past && styles.dimmed]}>
              <EventCard
                event={item}
                onPress={() =>
                  router.push({ pathname: '/concert/[id]', params: { id: item.id } })
                }
              />
            </View>
            {/* Même cœur que sur la fiche concert : on retire comme on a ajouté. */}
            <IconButton
              icon={{ ios: 'heart.fill', android: 'heart_check' }}
              accessibilityLabel={`Retirer ${getLineupLabels(item.name, item.lineup).title} de mes envies`}
              onPress={() => remove(item.id)}
            />
          </View>
        )
      }
      ListHeaderComponent={
        <Text style={styles.count}>
          {upcomingCount > 0
            ? `${upcomingCount} concert${upcomingCount > 1 ? 's' : ''} à venir`
            : 'Aucun concert à venir dans tes envies'}
        </Text>
      }
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomSpace }]}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletons: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  count: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  card: {
    flex: 1,
  },
  dimmed: {
    opacity: opacity.disabled,
  },
  undoRow: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.xs,
  },
});
