import { createClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

// Valeurs lues dans .env au moment de la compilation (préfixe EXPO_PUBLIC_).
// Seules l'URL du projet et la clé PUBLIQUE sont autorisées dans l'application.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Configuration Supabase manquante : renseigne EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_KEY dans .env (voir .env.example), puis relance « npx expo start ».',
  );
}

// V1.3 : la session du compte est conservée dans le stockage local de l'app
// (expo-sqlite/kv-store) pour rester connecté entre deux lancements.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: Storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // connexion par code, pas par lien
  },
});

// Renouvelle la session seulement quand l'app est au premier plan (recommandation Supabase
// pour React Native) : évite des requêtes inutiles en arrière-plan.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
