import { StyleSheet, Text } from 'react-native';

import { Glass } from '@/components/Glass';
import { colors, fonts, fontSizes, radius, spacing } from '@/theme/tokens';

// Petite pastille en verre posée sur une photo (ex. « SAM 21 NOV · 20H00 », « Rap à l'affiche »).
export function GlassPill({ label }: { label: string }) {
  return (
    <Glass dim style={styles.pill}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </Glass>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
});
