import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { getInitials } from '@/lib/format';
import { barcodeFromId, type EventView } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived, motion } from '@/mockups/shared/motion';
import { PressableScale } from '@/mockups/shared/PressableScale';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  opacity,
  radius,
  spacing,
  statusBadges,
} from '@/theme/tokens';

import { pass } from './tokens';

const PHOTO_FADE = `linear-gradient(to top, ${colors.surface} 0%, transparent 60%)`;

// ---------------------------------------------------------------------------
// Étiquette + valeur d'un champ de billet (« SALLE / Stereolux »).
// ---------------------------------------------------------------------------
export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children.toUpperCase()}</Text>;
}

export function Field({ label, value, style }: { label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.field, style]}>
      <Label>{label}</Label>
      <Text style={styles.fieldValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tampon de statut : double filet, légèrement incliné. « Reporté » et « Annulé » en corail barré.
// Seul « Billetterie ouverte » est lime.
// ---------------------------------------------------------------------------
export function Stamp({ status, label }: { status: EventView['status']; label?: string }) {
  const badge = statusBadges[status];
  const color =
    status === 'on_sale' ? colors.accent : status === 'cancelled' || status === 'postponed' ? colors.alert : colors.text;
  const struck = status === 'cancelled' || status === 'postponed';

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(motion.bounce.damping).stiffness(motion.bounce.stiffness)}
      style={[styles.stampOuter, { borderColor: color, transform: [{ rotate: pass.stampTilt }] }]}>
      <View style={[styles.stampInner, { borderColor: color }]}>
        <Text style={[styles.stampText, { color }, struck && styles.struck]}>
          {(label ?? badge.label).toUpperCase()}
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Perforations et encoches (découpe du billet).
// ---------------------------------------------------------------------------
export function VerticalPerforation() {
  return (
    <View style={styles.vPerf}>
      <View style={[styles.notch, styles.notchTop]} />
      <View style={styles.vDots}>
        {Array.from({ length: pass.dots }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchBottom]} />
    </View>
  );
}

export function HorizontalPerforation() {
  return (
    <View style={styles.hPerf}>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={styles.hDots}>
        {Array.from({ length: pass.dotsHorizontal }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchRight]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Faux code-barres décoratif + numéro de billet (masqués aux lecteurs d'écran).
// ---------------------------------------------------------------------------
export function Barcode({ id }: { id: string }) {
  const widths = barcodeFromId(id, pass.barcodeBars);
  return (
    <View style={styles.barcodeBlock} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.barcode}>
        {widths.map((width, index) => (
          <View
            key={index}
            style={{
              width: width * pass.barcodeUnit,
              height: pass.barcodeHeight,
              marginRight: pass.barcodeUnit * ((index % 3) + 1),
              backgroundColor: index % 5 === 4 ? derived.transparent : colors.text,
            }}
          />
        ))}
      </View>
      <Text style={styles.ticketNumber}>N° {id.slice(0, 8).toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ticket horizontal (liste) : talon date | perforation | artiste, lieu, tampon.
// ---------------------------------------------------------------------------
export function Ticket({ view, onPress }: { view: EventView; onPress: () => void }) {
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      pressedScale={pass.liftedScale}
      accessibilityRole="button"
      accessibilityLabel={view.accessibilityLabel}
      accessibilityHint="Ouvre la fiche du concert"
      style={[styles.ticket, view.isCancelled && styles.cancelled]}>
      <View style={styles.stub}>
        <Label>{view.weekday}</Label>
        <Text style={styles.stubDay} maxFontSizeMultiplier={maxFontScale.display}>
          {view.day}
        </Text>
        <Label>{view.month}</Label>
      </View>
      <VerticalPerforation />
      <View style={styles.ticketBody}>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {view.title}
        </Text>
        {view.place ? (
          <Text style={styles.meta} numberOfLines={1}>
            {view.place}
          </Text>
        ) : null}
        <View style={styles.ticketFooter}>
          <Text style={styles.time}>{view.time}</Text>
          {view.status !== 'announced' ? <Stamp status={view.status} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Photo (ou initiales) du haut d'un pass vertical.
// ---------------------------------------------------------------------------
export function PassPhoto({ view, height, children }: { view: EventView; height: number; children?: ReactNode }) {
  return (
    <View style={[styles.photo, { height }]}>
      {view.imageUrl ? (
        <Image source={view.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={motion.fadeMs} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.initialsBox]}>
          <Text style={styles.initials} maxFontSizeMultiplier={maxFontScale.display}>
            {getInitials(view.title)}
          </Text>
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, styles.fade]} />
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pass vertical (carrousel « À l'affiche »).
// ---------------------------------------------------------------------------
export function PassCard({ view, onPress }: { view: EventView; onPress: () => void }) {
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      pressedScale={pass.liftedScale}
      accessibilityRole="button"
      accessibilityLabel={view.accessibilityLabel}
      style={styles.passCard}>
      <PassPhoto view={view} height={pass.cardPhotoHeight}>
        <View style={styles.photoStamp}>{view.status !== 'announced' ? <Stamp status={view.status} /> : null}</View>
      </PassPhoto>
      <View style={styles.passBody}>
        <Text style={styles.passTitle} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={maxFontScale.display}>
          {view.title.toUpperCase()}
        </Text>
        <View style={styles.fieldsRow}>
          <Field label="Date" value={`${view.day} ${view.month}`} />
          <Field label="Heure" value={view.time} />
          <Field label="Ville" value={view.cityName ?? '—'} style={styles.flex} />
        </View>
      </View>
      <HorizontalPerforation />
      <View style={styles.passFooter}>
        <Barcode id={view.id} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: pass.size.label,
    letterSpacing: pass.labelSpacing,
    color: colors.textSecondary,
  },
  field: {
    gap: spacing.xxs,
  },
  fieldValue: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  stampOuter: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm / 2,
    padding: pass.stampInset,
  },
  stampInner: {
    borderWidth: 1,
    borderRadius: radius.sm / 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
  },
  stampText: {
    fontFamily: fonts.bold,
    fontSize: pass.size.stamp,
    letterSpacing: pass.labelSpacing,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  vPerf: {
    width: pass.notch,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vDots: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  hPerf: {
    height: pass.notch,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  dot: {
    width: pass.dot,
    height: pass.dot,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  notch: {
    width: pass.notch,
    height: pass.notch,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  notchTop: {
    marginTop: -pass.notch / 2,
  },
  notchBottom: {
    marginBottom: -pass.notch / 2,
  },
  notchLeft: {
    marginLeft: -pass.notch / 2,
  },
  notchRight: {
    marginRight: -pass.notch / 2,
  },
  barcodeBlock: {
    gap: spacing.xxs,
  },
  barcode: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ticketNumber: {
    fontFamily: fonts.medium,
    fontSize: pass.size.label,
    letterSpacing: pass.labelSpacing,
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
    width: pass.stubWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  stubDay: {
    fontFamily: fonts.display,
    fontSize: pass.size.stubDay,
    lineHeight: pass.size.stubDay * lineHeights.display,
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
  meta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  photo: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  initialsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  initials: {
    fontFamily: fonts.display,
    fontSize: fontSizes.initials,
    lineHeight: fontSizes.initials * lineHeights.display,
    color: colors.accent,
  },
  fade: {
    experimental_backgroundImage: PHOTO_FADE,
  },
  photoStamp: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  passCard: {
    width: pass.cardWidth,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  passBody: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  passTitle: {
    fontFamily: fonts.display,
    fontSize: pass.size.cardTitle,
    lineHeight: pass.size.cardTitle * lineHeights.display,
    color: colors.text,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  passFooter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
});
