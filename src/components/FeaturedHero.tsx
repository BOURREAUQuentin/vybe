import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { GlassPill } from '@/components/GlassPill';
import { ParallaxPhoto } from '@/components/ParallaxPhoto';
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
  radius,
  sizes,
  spacing,
  touch,
} from '@/theme/tokens';

type FeaturedHeroProps = {
  view: EventView;
  /** Petit titre en verre au-dessus du nom (ex. « Rap à l'affiche »). */
  kicker: string;
  scrollY: SharedValue<number>;
  /** Marge du haut (zone sûre) : statut et cœur restent sous l'encoche. */
  topInset: number;
  isWished: boolean;
  onPress: () => void;
};

// Grand visuel en haut de Découvrir : photo en parallaxe, nom en Anton, date et lieu.
// Statut (hors normale) et cœur dans le coin haut gauche ; le coin haut droit est laissé au bouton Infos.
export function FeaturedHero({ view, kicker, scrollY, topInset, isWished, onPress }: FeaturedHeroProps) {
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      pressedScale={1}
      accessibilityRole="button"
      accessibilityLabel={[kicker, view.accessibilityLabel, isWished ? 'dans tes envies' : null]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Ouvre la fiche du concert"
      style={styles.hero}>
      <ParallaxPhoto
        name={view.title}
        imageUrl={view.imageUrl}
        height={sizes.heroVisual}
        scrollY={scrollY}
        initialsSize={fontSizes.initialsGiant}
      />

      <View style={[styles.corner, { top: topInset + spacing.sm }]}>
        <StatusChip status={view.status} />
        {isWished ? <WishBadge /> : null}
      </View>

      <View style={styles.text}>
        <GlassPill label={kicker} />
        <Text
          style={styles.title}
          numberOfLines={2}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={maxFontScale.display}>
          {view.title.toUpperCase()}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[view.dateLabel, view.place].filter(Boolean).join('  ·  ')}
        </Text>
        <View style={styles.button}>
          <Text style={styles.buttonLabel}>Voir le concert</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: sizes.heroVisual,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  corner: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.heroTitle,
    lineHeight: fontSizes.heroTitle * lineHeights.display,
    color: colors.text,
  },
  meta: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.background,
  },
});
