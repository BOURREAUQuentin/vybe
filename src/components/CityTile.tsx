import { Image } from 'expo-image';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { haptics } from '@/lib/haptics';
import { cityGradientFor } from '@/theme/cityGradient';
import { colors, fonts, fontSizes, photoFade, radius, sizes, spacing } from '@/theme/tokens';

type CityTileProps = {
  name: string;
  count: number;
  /** Photo de la ville (ou null : dégradé propre à la ville). */
  imageUrl: string | null;
  onPress: () => void;
  /** Largeur : fixe dans un défilement horizontal, en % dans une grille. */
  width?: DimensionValue;
};

// Tuile de ville : photo, dégradé, nom et nombre de concerts à venir.
export function CityTile({ name, count, imageUrl, onPress, width = sizes.cityTileWidth }: CityTileProps) {
  const countLabel = `${count} concert${count > 1 ? 's' : ''}`;

  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${countLabel}`}
      accessibilityHint="Ouvre les concerts de cette ville"
      style={[styles.tile, { width }]}>
      {imageUrl ? (
        <>
          <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
          <View style={[StyleSheet.absoluteFill, styles.fade]} />
        </>
      ) : (
        // Sans photo : dégradé d'une teinte propre à la ville (sombre en bas, texte lisible).
        <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: cityGradientFor(name) }]} />
      )}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.count}>{countLabel}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    height: sizes.cityTileHeight,
    justifyContent: 'flex-end',
    padding: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  fade: {
    experimental_backgroundImage: photoFade,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
});
