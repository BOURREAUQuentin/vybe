import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, glass } from '@/theme/tokens';

type GlassProps = {
  style?: StyleProp<ViewStyle>;
  /** Voile sombre en plus : reste lisible posé sur une photo claire. */
  dim?: boolean;
  children?: ReactNode;
};

// Verre dépoli : vrai flou sur iOS ; sur Android, surface translucide (le flou Android
// d'expo-blur demande une configuration plus lourde, sans gain réel ici).
export function Glass({ style, dim = false, children }: GlassProps) {
  return (
    <View style={[styles.glass, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={glass.blurIntensity} tint="systemUltraThinMaterialDark" style={StyleSheet.absoluteFill} />
      ) : null}
      {dim ? <View style={[StyleSheet.absoluteFill, styles.dim]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? colors.transparent : colors.glass,
    borderColor: colors.hairline,
    borderWidth: glass.borderWidth,
  },
  dim: {
    backgroundColor: colors.scrim,
  },
});
