import { createClient } from '@supabase/supabase-js';

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

// Client en lecture seule pour le MVP : pas de compte, donc pas de session à conserver.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
