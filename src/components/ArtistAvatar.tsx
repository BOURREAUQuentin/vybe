import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, fonts, fontSizes, radius, sizes } from '@/theme/tokens';

type ArtistAvatarProps = {
  name: string;
  imageUrl: string | null;
  /** md : programmation, listes ; lg : rangée « Mes artistes ». */
  size?: 'md' | 'lg';
};

// Vignette ronde d'un artiste : photo, ou initiales sur fond surface.
export function ArtistAvatar({ name, imageUrl, size = 'md' }: ArtistAvatarProps) {
  const isLarge = size === 'lg';

  return (
    <View style={[styles.avatar, isLarge && styles.large]} accessible={false}>
      {imageUrl ? (
        <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, isLarge && styles.initialsLarge]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  large: {
    width: sizes.avatarLarge,
    height: sizes.avatarLarge,
  },
  initials: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  initialsLarge: {
    fontSize: fontSizes.lg,
  },
});
