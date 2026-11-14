import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type MarqueeProps = {
  /** Texte d'un motif, répété en boucle (ex. « CETTE SEMAINE ✦ »). */
  text: string;
  textStyle: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  /** Vitesse en points par seconde. */
  speed: number;
};

const REPEAT_IN_UNIT = 4; // motif répété dans une « unité » mesurée
const UNITS = 3; // unités affichées côte à côte pour couvrir l'écran pendant le défilement

// Bandeau qui défile en continu. Immobile si « Réduire les animations » est activé.
// Le ScrollView horizontal (non défilable) laisse le texte prendre sa largeur naturelle.
export function Marquee({ text, textStyle, style, speed }: MarqueeProps) {
  const reduceMotion = useReducedMotion();
  const [unitWidth, setUnitWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || unitWidth === 0) return;
    offset.set(0);
    offset.set(
      withRepeat(
        withTiming(-unitWidth, { duration: (unitWidth / speed) * 1000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(offset);
  }, [offset, reduceMotion, speed, unitWidth]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const unit = text.repeat(REPEAT_IN_UNIT);

  return (
    <View style={style} accessible accessibilityRole="header" accessibilityLabel={text}>
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.row, animatedStyle]}>
          {Array.from({ length: UNITS }, (_, index) => (
            <Text
              key={index}
              style={textStyle}
              numberOfLines={1}
              onLayout={index === 0 ? (event) => setUnitWidth(event.nativeEvent.layout.width) : undefined}>
              {unit}
            </Text>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
