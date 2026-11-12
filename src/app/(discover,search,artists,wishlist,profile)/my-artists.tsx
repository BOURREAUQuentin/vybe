import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme/tokens';

// Onglet « Artistes » (V1.3) : artistes suivis et leurs concerts à venir (contenu à l'étape 5).
export default function MyArtistsScreen() {
  const { userId, isRestoring } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes artistes" />
      {isRestoring ? (
        <View style={styles.center} accessibilityLabel="Chargement">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : userId ? (
        <EmptyState
          title="Bientôt ici"
          message="Les artistes que tu suis et leurs concerts à venir apparaîtront ici."
        />
      ) : (
        <SignInPrompt
          title="Suis tes artistes"
          message="Connecte-toi pour suivre tes artistes et retrouver tous leurs concerts au même endroit."
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
