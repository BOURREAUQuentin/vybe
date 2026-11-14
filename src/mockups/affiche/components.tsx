import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { getInitials } from '@/lib/format';
import type { EventView } from '@/mockups/shared/eventView';
import { Grain } from '@/mockups/shared/Grain';
import { haptics } from '@/mockups/shared/haptics';
import { Marquee } from '@/mockups/shared/Marquee';
import { derived, motion } from '@/mockups/shared/motion';
import { PressableScale } from '@/mockups/shared/PressableScale';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, opacity, spacing, statusBadges } from '@/theme/tokens';

import { affiche } from './tokens';

const PHOTO_FADE = `linear-gradient(to top, ${colors.background} 0%, ${derived.scrim} 45%, transparent 75%)`;

// ---------------------------------------------------------------------------
// Titre empilé façon affiche : un mot par ligne, chaque ligne ajustée à la largeur.
// ---------------------------------------------------------------------------
type PosterTitleProps = {
  text: string;
  size: number;
  color?: string;
  maxLines?: number;
};

export function PosterTitle({ text, size, color = colors.text, maxLines = 3 }: PosterTitleProps) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  // Au-delà de maxLines, les derniers mots partagent la dernière ligne.
  const lines =
    words.length > maxLines
      ? [...words.slice(0, maxLines - 1), words.slice(maxLines - 1).join(' ')]
      : words;

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={text}>
      {lines.map((line, index) => (
        <Text
          key={`${line}-${index}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={maxFontScale.display}
          style={{
            fontFamily: fonts.display,
            fontSize: size,
            lineHeight: size * lineHeights.display,
            color,
            marginTop: index === 0 ? 0 : -size * affiche.stackOverlap,
          }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Petites capitales espacées (métadonnées).
// ---------------------------------------------------------------------------
export function Caps({ children, muted = true }: { children: string; muted?: boolean }) {
  return (
    <Text style={[styles.caps, { color: muted ? colors.textSecondary : colors.text }]} numberOfLines={1}>
      {children.toUpperCase()}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Sticker de statut : étiquette rectangulaire inclinée, qui « se pose » à l'apparition.
// Seul « Billetterie ouverte » est lime.
// ---------------------------------------------------------------------------
type StickerProps = {
  status: EventView['status'];
  tilt?: string;
  label?: string;
};

export function Sticker({ status, tilt = affiche.stickerTilt, label }: StickerProps) {
  const badge = statusBadges[status];
  const isFilled = badge.background !== 'transparent';

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(motion.bounce.damping).stiffness(motion.bounce.stiffness)}
      style={[
        styles.sticker,
        {
          transform: [{ rotate: tilt }],
          backgroundColor: isFilled ? badge.background : colors.background,
          borderColor: status === 'announced' || status === 'sold_out' ? colors.text : badge.border,
        },
      ]}>
      <Text style={[styles.stickerText, { color: badge.text }]}>{(label ?? badge.label).toUpperCase()}</Text>
    </Animated.View>
  );
}

/** Sticker blanc « Dans tes envies » (cœur ajouté). */
export function WishSticker() {
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(motion.bounce.damping).stiffness(motion.bounce.stiffness)}
      style={[styles.sticker, styles.wishSticker, { transform: [{ rotate: affiche.stickerTiltAlt }] }]}>
      <Text style={[styles.stickerText, { color: colors.background }]}>♥ DANS TES ENVIES</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Bandeau défilant. « tape » : bande claire inclinée façon scotch, texte noir.
// ---------------------------------------------------------------------------
export function Band({ text, tape = false }: { text: string; tape?: boolean }) {
  return (
    <Marquee
      text={`${text.toUpperCase()}  ✦  `}
      speed={affiche.marqueeSpeed}
      style={[styles.band, tape && styles.tape]}
      textStyle={[styles.bandText, tape && styles.tapeText]}
    />
  );
}

// ---------------------------------------------------------------------------
// Photo d'artiste en fond, dégradé vers le noir, grain ; initiales géantes sans photo.
// ---------------------------------------------------------------------------
export function PosterBackground({ view, initialsSize }: { view: EventView; initialsSize: number }) {
  return (
    <>
      {view.imageUrl ? (
        <Image source={view.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={motion.fadeMs} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.initialsBox]}>
          <Text
            style={[styles.initials, { fontSize: initialsSize, lineHeight: initialsSize * lineHeights.display }]}
            maxFontSizeMultiplier={maxFontScale.display}>
            {getInitials(view.title)}
          </Text>
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, styles.fade]} />
      <Grain opacity={affiche.grainOpacity} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Ligne de programme (liste) : gros jour, jour et mois empilés, artiste, lieu, sticker.
// ---------------------------------------------------------------------------
export function ProgramRow({ view, onPress }: { view: EventView; onPress: () => void }) {
  const showSticker = view.status !== 'announced';

  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={view.accessibilityLabel}
      accessibilityHint="Ouvre la fiche du concert"
      style={[styles.row, view.isCancelled && styles.cancelled]}>
      <Text style={styles.rowDay} maxFontSizeMultiplier={maxFontScale.display}>
        {view.day}
      </Text>
      <View style={styles.rowWhen}>
        <Text style={styles.capsStrong}>{view.weekday}</Text>
        <Text style={styles.caps}>{view.month}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {view.title.toUpperCase()}
        </Text>
        {view.place ? <Caps>{view.place}</Caps> : null}
      </View>
      {showSticker ? (
        <View style={styles.rowSticker}>
          <Sticker status={view.status} />
        </View>
      ) : null}
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Affiche secondaire (carrousel) : format portrait, coins droits.
// ---------------------------------------------------------------------------
export function PosterCard({ view, onPress, style }: { view: EventView; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={view.accessibilityLabel}
      style={[styles.posterCard, style]}>
      <PosterBackground view={view} initialsSize={affiche.size.poster} />
      <View style={styles.posterText}>
        <PosterTitle text={view.title} size={affiche.size.big} maxLines={2} />
        <Caps muted={false}>{`${view.weekday} ${view.day} ${view.month} · ${view.cityName ?? ''}`}</Caps>
      </View>
      {view.status === 'sold_out' ? (
        <View style={styles.posterSticker}>
          <Sticker status="sold_out" tilt={affiche.stickerTiltAlt} />
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  caps: {
    fontFamily: fonts.semibold,
    fontSize: affiche.size.caps,
    letterSpacing: affiche.capsSpacing,
    color: colors.textSecondary,
  },
  capsStrong: {
    fontFamily: fonts.bold,
    fontSize: affiche.size.caps,
    letterSpacing: affiche.capsSpacing,
    color: colors.text,
  },
  sticker: {
    alignSelf: 'flex-start',
    borderWidth: affiche.stickerBorder,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  wishSticker: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  stickerText: {
    fontFamily: fonts.bold,
    fontSize: affiche.size.caps,
    letterSpacing: affiche.capsSpacing / 2,
  },
  band: {
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: derived.hairlineStrong,
  },
  bandText: {
    fontFamily: fonts.display,
    fontSize: affiche.size.marquee,
    lineHeight: affiche.size.marquee * lineHeights.display,
    color: colors.text,
  },
  tape: {
    backgroundColor: colors.text,
    borderColor: colors.text,
    marginHorizontal: affiche.tapeOverflow,
    transform: [{ rotate: affiche.tapeTilt }],
  },
  tapeText: {
    color: colors.background,
  },
  initialsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  initials: {
    fontFamily: fonts.display,
    color: colors.accent,
  },
  fade: {
    experimental_backgroundImage: PHOTO_FADE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: derived.hairlineStrong,
  },
  cancelled: {
    opacity: opacity.disabled,
  },
  rowDay: {
    fontFamily: fonts.display,
    fontSize: affiche.size.big,
    lineHeight: affiche.size.big * lineHeights.display,
    color: colors.text,
    minWidth: affiche.rowDayWidth,
  },
  rowWhen: {
    gap: spacing.xxs,
  },
  rowInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  rowSticker: {
    maxWidth: affiche.rowStickerMaxWidth,
  },
  posterCard: {
    width: affiche.posterWidth,
    height: affiche.posterHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  posterText: {
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  posterSticker: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
