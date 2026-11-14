import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/GlassIconButton';
import { spacing } from '@/theme/tokens';

// Boutons en verre fixes en haut d'une fiche à photo (concert, artiste, salle), qui remplacent la
// barre native : retour à gauche, action facultative à droite (ex. cœur). Le geste de retour reste actif.
export function DetailTopBar({ right }: { right?: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
      <GlassIconButton
        icon={{ ios: 'chevron.left', android: 'arrow_back' }}
        accessibilityLabel="Retour"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
