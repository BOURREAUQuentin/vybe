import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EventDetail } from '@/features/events/api';
import { sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { formatPriceRange, roleLabels, sourceLabels } from '@/lib/format';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived } from '@/mockups/shared/motion';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupConcertProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, lineHeights, maxFontScale, opacity, radius, spacing, touch } from '@/theme/tokens';

import {
  Avatar,
  Barcode,
  GlassIconButton,
  GlassPill,
  HorizontalPerforation,
  Label,
  ParallaxImage,
  quickFade,
  SectionTitle,
  StatusChip,
  WishChip,
} from './components';
import { hybride } from './tokens';

// HYBRIDE — fiche concert : photo et verre (Flow), infos dans un billet encadré (Pass + Affiche),
// salle et artistes cliquables, tampon « ♥ Envie » quand le concert est enregistré.
export function HybrideConcert({ eventId, nav }: MockupConcertProps) {
  const { data, error, refetch } = useEvent(eventId);
  if (!data) return <MockupState error={error} onRetry={() => void refetch()} />;
  return <Detail event={data} onBack={nav.goBack} />;
}

function Detail({ event, onBack }: { event: EventDetail; onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const reduceMotion = useReducedMotion();
  // Maquette : le cœur part de l'état réel du compte, mais ne modifie pas la vraie liste d'envies.
  const { data: wishIds } = useWishlistIds();
  const [localWish, setLocalWish] = useState<boolean | null>(null);
  const isWished = localWish ?? wishIds?.includes(event.id) ?? false;
  const scrollY = useSharedValue(0);
  const zoom = useSharedValue(reduceMotion ? 1 : hybride.imageZoomFrom);
  const heart = useSharedValue(1);

  const view = describeEvent(event);
  const venue = event.venue;
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const ticketUrl = view.isCancelled || event.status === 'past' ? null : event.ticket_url;

  // La photo se pose en un instant (zoom arrière court).
  useEffect(() => {
    zoom.set(withTiming(1, { duration: hybride.imageZoomMs }));
  }, [zoom]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.get() }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.get() }] }));

  const toggleWish = () => {
    if (!isWished) {
      haptics.success();
      if (!reduceMotion) {
        // Petit « pop » du cœur : 2 × 80 ms, sans ressort qui traîne.
        const step = { duration: hybride.likeMs / 2 };
        heart.set(withSequence(withTiming(hybride.heartBump, step), withTiming(1, step)));
      }
    } else {
      haptics.tap();
    }
    setLocalWish(!isWished);
  };

  const cells = [
    { label: 'Date', value: `${view.weekday} ${view.day} ${view.month}` },
    { label: 'Heure', value: view.time },
    { label: 'Ville', value: view.cityName },
    { label: 'Prix', value: price },
  ].filter((cell): cell is { label: string; value: string } => Boolean(cell.value));

  return (
    <View style={styles.container}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <View style={styles.header}>
          <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
            <ParallaxImage view={view} height={hybride.detailHeaderHeight} scrollY={scrollY} initialsSize={hybride.size.heroInitials} />
          </Animated.View>
          <View style={styles.headerText}>
            {/* Date, statut (s'il sort de la normale) et envie : des pastilles droites, comme dans les listes. */}
            <View style={styles.chips}>
              <GlassPill>{`${view.weekday} ${view.day} ${view.month} · ${view.time}`}</GlassPill>
              <StatusChip status={view.status} />
              {isWished ? (
                <Animated.View entering={FadeIn.duration(hybride.likeMs)}>
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

        <Animated.View entering={quickFade} style={styles.body}>
          {ticketUrl ? (
            <PressableScale
              onPress={() => {
                haptics.tap();
                void WebBrowser.openBrowserAsync(ticketUrl);
              }}
              accessibilityRole="button"
              accessibilityLabel="Billetterie"
              accessibilityHint="Ouvre la billetterie dans le navigateur"
              style={styles.ticketButton}>
              <Text style={styles.ticketText}>Billetterie</Text>
            </PressableScale>
          ) : null}

          {/* Le billet : infos encadrées, perforation, code-barres. */}
          <View style={styles.pass}>
            {/* La salle ouvre le billet, sur toute la largeur : c'est l'info qu'on cherche juste après la date. */}
            {venue ? (
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push({ pathname: '/venue/[id]', params: { id: venue.id } });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Salle : ${venue.name}, ${[venue.address, venue.city.name].filter(Boolean).join(', ')}`}
                accessibilityHint="Ouvre la fiche de la salle"
                style={({ pressed }) => [styles.venueCell, pressed && styles.pressedCell]}>
                <View style={styles.venueIcon}>
                  <SymbolView
                    name={{ ios: 'mappin.and.ellipse', android: 'location_on' }}
                    size={iconSizes.md}
                    tintColor={colors.text}
                  />
                </View>
                <View style={styles.venueText}>
                  <Label>Salle</Label>
                  <Text style={styles.cellValue} numberOfLines={1}>
                    {venue.name}
                  </Text>
                  <Text style={styles.venueAddress} numberOfLines={1}>
                    {[venue.address, venue.postal_code, venue.city.name].filter(Boolean).join(' ')}
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right' }}
                  size={iconSizes.sm}
                  tintColor={colors.textSecondary}
                />
              </Pressable>
            ) : null}
            <View style={styles.grid}>
              {cells.map((cell) => (
                <View key={cell.label} style={styles.cell}>
                  <Label>{cell.label}</Label>
                  <Text style={styles.cellValue} numberOfLines={1}>
                    {cell.value}
                  </Text>
                </View>
              ))}
            </View>
            <HorizontalPerforation />
            <View style={styles.passFooter}>
              <Barcode id={view.id} />
            </View>
          </View>

          <SectionTitle>Line-up</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineup}>
            {sortLineup(event.lineup).map((entry) =>
              entry.artist ? (
                <Pressable
                  key={entry.artist.id}
                  onPress={() => {
                    haptics.tap();
                    if (entry.artist) router.push({ pathname: '/artist/[id]', params: { id: entry.artist.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.artist.name}, ${roleLabels[entry.role]}`}
                  accessibilityHint="Ouvre la fiche de l’artiste"
                  style={({ pressed }) => [styles.artist, pressed && styles.pressed]}>
                  <Avatar name={entry.artist.name} imageUrl={entry.artist.image_url} size={hybride.avatar} />
                  <Text style={styles.artistName} numberOfLines={1}>
                    {entry.artist.name}
                  </Text>
                  <Text style={styles.artistRole} numberOfLines={1}>
                    {roleLabels[entry.role]}
                  </Text>
                </Pressable>
              ) : null,
            )}
          </ScrollView>

          {event.description ? (
            <>
              <SectionTitle>À propos</SectionTitle>
              <Text style={styles.description}>{event.description}</Text>
            </>
          ) : null}
          <Text style={styles.source}>{sourceLabels[event.source]}</Text>
        </Animated.View>
      </Animated.ScrollView>

      <View style={[styles.topBar, { top: insets.top + spacing.xs }]}>
        <GlassIconButton icon={{ ios: 'chevron.left', android: 'arrow_back' }} label="Retour" onPress={onBack} />
        <Animated.View style={heartStyle}>
          <GlassIconButton
            icon={isWished ? { ios: 'heart.fill', android: 'heart_check' } : { ios: 'heart', android: 'favorite' }}
            label={isWished ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
            onPress={toggleWish}
            active={isWished}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: hybride.detailHeaderHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: hybride.size.detailTitle,
    lineHeight: hybride.size.detailTitle * lineHeights.display,
    color: colors.text,
  },
  others: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  body: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  ticketButton: {
    minHeight: touch.minSize + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    boxShadow: `0 0 ${hybride.glowRadius}px ${derived.accentGlow}`,
  },
  ticketText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.onAccent,
  },
  pass: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    gap: spacing.xxs,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: derived.hairlineStrong,
  },
  cellValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  venueCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: derived.hairlineStrong,
  },
  pressedCell: {
    backgroundColor: colors.surfaceRaised,
  },
  venueIcon: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  venueText: {
    flex: 1,
    gap: spacing.xxs,
  },
  venueAddress: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  passFooter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  lineup: {
    gap: spacing.md,
  },
  artist: {
    width: hybride.avatar + spacing.lg,
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
  },
  artistRole: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  description: {
    marginTop: -spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
  source: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
