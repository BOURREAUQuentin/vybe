import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';

import { ArtistPhoto } from '@/components/ArtistPhoto';
import { motion, photoFade } from '@/theme/tokens';

type ParallaxPhotoProps = {
  name: string;
  imageUrl: string | null;
  /** Hauteur du bloc photo (sert à l'étirement). */
  height: number;
  scrollY: SharedValue<number>;
  initialsSize: number;
};

// Photo d'en-tête : défile moins vite que le contenu (parallaxe) et s'agrandit quand on tire
// vers le bas. Dégradé sombre en bas pour lire le texte posé dessus. Fixe si « Réduire les animations ».
export function ParallaxPhoto({ name, imageUrl, height, scrollY, initialsSize }: ParallaxPhotoProps) {
  const reduceMotion = useReducedMotion();
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y < 0 ? 0 : y * motion.parallax },
        { scale: interpolate(y, [-height, 0], [motion.stretchMax, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <ArtistPhoto name={name} imageUrl={imageUrl} initialsSize={initialsSize} />
      <View style={[StyleSheet.absoluteFill, styles.fade]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fade: {
    experimental_backgroundImage: photoFade,
  },
});
