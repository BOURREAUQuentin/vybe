import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';

import { ArtistPhoto } from '@/components/ArtistPhoto';
import { PressableScale } from '@/components/PressableScale';
import { StatusChip } from '@/components/StatusChip';
import { WishBadge } from '@/components/WishBadge';
import type { EventView } from '@/features/events/eventView';
import { haptics } from '@/lib/haptics';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  motion,
  photoFade,
  radius,
  sizes,
  spacing,
} from '@/theme/tokens';

/** Pas du carrousel (largeur d'une carte + écart) : sert à l'aimantation et à l'effet de profondeur. */
export const CAROUSEL_SNAP = sizes.carouselCardWidth + spacing.sm;

type CarouselCardProps = {
  view: EventView;
  /** Position dans le carrousel. */
  index: number;
  /** Défilement horizontal du carrousel (Reanimated). */
  scrollX: SharedValue<number>;
  isWished: boolean;
  onPress: () => void;
};

// Carte photo du carrousel « À l'affiche » : la carte centrée est pleine taille, ses voisines
// sont légèrement réduites et atténuées (pas d'effet si « Réduire les animations »).
export function CarouselCard({ view, index, scrollX, isWished, onPress }: CarouselCardProps) {
  const reduceMotion = useReducedMotion();
  const depthStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const range = [(index - 1) * CAROUSEL_SNAP, index * CAROUSEL_SNAP, (index + 1) * CAROUSEL_SNAP];
    const x = scrollX.get();
    return {
      opacity: interpolate(x, range, [motion.carouselInactiveOpacity, 1, motion.carouselInactiveOpacity], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(x, range, [motion.carouselInactiveScale, 1, motion.carouselInactiveScale], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={depthStyle}>
      <PressableScale
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={[view.accessibilityLabel, isWished ? 'dans tes envies' : null].filter(Boolean).join(', ')}
        accessibilityHint="Ouvre la fiche du concert"
        style={styles.card}>
        <ArtistPhoto name={view.title} imageUrl={view.imageUrl} initialsSize={fontSizes.initials} />
        <View style={[StyleSheet.absoluteFill, styles.fade]} />
        <View style={styles.corners}>
          <StatusChip status={view.status} />
          <View style={styles.spacer} />
          {isWished ? <WishBadge /> : null}
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={maxFontScale.display}>
            {view.title.toUpperCase()}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {view.dateLabel}
          </Text>
          {view.cityName ? (
            <Text style={styles.meta} numberOfLines={1}>
              {view.cityName}
            </Text>
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: sizes.carouselCardWidth,
    height: sizes.carouselCardHeight,
    justifyContent: 'flex-end',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fade: {
    experimental_backgroundImage: photoFade,
  },
  corners: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  text: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.cardTitle,
    lineHeight: fontSizes.cardTitle * lineHeights.display,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
});
