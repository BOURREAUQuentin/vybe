import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

// Champ de recherche : icône loupe, saisie, bouton pour effacer.
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Artiste, concert, ville…',
}: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search' }}
        size={iconSizes.md}
        tintColor={colors.textSecondary}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        style={styles.input}
        accessibilityLabel="Rechercher un artiste, un concert ou une ville"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        maxLength={100}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
            size={iconSizes.md}
            tintColor={colors.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    minHeight: touch.minSize,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  clear: {
    minWidth: touch.minSize,
    minHeight: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
