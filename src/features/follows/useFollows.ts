import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthContext';
import { MIN_QUERY_LENGTH } from '@/features/search/api';

import {
  fetchFollowedArtists,
  fetchFollowedArtistsEvents,
  fetchOnboardingArtists,
  followArtists,
  searchOnboardingArtists,
  unfollowArtist,
  type FollowedArtist,
} from './api';

// Clés de cache des données du compte : toujours préfixées par ['me', userId]
// (effacées à la déconnexion, jamais mélangées entre deux comptes).
export const followKeys = {
  all: (userId: string | null) => ['me', userId, 'follows'] as const,
  artists: (userId: string | null) => ['me', userId, 'follows', 'artists'] as const,
  events: (userId: string | null, artistIds: string[]) =>
    ['me', userId, 'follows', 'events', [...artistIds].sort()] as const,
};

/** Artistes suivis par l'utilisateur connecté (inactif sans compte). */
export function useFollowedArtists() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: followKeys.artists(userId),
    queryFn: fetchFollowedArtists,
    enabled: userId !== null,
  });
}

/** Prochains concerts des artistes suivis. */
export function useFollowedArtistsEvents(artistIds: string[]) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: followKeys.events(userId, artistIds),
    queryFn: () => fetchFollowedArtistsEvents(artistIds),
    enabled: userId !== null,
  });
}

/** Artistes rap proposés à l'onboarding (catalogue public). */
export function useOnboardingArtists() {
  return useQuery({
    queryKey: ['artists', 'onboarding'],
    queryFn: fetchOnboardingArtists,
    staleTime: 60 * 60 * 1000,
  });
}

/** Recherche d'artistes dans l'onboarding (inactive sous 2 caractères). */
export function useOnboardingSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['artists', 'onboarding-search', trimmed.toLowerCase()],
    queryFn: () => searchOnboardingArtists(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
  });
}

type ArtistSummary = FollowedArtist['artist'];

/**
 * Suivre / ne plus suivre un artiste, avec mise à jour immédiate de l'écran.
 * En cas d'échec, l'état précédent est restauré (et l'erreur est exposée).
 */
export function useToggleFollow() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const listKey = followKeys.artists(userId);

  return useMutation({
    mutationFn: ({ artist, follow }: { artist: NonNullable<ArtistSummary>; follow: boolean }) =>
      follow ? followArtists([artist.id]) : unfollowArtist(artist.id),
    onMutate: async ({ artist, follow }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<FollowedArtist[]>(listKey);
      queryClient.setQueryData<FollowedArtist[]>(listKey, (current = []) =>
        follow
          ? [{ artist_id: artist.id, created_at: new Date().toISOString(), artist }, ...current]
          : current.filter((row) => row.artist_id !== artist.id),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(listKey, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.all(userId) });
    },
  });
}

/** Suivre plusieurs artistes d'un coup (onboarding). */
export function useFollowMany() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: followArtists,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.all(userId) });
    },
  });
}
