import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { getInitials } from '@/lib/format';
import type { EventView } from '@/mockups/shared/eventView';
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

import { flow } from './tokens';

export const PHOTO_FADE = `linear-gradient(to top, ${colors.background} 0%, ${derived.scrim} 40%, transparent 70%)`;

// ---------------------------------------------------------------------------
// Verre dépoli : vrai flou sur iOS, surface translucide sur Android (le flou Android
// d'expo-blur demande une configuration plus lourde, non nécessaire pour la maquette).
// ---------------------------------------------------------------------------
export function Glass({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[styles.glass, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={flow.blurIntensity} tint="systemUltraThinMaterialDark" style={StyleSheet.absoluteFill} />
      ) : null}
      {children}
    </View>
  );
}

export function GlassPill({ children }: { children: string }) {
  return (
    <Glass style={styles.pill}>
      <Text style={styles.pillText} numberOfLines={1}>
        {children}
      </Text>
    </Glass>
  );
}

type GlassIconButtonProps = {
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
  onPress: () => void;
};

export function GlassIconButton({ icon, label, onPress }: GlassIconButtonProps) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.iconButtonWrap}>
      <Glass style={styles.iconButton}>
        <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
      </Glass>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Photo d'artiste ou initiales.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Photo en parallaxe : défile moins vite que le contenu, s'étire quand on tire vers le bas.
// ---------------------------------------------------------------------------
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
        { translateY: y < 0 ? 0 : y * flow.parallax },
        { scale: interpolate(y, [-height, 0], [flow.stretchMax, 1], Extrapolation.CLAMP) },
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

// ---------------------------------------------------------------------------
// Barre en verre qui apparaît en haut quand on a défilé sous le hero.
// ---------------------------------------------------------------------------
export function GlassHeader({ title, scrollY, top }: { title: string; scrollY: SharedValue<number>; top: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [flow.headerFadeStart, flow.headerFadeStart + flow.headerFadeLength],
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

// ---------------------------------------------------------------------------
// Ligne façon playlist : vignette, artiste, lieu, date à droite.
// ---------------------------------------------------------------------------
export function PlaylistRow({ view, onPress }: { view: EventView; onPress: () => void }) {
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
      <View style={styles.thumb}>
        {view.imageUrl ? (
          <Image source={view.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={motion.fadeMs} />
        ) : (
          <Text style={styles.thumbInitials}>{getInitials(view.title)}</Text>
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {view.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[view.place, view.status !== 'announced' && view.status !== 'on_sale' ? view.statusLabel : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <View style={styles.rowDate}>
        <Text style={styles.rowDay}>{view.day}</Text>
        <Text style={styles.rowMonth}>{view.month}</Text>
      </View>
    </PressableScale>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? derived.transparent : derived.glass,
    borderColor: derived.hairline,
    borderWidth: flow.glassBorder,
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
  iconButtonWrap: {
    borderRadius: radius.pill,
  },
  iconButton: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerGlass: {
    borderWidth: 0,
    borderBottomWidth: flow.glassBorder,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cancelled: {
    opacity: opacity.disabled,
  },
  thumb: {
    width: flow.thumb,
    height: flow.thumb,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  thumbInitials: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  rowDate: {
    alignItems: 'center',
    minWidth: touch.minSize,
  },
  rowDay: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  rowMonth: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: flow.size.section,
    color: colors.text,
  },
});
