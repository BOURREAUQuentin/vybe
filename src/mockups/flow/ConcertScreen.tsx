import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EventDetail } from '@/features/events/api';
import { sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { formatEventDateLong } from '@/lib/dates';
import { formatPriceRange, getInitials, roleLabels, sourceLabels } from '@/lib/format';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived, motion } from '@/mockups/shared/motion';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupConcertProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, lineHeights, maxFontScale, radius, spacing, touch } from '@/theme/tokens';

import { GlassIconButton, GlassPill, ParallaxImage, SectionTitle } from './components';
import { flow } from './tokens';

// FLOW — fiche concert : grande photo qui s'étire, boutons en verre, Billetterie lime avec halo.
export function FlowConcert({ eventId, nav }: MockupConcertProps) {
  const { data, error, refetch } = useEvent(eventId);
  if (!data) return <MockupState error={error} onRetry={() => void refetch()} />;
  return <Detail event={data} onBack={nav.goBack} />;
}

function Detail({ event, onBack }: { event: EventDetail; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const reduceMotion = useReducedMotion();
  const [isWished, setIsWished] = useState(false);
  const scrollY = useSharedValue(0);
  const zoom = useSharedValue(reduceMotion ? 1 : flow.imageZoomFrom);
  const heart = useSharedValue(1);

  const view = describeEvent(event);
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const ticketUrl = view.isCancelled || event.status === 'past' ? null : event.ticket_url;

  // La photo « se pose » : léger zoom arrière à l'ouverture de la fiche.
  useEffect(() => {
    zoom.set(withTiming(1, { duration: flow.imageZoomMs }));
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
        heart.set(withSequence(withSpring(flow.heartBump, motion.bounce), withSpring(1, motion.spring)));
      }
    } else {
      haptics.tap();
    }
    setIsWished(!isWished);
  };

  const facts: { icon: ComponentProps<typeof SymbolView>['name']; text: string }[] = [
    { icon: { ios: 'calendar', android: 'calendar_today' }, text: formatEventDateLong(event.starts_at, event.time_tba) },
    ...(view.place ? [{ icon: { ios: 'mappin.and.ellipse', android: 'location_on' } as const, text: view.place }] : []),
    ...(price ? [{ icon: { ios: 'ticket', android: 'confirmation_number' } as const, text: price }] : []),
  ];

  return (
    <View style={styles.container}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <View style={styles.header}>
          <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
            <ParallaxImage view={view} height={flow.detailHeaderHeight} scrollY={scrollY} initialsSize={flow.size.heroInitials} />
          </Animated.View>
          <View style={styles.headerText}>
            <View style={styles.pills}>
              <GlassPill>{`${view.weekday} ${view.day} ${view.month} · ${view.time}`}</GlassPill>
              <GlassPill>{view.statusLabel}</GlassPill>
            </View>
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={maxFontScale.display}>
              {view.title.toUpperCase()}
            </Text>
            {view.others ? <Text style={styles.others}>avec {view.others}</Text> : null}
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(motion.fadeMs * 1.5)} style={styles.body}>
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

          <View style={styles.facts}>
            {facts.map((fact) => (
              <View key={fact.text} style={styles.fact}>
                <SymbolView name={fact.icon} size={iconSizes.md} tintColor={colors.textSecondary} />
                <Text style={styles.factText}>{fact.text}</Text>
              </View>
            ))}
          </View>

          <SectionTitle>Line-up</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineup}>
            {sortLineup(event.lineup).map((entry) =>
              entry.artist ? (
                <View key={entry.artist.id} style={styles.artist}>
                  <View style={styles.avatar}>
                    {entry.artist.image_url ? (
                      <Image source={entry.artist.image_url} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Text style={styles.avatarText}>{getInitials(entry.artist.name)}</Text>
                    )}
                  </View>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {entry.artist.name}
                  </Text>
                  <Text style={styles.artistRole} numberOfLines={1}>
                    {roleLabels[entry.role]}
                  </Text>
                </View>
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
    height: flow.detailHeaderHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  headerText: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: flow.size.detailTitle,
    lineHeight: flow.size.detailTitle * lineHeights.display,
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
    boxShadow: `0 0 ${flow.glowRadius}px ${derived.accentGlow}`,
  },
  ticketText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.onAccent,
  },
  facts: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minSize,
  },
  factText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  lineup: {
    gap: spacing.md,
  },
  artist: {
    width: flow.lineupAvatar + spacing.lg,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  avatar: {
    width: flow.lineupAvatar,
    height: flow.lineupAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
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
