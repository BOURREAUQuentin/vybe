import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, lineHeights, maxFontScale, spacing } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  /** Action facultative affichée à droite du titre (ex. un IconButton). */
  action?: ReactNode;
};

// En-tête des écrans principaux : grand titre Anton en majuscules.
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
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
});
