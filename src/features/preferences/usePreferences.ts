import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';

import {
  addFavoriteCity,
  addFavoriteVenue,
  addGenrePreference,
  fetchFavoriteCities,
  fetchFavoriteVenues,
  fetchGenrePreferences,
  removeFavoriteCity,
  removeFavoriteVenue,
  removeGenrePreference,
  setMainCity,
  unsetMainCity,
  type FavoriteVenue,
} from './api';

// Clés de cache du compte : ['me', userId, …] (effacées à la déconnexion).
export const preferenceKeys = {
  cities: (userId: string | null) => ['me', userId, 'preferences', 'cities'] as const,
  venues: (userId: string | null) => ['me', userId, 'preferences', 'venues'] as const,
  genres: (userId: string | null) => ['me', userId, 'preferences', 'genres'] as const,
};

// ---------------------------------------------------------------------------
// Villes
// ---------------------------------------------------------------------------

export function useFavoriteCities() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: preferenceKeys.cities(userId),
    queryFn: fetchFavoriteCities,
    enabled: userId !== null,
  });
}

/** Ville principale (ou null) : alimente « Près de chez toi ». */
export function useMainCity() {
  const { data, ...rest } = useFavoriteCities();
  const main = data?.find((row) => row.is_main) ?? null;
  return { mainCity: main, ...rest };
}

type CityAction =
  | { type: 'setMain'; cityId: string; radiusKm: number }
  | { type: 'unsetMain' }
  | { type: 'add'; cityId: string }
  | { type: 'remove'; cityId: string };

/** Modifier les villes favorites (la liste est rechargée après chaque action). */
export function useUpdateFavoriteCities() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: CityAction) => {
      switch (action.type) {
        case 'setMain':
          return setMainCity(action.cityId, action.radiusKm);
        case 'unsetMain':
          return unsetMainCity();
        case 'add':
          return addFavoriteCity(action.cityId);
        case 'remove':
          return removeFavoriteCity(action.cityId);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: preferenceKeys.cities(userId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Salles
// ---------------------------------------------------------------------------

export function useFavoriteVenues() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: preferenceKeys.venues(userId),
    queryFn: fetchFavoriteVenues,
    enabled: userId !== null,
  });
}

type VenueSummary = NonNullable<FavoriteVenue['venue']>;

/** Ajouter / retirer une salle favorite, avec mise à jour immédiate puis retour en cas d'échec. */
export function useToggleFavoriteVenue() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const key = preferenceKeys.venues(userId);

  return useMutation({
    mutationFn: ({ venue, add }: { venue: VenueSummary; add: boolean }) =>
      add ? addFavoriteVenue(venue.id) : removeFavoriteVenue(venue.id),
    onMutate: async ({ venue, add }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoriteVenue[]>(key);
      queryClient.setQueryData<FavoriteVenue[]>(key, (current = []) =>
        add
          ? [{ venue_id: venue.id, created_at: new Date().toISOString(), venue }, ...current]
          : current.filter((row) => row.venue_id !== venue.id),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

// ---------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------

export function useGenrePreferences() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: preferenceKeys.genres(userId),
    queryFn: fetchGenrePreferences,
    enabled: userId !== null,
  });
}

/** Cocher / décocher un genre préféré, avec mise à jour immédiate puis retour en cas d'échec. */
export function useToggleGenrePreference() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const key = preferenceKeys.genres(userId);

  return useMutation({
    mutationFn: ({ genreId, add }: { genreId: string; add: boolean }) =>
      add ? addGenrePreference(genreId) : removeGenrePreference(genreId),
    onMutate: async ({ genreId, add }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData<string[]>(key, (current = []) =>
        add ? [...new Set([...current, genreId])] : current.filter((id) => id !== genreId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
