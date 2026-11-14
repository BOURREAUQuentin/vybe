import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventPass } from '@/components/EventPass';
import { GlassIconButton } from '@/components/GlassIconButton';
import { GlassPill } from '@/components/GlassPill';
import { LineupAvatars } from '@/components/LineupAvatars';
import { ParallaxPhoto } from '@/components/ParallaxPhoto';
import { PhotoDetailSkeleton } from '@/components/PhotoDetailSkeleton';
import { PressableScale } from '@/components/PressableScale';
import { SectionTitle } from '@/components/SectionTitle';
import { SourceNote } from '@/components/SourceNote';
import { StatusChip } from '@/components/StatusChip';
import { WishChip } from '@/components/WishChip';
import { WishlistGlassButton } from '@/components/WishlistGlassButton';
import type { EventDetail } from '@/features/events/api';
import { describeEvent } from '@/features/events/eventView';
import { sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { formatDayAndTime } from '@/lib/dates';
import { formatPriceRange } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import {
  colors,
  fonts,
  fontSizes,
  glass,
  lineHeights,
  maxFontScale,
  motion,
  radius,
  sizes,
  spacing,
  touch,
} from '@/theme/tokens';

// Fiche concert (direction Hybride). La barre de navigation native est masquée : des boutons
// en verre fixes la remplacent (retour, cœur) ; le geste de retour reste disponible.
export default function ConcertScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, refetch } = useEvent(id);

  let content: ReactNode;
  if (data === undefined) {
    content = error ? (
      <View style={styles.centered}>
        <ErrorState title="Impossible de charger ce concert" onRetry={() => refetch()} />
      </View>
    ) : (
      <PhotoDetailSkeleton />
    );
  } else if (data === null) {
    content = (
      <View style={styles.centered}>
        <EmptyState
          title="Concert introuvable"
          message="Ce concert a peut-être été retiré ou le lien n’est plus valide."
        />
      </View>
    );
  } else {
    content = <ConcertDetail event={data} />;
  }

  return (
    <View style={styles.container}>
      {content}
      <TopBar eventId={data ? data.id : null} />
    </View>
  );
}

// Boutons en verre fixes en haut : retour à gauche, cœur à droite (une fois le concert chargé).
function TopBar({ eventId }: { eventId: string | null }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
      <GlassIconButton
        icon={{ ios: 'chevron.left', android: 'arrow_back' }}
        accessibilityLabel="Retour"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      {eventId ? <WishlistGlassButton eventId={eventId} /> : null}
    </View>
  );
}

function ConcertDetail({ event }: { event: EventDetail }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const reduceMotion = useReducedMotion();
  const { data: wishIds } = useWishlistIds();

  const view = describeEvent(event);
  const lineup = sortLineup(event.lineup);
  const venue = event.venue;
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const isWished = wishIds?.includes(event.id) ?? false;

  const isClosed = event.status === 'cancelled' || event.status === 'past';
  const ticketUrl = isClosed ? null : event.ticket_url;
  const onSaleSoon =
    event.status === 'announced' && event.on_sale_at !== null && new Date(event.on_sale_at) > new Date();

  // La photo se pose en arrivant (léger zoom arrière), sauf si « Réduire les animations ».
  const zoom = useSharedValue(reduceMotion ? 1 : motion.imageZoomFrom);
  useEffect(() => {
    zoom.set(withTiming(1, { duration: motion.imageZoomMs }));
  }, [zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.get() }] }));

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const openTickets = () => {
    if (!ticketUrl) return;
    haptics.tap();
    void WebBrowser.openBrowserAsync(ticketUrl, {
      toolbarColor: colors.background,
      controlsColor: colors.accent,
    });
  };

  const address = venue
    ? [venue.address, [venue.postal_code, venue.city.name].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : null;

  return (
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
      {/* En-tête : photo, pastilles (date, statut, envie), nom de l'affiche. */}
      <View style={styles.header}>
        <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
          <ParallaxPhoto
            name={view.title}
            imageUrl={view.imageUrl}
            height={sizes.detailHeader}
            scrollY={scrollY}
            initialsSize={fontSizes.initialsGiant}
          />
        </Animated.View>
        <View style={[styles.headerText, { paddingTop: insets.top + touch.minSize }]}>
          <View style={styles.chips}>
            <GlassPill label={`${view.weekday} ${view.day} ${view.month} · ${view.time}`} />
            <StatusChip status={event.status} />
            {isWished ? (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(motion.likeMs)}>
                <WishChip />
              </Animated.View>
            ) : null}
          </View>
          <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={maxFontScale.display}>
            {view.title.toUpperCase()}
          </Text>
          {view.others ? <Text style={styles.others}>avec {view.others}</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        {/* Action principale : seul élément lime de l'écran. */}
        {ticketUrl ? (
          <View style={styles.ticketBlock}>
            <PressableScale
              onPress={openTickets}
              accessibilityRole="button"
              accessibilityLabel="Billetterie"
              accessibilityHint="Ouvre la billetterie dans le navigateur"
              style={styles.ticketButton}>
              <Text style={styles.ticketLabel}>Billetterie</Text>
            </PressableScale>
            {onSaleSoon && event.on_sale_at ? (
              <Text style={styles.hint}>Ouverture de la billetterie le {formatDayAndTime(event.on_sale_at)}</Text>
            ) : null}
          </View>
        ) : null}
        {event.status === 'cancelled' ? (
          <Text style={styles.alert}>Ce concert est annulé : la billetterie est fermée.</Text>
        ) : null}
        {event.status === 'past' ? <Text style={styles.hint}>Ce concert a déjà eu lieu.</Text> : null}

        <EventPass
          eventId={event.id}
          venue={venue ? { name: venue.name, address } : null}
          cells={[
            { label: 'Date', value: `${view.weekday} ${view.day} ${view.month}` },
            { label: 'Heure', value: event.time_tba ? 'À confirmer' : view.time },
            { label: 'Ville', value: view.cityName ?? '' },
            { label: 'Prix indicatif', value: price ?? '' },
          ].filter((cell) => cell.value !== '')}
          onOpenVenue={() => venue && router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
        />
      </View>

      {lineup.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Line-up" />
          <LineupAvatars
            lineup={lineup}
            onOpenArtist={(artistId) => router.push({ pathname: '/artist/[id]', params: { id: artistId } })}
          />
        </View>
      ) : null}

      {event.description ? (
        <View style={styles.section}>
          <SectionTitle title="Infos pratiques" />
          <Text style={styles.description}>{event.description}</Text>
        </View>
      ) : null}

      <View style={styles.source}>
        <SourceNote source={event.source} />
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
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    height: sizes.detailHeader,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  headerText: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.detailTitle,
    lineHeight: fontSizes.detailTitle * lineHeights.display,
    color: colors.text,
  },
  others: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  body: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  ticketBlock: {
    gap: spacing.xs,
  },
  ticketButton: {
    minHeight: touch.minSize + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    boxShadow: `0 0 ${glass.glowRadius}px ${colors.accentGlow}`,
  },
  ticketLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.onAccent,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  alert: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.alert,
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
  source: {
    paddingHorizontal: spacing.md,
  },
});
