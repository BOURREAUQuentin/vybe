import { Redirect, Stack } from 'expo-router';

import { MockupsLab } from '@/mockups/MockupsLab';

// Écran TEMPORAIRE de la refonte (étape 2) : maquettes des 3 directions d'interface.
// Accessible uniquement en développement (lien vybe/--/dev-mockups) ; supprimé à l'étape 3.
export default function DevMockupsScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MockupsLab />
    </>
  );
}
