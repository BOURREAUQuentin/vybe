import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, letterSpacing, spacing } from '@/theme/tokens';

type MonthHeaderProps = {
  title: string;
};

// Intertitre de mois dans une liste de concerts : « DÉCEMBRE », « JANVIER 2027 ».
export function MonthHeader({ title }: MonthHeaderProps) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
});
