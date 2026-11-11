import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/tokens';

// Garde l'écran de démarrage affiché tant que les polices ne sont pas chargées.
SplashScreen.preventAutoHideAsync();

// Thème de navigation sombre, aligné sur les tokens de Vybe.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.alert,
  },
};

export default function RootLayout() {
  // Les clés doivent correspondre aux noms déclarés dans `fonts` (src/theme/tokens.ts).
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {/* Barre d'onglets native. Pas de lime ici : l'accent est réservé à l'action principale de chaque écran. */}
      <NativeTabs
        backgroundColor={colors.background}
        tintColor={colors.text}
        iconColor={{ default: colors.textSecondary, selected: colors.text }}
        labelStyle={{
          default: { color: colors.textSecondary },
          selected: { color: colors.text },
        }}>
        <NativeTabs.Trigger name="(discover)">
          <NativeTabs.Trigger.Icon sf="sparkles" md="explore" />
          <NativeTabs.Trigger.Label>Découvrir</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search)">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
          <NativeTabs.Trigger.Label>Recherche</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
