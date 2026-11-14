import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type MonthHeaderProps = {
  title: string;
};

// Intertitre de mois dans une liste de billets : « Décembre », « Janvier 2027 ».
export function MonthHeader({ title }: MonthHeaderProps) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
    textTransform: 'capitalize',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
});
