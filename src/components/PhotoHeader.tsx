import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParallaxPhoto } from '@/components/ParallaxPhoto';
import { colors, fontSizes, iconSizes, motion, sizes, spacing, touch } from '@/theme/tokens';

type PhotoHeaderProps = {
  /** Nom pour les initiales (sans photo). */
  name: string;
  imageUrl: string | null;
  scrollY: SharedValue<number>;
  /** Sans photo : initiales lime (artiste, concert) ou icône de lieu (salle). */
  placeholder?: 'initials' | 'place';
  /** Texte posé en bas de la photo (pastilles, titre…). */
  children: ReactNode;
};

// En-tête photo d'une fiche (concert, artiste, salle) : la photo se pose en arrivant (léger zoom
// arrière), défile en parallaxe et s'étire quand on tire vers le bas. Le contenu laisse la place
// aux boutons en verre du haut (DetailTopBar).
export function PhotoHeader({ name, imageUrl, scrollY, placeholder = 'initials', children }: PhotoHeaderProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const zoom = useSharedValue(reduceMotion ? 1 : motion.imageZoomFrom);

  useEffect(() => {
    zoom.set(withTiming(1, { duration: motion.imageZoomMs }));
  }, [zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.get() }] }));

  const showPlaceIcon = placeholder === 'place' && !imageUrl;

  return (
    <View style={styles.header}>
      {showPlaceIcon ? (
        <View style={[StyleSheet.absoluteFill, styles.placeBox]} accessible={false}>
          <SymbolView
            name={{ ios: 'mappin.and.ellipse', android: 'location_on' }}
            size={iconSizes.xl}
            tintColor={colors.border}
          />
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
          <ParallaxPhoto
            name={name}
            imageUrl={imageUrl}
            height={sizes.detailHeader}
            scrollY={scrollY}
            initialsSize={fontSizes.initialsGiant}
          />
        </Animated.View>
      )}
      <View style={[styles.content, { paddingTop: insets.top + touch.minSize }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: sizes.detailHeader,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  placeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
});
