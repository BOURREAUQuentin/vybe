import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { getInitials } from '@/lib/format';
import { barcodeFromId, type EventView } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived, motion } from '@/mockups/shared/motion';
import { PressableScale } from '@/mockups/shared/PressableScale';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  lineHeights,
  maxFontScale,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

import { hybride } from './tokens';

export type IconName = ComponentProps<typeof SymbolView>['name'];

export const PHOTO_FADE = `linear-gradient(to top, ${colors.background} 0%, ${derived.scrim} 40%, transparent 70%)`;

// Statuts « hors normale » : les seuls signalés dans les listes et sur les photos.
// « Billetterie ouverte » est l'état attendu d'un concert à venir : il n'est dit que sur la fiche,
// par le bouton Billetterie (le lime reste réservé à cette action).
const SHORT_LABELS: Partial<Record<EventView['status'], string>> = {
  sold_out: 'Complet',
  postponed: 'Reporté',
  cancelled: 'Annulé',
  past: 'Passé',
};

/** Vrai si le statut doit être signalé (complet, reporté, annulé, passé). */
export const hasStamp = (status: EventView['status']) => status in SHORT_LABELS;

// ===========================================================================
// Verre dépoli (Flow) : vrai flou sur iOS, surface translucide sur Android.
// ===========================================================================
export function Glass({
  style,
  dim = false,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  /** Voile sombre en plus du flou : reste lisible sur une photo claire. */
  dim?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.glass, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={hybride.blurIntensity} tint="systemUltraThinMaterialDark" style={StyleSheet.absoluteFill} />
      ) : null}
      {dim ? <View style={[StyleSheet.absoluteFill, styles.dim]} /> : null}
      {children}
    </View>
  );
}

export function GlassPill({ children }: { children: string }) {
  return (
    <Glass dim style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>
        {children}
      </Text>
    </Glass>
  );
}

/** Bouton rond en verre. `active` : fond blanc plein et icône noire (ex. concert dans les envies). */
export function GlassIconButton({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.round}>
      {active ? (
        <View style={[styles.iconButton, styles.iconButtonActive]}>
          <SymbolView name={icon} size={iconSizes.md} tintColor={colors.background} />
        </View>
      ) : (
        <Glass dim style={styles.iconButton}>
          <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
        </Glass>
      )}
    </PressableScale>
  );
}

export function GlassHeader({ title, scrollY, top }: { title: string; scrollY: SharedValue<number>; top: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [hybride.headerFadeStart, hybride.headerFadeStart + hybride.headerFadeLength],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.header, style]}>
      <Glass style={[styles.headerGlass, { paddingTop: top }]}>
        <Text style={styles.headerTitle}>{title}</Text>
      </Glass>
    </Animated.View>
  );
}

// ===========================================================================
// Photos
// ===========================================================================
export function ArtistImage({ view, initialsSize }: { view: Pick<EventView, 'imageUrl' | 'title'>; initialsSize: number }) {
  return view.imageUrl ? (
    <Image source={view.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={motion.fadeMs} />
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.initialsBox]}>
      <Text
        style={[styles.initials, { fontSize: initialsSize, lineHeight: initialsSize * lineHeights.display }]}
        maxFontSizeMultiplier={maxFontScale.display}>
        {getInitials(view.title)}
      </Text>
    </View>
  );
}

/** Photo en parallaxe qui s'agrandit quand on tire vers le bas. */
export function ParallaxImage({
  view,
  height,
  scrollY,
  initialsSize,
}: {
  view: Pick<EventView, 'imageUrl' | 'title'>;
  height: number;
  scrollY: SharedValue<number>;
  initialsSize: number;
}) {
  const style = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y < 0 ? 0 : y * hybride.parallax },
        { scale: interpolate(y, [-height, 0], [hybride.stretchMax, 1], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <ArtistImage view={view} initialsSize={initialsSize} />
      <View style={[StyleSheet.absoluteFill, styles.fade]} />
    </Animated.View>
  );
}

