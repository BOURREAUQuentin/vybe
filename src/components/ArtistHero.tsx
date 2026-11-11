import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, fonts, fontSizes, lineHeights, sizes, spacing } from '@/theme/tokens';

type ArtistHeroProps = {
  name: string;
  imageUrl: string | null;
};

// Dégradé sombre du bas vers le haut, pour que le nom reste lisible sur la photo.
const PHOTO_GRADIENT = `linear-gradient(to top, ${colors.overlay} 0%, transparent 75%)`;

// En-tête de la fiche artiste : photo + dégradé + nom en Anton,
// ou, sans photo, fond surface avec les initiales en Anton lime.
export function ArtistHero({ name, imageUrl }: ArtistHeroProps) {
  return (
    <View style={styles.hero}>
      {imageUrl ? (
        <>
          <Image
            source={imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessible={false}
          />
          <View style={[StyleSheet.absoluteFill, styles.gradient]} />
        </>
      ) : (
        <View style={styles.initialsContainer}>
          <Text style={styles.initials} accessible={false}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      <Text style={styles.name} accessibilityRole="header" numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: sizes.heroHeight,
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  gradient: {
    experimental_backgroundImage: PHOTO_GRADIENT,
  },
  initialsContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    fontSize: fontSizes.initialsHero,
    lineHeight: fontSizes.initialsHero * lineHeights.display,
    color: colors.accent,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
});
