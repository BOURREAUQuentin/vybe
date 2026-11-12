import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme/tokens';

// Onglet « Envies » (V1.3) : concerts enregistrés dans la liste d'envies (contenu à l'étape 6).
export default function WishlistScreen() {
  const { userId, isRestoring } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes envies" />
      {isRestoring ? (
        <View style={styles.center} accessibilityLabel="Chargement">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : userId ? (
        <EmptyState
          title="Bientôt ici"
          message="Les concerts qui te font envie apparaîtront ici."
        />
      ) : (
        <SignInPrompt
          title="Garde tes concerts en tête"
          message="Connecte-toi pour enregistrer les concerts qui te font envie et les retrouver ici."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
