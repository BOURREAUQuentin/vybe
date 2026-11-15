import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';

import { MIN_QUERY_LENGTH, searchCatalog, searchEvents, type SearchLimits } from './api';

/**
 * Artistes, salles et villes trouvés. Inactif tant que la saisie fait moins de 2 caractères.
 * L'ordre dépend du compte (tes choix d'abord) : avec un compte, la clé commence par
 * ['me', userId] et ces résultats sont effacés à la déconnexion.
 */
export function useSearch(query: string, limits: SearchLimits) {
  const { userId } = useAuth();
  const trimmed = query.trim();
  const key = ['search', trimmed.toLowerCase(), limits.artists, limits.venues, limits.cities];

  return useQuery({
    queryKey: userId === null ? key : ['me', userId, ...key],
    queryFn: () => searchCatalog(trimmed, limits),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    // Garde les résultats précédents affichés pendant qu'on continue de taper (ou « Voir plus »).
    placeholderData: keepPreviousData,
  });
}

/**
 * Concerts correspondant à la recherche : les `limit` premiers et le total. Passer à une limite
 * plus grande (« Voir plus ») garde les concerts déjà affichés pendant le chargement.
 */
export function useSearchEvents(query: string, limit: number) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', 'events', trimmed.toLowerCase(), limit],
    queryFn: () => searchEvents(trimmed, limit),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
  });
}
