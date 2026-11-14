import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { haptics } from '@/lib/haptics';
import { colors, fonts, fontSizes, iconSizes, opacity, radius, sizes, spacing, touch } from '@/theme/tokens';

type ArtistChipProps = {
  name: string;
  imageUrl: string | null;
  selected: boolean;
  /** Artiste déjà suivi : affiché coché, non modifiable ici. */
  locked?: boolean;
  onPress: () => void;
};

// Artiste à cocher (onboarding « Suis quelques artistes ») : avatar rond, anneau blanc et coche
// une fois choisi, nom en dessous. Petite vibration au choix. Pas de lime.
export function ArtistChip({ name, imageUrl, selected, locked = false, onPress }: ArtistChipProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: locked }}
      accessibilityLabel={locked ? `${name}, déjà suivi` : name}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={[styles.ring, selected && styles.ringSelected]}>
        <ArtistAvatar name={name} imageUrl={imageUrl} size="xl" />
        {selected ? (
          <View style={styles.check}>
            <SymbolView name={{ ios: 'checkmark', android: 'check' }} size={iconSizes.sm} tintColor={colors.background} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
      {locked ? <Text style={styles.locked}>Suivi</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: sizes.avatarXL + spacing.lg,
    minHeight: touch.minSize,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  ring: {
    padding: sizes.selectionRing,
    borderWidth: sizes.selectionRing,
    borderColor: colors.transparent,
    borderRadius: radius.pill,
  },
  ringSelected: {
    borderColor: colors.text,
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: sizes.wishBadge,
    height: sizes.wishBadge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nameSelected: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  locked: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
