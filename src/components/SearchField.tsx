import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  letterSpacing,
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

// Champ de recherche en forme de pilule : icône loupe, saisie, bouton ⓧ pour effacer.
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
    minHeight: touch.minSize + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  input: {
    flex: 1,
    minHeight: touch.minSize,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    // Explicite : évite qu'un champ natif recyclé garde l'espacement du champ de code (iOS).
    letterSpacing: letterSpacing.none,
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
