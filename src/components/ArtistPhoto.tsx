import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, fonts, lineHeights, maxFontScale, motion } from '@/theme/tokens';

type ArtistPhotoProps = {
  /** Nom utilisé pour les initiales quand il n'y a pas de photo. */
  name: string;
  imageUrl: string | null;
  /** Taille des initiales (Anton lime) sans photo. */
  initialsSize: number;
};

// Photo d'artiste qui remplit son conteneur ; sans photo : initiales en Anton lime sur fond surface.
export function ArtistPhoto({ name, imageUrl, initialsSize }: ArtistPhotoProps) {
  if (imageUrl) {
    return (
      <Image
        source={imageUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={motion.enterMs}
        accessible={false}
      />
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.box]} accessible={false}>
      <Text
        style={[styles.initials, { fontSize: initialsSize, lineHeight: initialsSize * lineHeights.display }]}
        maxFontSizeMultiplier={maxFontScale.display}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  initials: {
    fontFamily: fonts.display,
    color: colors.accent,
  },
});