/** Avatar rond d'artiste (photo ou initiales). */
export function Avatar({ name, imageUrl, size }: { name: string; imageUrl: string | null; size: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      {imageUrl ? (
        <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

// ===========================================================================
// Billet (Pass)
// ===========================================================================
export function Label({ children, color }: { children: string; color?: string }) {
  return <Text style={[styles.label, color ? { color } : null]}>{children.toUpperCase()}</Text>;
}

// ---------------------------------------------------------------------------
// Statuts — version G (validée) :
// - Complet : talon corail plein jusqu'aux pointillés, pastille corail pleine ;
// - Reporté : talon à contour corail qui épouse les encoches, pastille à contour corail ;
// - Passé : talon gris clair, billet atténué, pastille grise ;
// - Annulé : billet assombri, pastille corail barrée ;
// - normal (annoncé, billetterie ouverte) : rien de particulier.
// ---------------------------------------------------------------------------
type StubLook = { fill?: string; outline?: string; text: string; secondary: string };

const STUB_LOOKS: Partial<Record<EventView['status'], StubLook>> = {
  sold_out: { fill: colors.alert, text: colors.background, secondary: colors.background },
  postponed: { outline: colors.alert, text: colors.alert, secondary: colors.alert },
  past: { fill: derived.stubMuted, text: colors.text, secondary: colors.text },
};

type ChipLook = { fill: string; border: string; text: string; strike?: boolean };

const CHIP_LOOKS: Partial<Record<EventView['status'], ChipLook>> = {
  sold_out: { fill: colors.alert, border: colors.alert, text: colors.background },
  postponed: { fill: colors.background, border: colors.alert, text: colors.alert },
  past: { fill: colors.border, border: colors.border, text: colors.textSecondary },
  cancelled: { fill: colors.background, border: colors.alert, text: colors.alert, strike: true },
};

/**
 * Pastille de statut droite et compacte (listes, cartes) : même hauteur que « ♥ Envie »,
 * ne déborde jamais. Corail pour reporté et annulé.
 */
export function StatusChip({ status }: { status: EventView['status'] }) {
  const label = SHORT_LABELS[status];
  const look = CHIP_LOOKS[status];
  if (!label || !look) return null;
  return (
    <View style={[styles.statusChip, { backgroundColor: look.fill, borderColor: look.border }]}>
      <Text style={[styles.statusChipText, { color: look.text }, look.strike && styles.struck]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

/** Pastille « ♥ Envie » (listes). */
export function WishChip() {
  return (
    <View style={styles.wishChip}>
      <Text style={styles.wishChipText}>♥ Envie</Text>
    </View>
  );
}

/** Rond blanc avec un cœur, posé dans le coin d'une photo (carrousel, grand visuel). */
export function WishBadge() {
  return (
    <View style={styles.wishBadge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SymbolView name={{ ios: 'heart.fill', android: 'heart_check' }} size={iconSizes.sm} tintColor={colors.background} />
    </View>
  );
}

export function VerticalPerforation({
  notchColor = colors.background,
  outline,
}: {
  notchColor?: string;
  /** Talon à contour (Reporté) : le contour contourne les encoches ; les pointillés le « trouent » comme sur Complet. */
  outline?: string;
}) {
  // Moitié gauche de l'encoche, cerclée : l'arc du contour côté talon uniquement.
  const arc = (position: 'top' | 'bottom') =>
    outline ? (
      <View style={[styles.arcClip, position === 'top' ? styles.arcClipTop : styles.arcClipBottom]}>
        <View
          style={[
            styles.notch,
            styles.arcCircle,
            position === 'top' ? styles.arcCircleTop : null,
            { borderColor: outline, backgroundColor: notchColor },
          ]}
        />
      </View>
    ) : null;

  return (
    <View style={styles.vPerf}>
      <View style={[styles.notch, styles.notchTop, { backgroundColor: notchColor }]} />
      <View style={styles.vDots}>
        {Array.from({ length: hybride.dots }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchBottom, { backgroundColor: notchColor }]} />
      {arc('top')}
      {arc('bottom')}
    </View>
  );
}

export function HorizontalPerforation() {
  return (
    <View style={styles.hPerf}>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={styles.hDots}>
        {Array.from({ length: hybride.dotsHorizontal }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchRight]} />
    </View>
  );
}

export function Barcode({ id }: { id: string }) {
  const widths = barcodeFromId(id, hybride.barcodeBars);
  return (
    <View style={styles.barcodeRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.barcode}>
        {widths.map((width, index) => (
          <View
            key={index}
            style={{
              width: width * hybride.barcodeUnit,
              height: hybride.barcodeHeight,
              marginRight: hybride.barcodeUnit * ((index % 3) + 1),
              backgroundColor: index % 5 === 4 ? derived.transparent : colors.textSecondary,
            }}
          />
        ))}
      </View>
      <Text style={styles.ticketNumber}>N° {id.slice(0, 8).toUpperCase()}</Text>
    </View>
  );
}

/**
 * Ticket (toutes les listes de concerts) : talon date | perforation | artiste, invités, lieu, heure, tampon.
 * `note` : ligne mise en avant (ex. l'artiste cherché quand il joue en première partie).
 */
export function Ticket({
  view,
  note,
  isWished = false,
  onPress,
}: {
  view: EventView;
  note?: string | null;
  /** Concert dans les envies : petit cœur blanc à côté de l'heure. */
  isWished?: boolean;
  onPress: () => void;
}) {
  const look = STUB_LOOKS[view.status];
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={[note, view.accessibilityLabel, isWished ? 'dans tes envies' : null].filter(Boolean).join(', ')}
      accessibilityHint="Ouvre la fiche du concert"
      style={[styles.ticket, view.isCancelled && styles.cancelled, view.status === 'past' && styles.past]}>
      {/* Fond du talon : va jusqu'à la ligne de perforation, les encoches le découpent. */}
      {look ? (
        <View
          style={[
            styles.stubLayer,
            look.fill ? { backgroundColor: look.fill } : null,
            look.outline ? [{ borderColor: look.outline, borderWidth: hybride.outlineWidth }, styles.stubLayerOutline] : null,
          ]}
        />
      ) : null}
      <View style={styles.stub}>
        <Label color={look?.secondary}>{view.weekday}</Label>
        <Text style={[styles.stubDay, look ? { color: look.text } : null]} maxFontSizeMultiplier={maxFontScale.display}>
          {view.day}
        </Text>
        <Label color={look?.secondary}>{view.month}</Label>
      </View>
      <VerticalPerforation outline={look?.outline} />
      <View style={styles.ticketBody}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {view.title}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : view.others ? (
          <Text style={styles.meta} numberOfLines={1}>
            avec {view.others}
          </Text>
        ) : null}
        {view.place ? (
          <Text style={styles.meta} numberOfLines={1}>
            {view.place}
          </Text>
        ) : null}
        <View style={styles.ticketFooter}>
          <Text style={styles.time}>{view.time}</Text>
          {isWished ? <WishChip /> : null}
          <StatusChip status={view.status} />
        </View>
      </View>
    </PressableScale>
  );
}

// ===========================================================================
// Lignes et titres
// ===========================================================================
export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Ligne cliquable : icône à gauche, titre, sous-titre, chevron ›. */
export function LinkRow({
  icon,
  avatar,
  title,
  subtitle,
  onPress,
}: {
  icon?: IconName;
  avatar?: ReactNode;
  title: string;
  subtitle?: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
      {avatar ?? (
        <View style={styles.linkIcon}>
          {icon ? <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} /> : null}
        </View>
      )}
      <View style={styles.linkText}>
        <Text style={styles.linkTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={iconSizes.sm} tintColor={colors.textSecondary} />
    </Pressable>
  );
}

/** Apparition douce et courte d'un bloc (résultats, contenu de fiche). */
export const quickFade = FadeIn.duration(hybride.enterMs);

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? derived.transparent : derived.glass,
    borderColor: derived.hairline,
    borderWidth: hybride.glassBorder,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
  dim: {
    backgroundColor: derived.scrim,
  },
  round: {
    borderRadius: radius.pill,
  },
  iconButtonActive: {
    backgroundColor: colors.text,
  },
  tilted: {
    transform: [{ rotate: hybride.stampTilt }],
  },
  wishChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  statusChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.background, // plaque opaque : lisible aussi sur photo
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  past: {
    opacity: hybride.pastOpacity,
  },
  stubLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: hybride.stubWidth + hybride.notch / 2,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  // Contour : le trait droit est centré sur la ligne de pointillés, qui le « trouent ».
  stubLayerOutline: {
    width: hybride.stubWidth + hybride.notch / 2 + hybride.outlineWidth / 2,
  },
  arcClip: {
    position: 'absolute',
    left: 0,
    width: hybride.notch / 2,
    height: hybride.notch / 2,
    overflow: 'hidden',
  },
  arcClipTop: {
    top: 0,
  },
  arcClipBottom: {
    bottom: 0,
  },
  arcCircle: {
    borderWidth: hybride.outlineWidth,
  },
  arcCircleTop: {
    marginTop: -hybride.notch / 2,
  },
  statusChipText: {
    fontFamily: fonts.bold,
    fontSize: hybride.size.stamp,
    color: colors.text,
  },
  wishBadge: {
    width: hybride.wishBadge,
    height: hybride.wishBadge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  wishChipText: {
    fontFamily: fonts.bold,
    fontSize: hybride.size.stamp,
    color: colors.background,
  },
  iconButton: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerGlass: {
    borderWidth: 0,
    borderBottomWidth: hybride.glassBorder,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
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
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: hybride.size.label,
    letterSpacing: hybride.labelSpacing,
    color: colors.textSecondary,
  },
  vPerf: {
    width: hybride.notch,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vDots: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  hPerf: {
    height: hybride.notch,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  dot: {
    width: hybride.dot,
    height: hybride.dot,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  notch: {
    width: hybride.notch,
    height: hybride.notch,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  notchTop: {
    marginTop: -hybride.notch / 2,
  },
  notchBottom: {
    marginBottom: -hybride.notch / 2,
  },
  notchLeft: {
    marginLeft: -hybride.notch / 2,
  },
  notchRight: {
    marginRight: -hybride.notch / 2,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  barcode: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ticketNumber: {
    fontFamily: fonts.medium,
    fontSize: hybride.size.label,
    letterSpacing: hybride.labelSpacing,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  ticket: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cancelled: {
    opacity: opacity.disabled,
  },
  stub: {
    width: hybride.stubWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  stubDay: {
    fontFamily: fonts.display,
    fontSize: hybride.size.stubDay,
    lineHeight: hybride.size.stubDay * lineHeights.display,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  ticketBody: {
    flex: 1,
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  ticketTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  ticketFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: hybride.size.section,
    color: colors.text,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minSize + spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  linkIcon: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  linkText: {
    flex: 1,
    gap: spacing.xxs,
  },
  linkTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
