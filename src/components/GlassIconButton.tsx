import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { PressableScale } from '@/components/PressableScale';
import { colors, iconSizes, radius, touch } from '@/theme/tokens';

type GlassIconButtonProps = {
  /** Icône : symbole SF sur iOS, Material Symbol sur Android. */
  icon: SymbolViewProps['name'];
  /** Libellé lu par VoiceOver / TalkBack. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Actif (ex. concert dans les envies) : fond blanc plein et icône noire, lisible sur toute photo. */
  active?: boolean;
};

// Bouton rond en verre (44 × 44 pt), posé sur une photo : retour, cœur, partage…
export function GlassIconButton({ icon, accessibilityLabel, onPress, active = false }: GlassIconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={styles.round}>
      {active ? (
        <View style={[styles.button, styles.active]}>
          <SymbolView name={icon} size={iconSizes.md} tintColor={colors.background} />
        </View>
      ) : (
        <Glass dim style={styles.button}>
          <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
        </Glass>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  round: {
    borderRadius: radius.pill,
  },
  button: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  active: {
    backgroundColor: colors.text,
  },
});
