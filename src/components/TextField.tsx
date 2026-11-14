import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import {
  colors,
  fonts,
  fontSizes,
  letterSpacing,
  lineHeights,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

export type TextFieldRef = ComponentRef<typeof TextInput>;

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'ref'> & {
  /** Accès au champ (ex. pour lui donner le focus). React 19 : `ref` est une propriété normale. */
  ref?: Ref<TextFieldRef>;
  label: string;
  /** Message d'erreur affiché sous le champ (et lu par les lecteurs d'écran). */
  error?: string | null;
  /** Style « gros chiffres espacés » pour la saisie d'un code. */
  variant?: 'default' | 'code';
};

// Champ de saisie en pilule : libellé, saisie, message d'erreur éventuel. Variante « code » :
// grands chiffres tabulaires espacés, dans un bloc arrondi.
export function TextField({ ref, label, error, variant = 'default', ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={error ?? inputProps.accessibilityHint}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        style={[styles.input, variant === 'code' && styles.code, error ? styles.inputError : null]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  input: {
    minHeight: touch.minSize + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    // Explicite : le variant « code » change l'espacement ; un champ recyclé doit revenir à 0.
    letterSpacing: letterSpacing.none,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.pill,
  },
  code: {
    minHeight: touch.minSize * 1.5,
    fontFamily: fonts.bold,
    fontSize: fontSizes.display,
    fontVariant: ['tabular-nums'],
    letterSpacing: letterSpacing.code,
    textAlign: 'center',
    borderRadius: radius.lg,
  },
  inputError: {
    borderColor: colors.alert,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.alert,
  },
});
