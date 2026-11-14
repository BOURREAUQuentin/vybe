import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Échelle quand le doigt appuie (1 = aucun effet). */
  pressedScale?: number;
};

// Élément touchable qui s'enfonce légèrement sous le doigt (désactivé si « Réduire les animations »).
export function PressableScale({
  style,
  children,
  pressedScale = motion.pressedScale,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        if (!reduceMotion) scale.set(withSpring(pressedScale, motion.spring));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, motion.spring));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
