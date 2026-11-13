import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type UndoRowProps = {
  /** Message court, ex. « Ninho retiré de tes envies ». */
  message: string;
  onUndo: () => void;
};

// Ligne compacte « … retiré · Annuler », affichée quelques secondes après un retrait.
export function UndoRow({ message, onUndo }: UndoRowProps) {
  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        accessibilityLabel={`Annuler : ${message}`}
        hitSlop={spacing.xs}
        style={({ pressed }) => [styles.undo, pressed && styles.pressed]}>
        <Text style={styles.undoLabel}>Annuler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  message: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  undo: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  undoLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
