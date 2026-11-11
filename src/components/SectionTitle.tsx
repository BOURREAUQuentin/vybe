import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

type SectionTitleProps = {
  title: string;
};

// Titre d'une section de la page Découvrir (Inter : Anton est réservé aux grands titres).
export function SectionTitle({ title }: SectionTitleProps) {
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
    paddingHorizontal: spacing.md,
  },
});
