import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, radius, spacing } from '@/theme/tokens';

// Pastille blanche « ♥ Envie » : le concert est dans la liste d'envies (billets, fiche).
export function WishChip() {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>♥ Envie</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.chip,
    color: colors.background,
  },
});
