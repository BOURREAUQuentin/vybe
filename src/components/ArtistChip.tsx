import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

type ArtistChipProps = {
  name: string;
  imageUrl: string | null;
  selected: boolean;
  /** Artiste déjà suivi : affiché coché, non modifiable ici. */
  locked?: boolean;
  onPress: () => void;
};

// Pastille d'artiste à cocher (onboarding « Suis quelques artistes »). Pas de lime.
export function ArtistChip({ name, imageUrl, selected, locked = false, onPress }: ArtistChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: locked }}
      accessibilityLabel={locked ? `${name}, déjà suivi` : name}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <ArtistAvatar name={name} imageUrl={imageUrl} />
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
      {selected ? (
        <SymbolView
          name={{ ios: 'checkmark', android: 'check' }}
          size={iconSizes.sm}
          tintColor={colors.text}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  selected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  nameSelected: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
