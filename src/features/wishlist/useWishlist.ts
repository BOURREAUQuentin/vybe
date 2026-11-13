import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';

import {
  addToWishlist,
  fetchWishlist,
  fetchWishlistIds,
  removeFromWishlist,
  type Wishlist,
} from './api';

// Clés de cache du compte : ['me', userId, …] (effacées à la déconnexion).
export const wishlistKeys = {
  all: (userId: string | null) => ['me', userId, 'wishlist'] as const,
  ids: (userId: string | null) => ['me', userId, 'wishlist', 'ids'] as const,
  list: (userId: string | null) => ['me', userId, 'wishlist', 'list'] as const,
};

/** Identifiants des concerts enregistrés (état des cœurs). */
export function useWishlistIds() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.ids(userId),
    queryFn: fetchWishlistIds,
    enabled: userId !== null,
  });
}

/** Concerts enregistrés (onglet Envies). */
export function useWishlist() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: wishlistKeys.list(userId),
    queryFn: fetchWishlist,
    enabled: userId !== null,
  });
}

/**
 * Ajouter / retirer un concert des envies, avec mise à jour immédiate du cœur
 * puis retour à l'état précédent en cas d'échec.
 *
 * Retrait « en douceur » : la liste de l'onglet Envies n'est PAS rechargée au retrait.
 * La carte reste affichée, estompée avec un cœur vide (un nouveau toucher la remet) ;
 * elle disparaît au prochain rafraîchissement. Un ajout, lui, recharge la liste.
 */
export function useToggleWishlist() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const idsKey = wishlistKeys.ids(userId);

  return useMutation({
    mutationFn: ({ eventId, add }: { eventId: string; add: boolean }) =>
      add ? addToWishlist(eventId) : removeFromWishlist(eventId),
    onMutate: async ({ eventId, add }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previousIds = queryClient.getQueryData<string[]>(idsKey);
      queryClient.setQueryData<string[]>(idsKey, (current = []) =>
        add ? [...new Set([...current, eventId])] : current.filter((id) => id !== eventId),
      );
      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(idsKey, context?.previousIds);
    },
    onSettled: (_data, _error, { add }) => {
      void queryClient.invalidateQueries({ queryKey: idsKey });
      if (add) {
        void queryClient.invalidateQueries({ queryKey: wishlistKeys.list(userId) });
      }
    },
  });
}

export type { Wishlist };
