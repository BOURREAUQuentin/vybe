import { StyleSheet, Text } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Glass } from '@/components/Glass';
import { colors, fonts, fontSizes, glass, motion, spacing } from '@/theme/tokens';

type GlassHeaderProps = {
  title: string;
  /** Défilement de l'écran (Reanimated). */
  scrollY: SharedValue<number>;
  /** Marge du haut (zone sûre). */
  top: number;
};

// Barre en verre qui apparaît en haut de l'écran une fois le grand visuel dépassé.
// Purement décorative : elle ne capte pas le toucher.
export function GlassHeader({ title, scrollY, top }: GlassHeaderProps) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [motion.headerFadeStart, motion.headerFadeStart + motion.headerFadeLength],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.header, style]} accessibilityElementsHidden>
      <Glass style={[styles.bar, { paddingTop: top }]}>
        <Text style={styles.title}>{title}</Text>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bar: {
    borderWidth: 0,
    borderBottomWidth: glass.borderWidth,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
