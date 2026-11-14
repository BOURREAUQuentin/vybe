import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, maxFontScale, spacing } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  /** Action facultative affichée à droite du titre (ex. un IconButton). */
  action?: ReactNode;
};

// En-tête des écrans principaux : titre en Inter gras 34 pt (V1.3.1 : Anton est réservé aux noms d'artistes).
export function ScreenHeader({ title, action }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        accessibilityRole="header"
        numberOfLines={1}
        maxFontSizeMultiplier={maxFontScale.display}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.screenTitle,
    color: colors.text,
  },
});
