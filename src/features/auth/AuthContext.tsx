import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

import { signOut as signOutRequest } from './api';

type AuthContextValue = {
  session: Session | null;
  /** E-mail du compte connecté, ou null. */
  email: string | null;
  /** Identifiant du compte connecté, ou null. */
  userId: string | null;
  /** Vrai tant que la session enregistrée n'a pas été relue au démarrage. */
  isRestoring: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Suit la session du compte (connexion, déconnexion, renouvellement) pour toute l'application.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // Session enregistrée lors d'un lancement précédent.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setIsRestoring(false));

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'SIGNED_OUT') {
        // Ne garde en mémoire aucune donnée du compte précédent.
        queryClient.removeQueries({ queryKey: ['me'] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const value: AuthContextValue = {
    session,
    email: session?.user.email ?? null,
    userId: session?.user.id ?? null,
    isRestoring,
    signOut: signOutRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider.');
  }
  return value;
}
