import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type UndoRowProps = {
  /** Message court, ex. « Ninho retiré de tes envies ». */
  message: string;
  onUndo: () => void;
};

// Mini-billet « … retiré de tes envies · Annuler », affiché quelques secondes après un retrait.
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
        hitSlop={spacing.sm}
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
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  message: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  undo: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  undoLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.background,
  },
});
