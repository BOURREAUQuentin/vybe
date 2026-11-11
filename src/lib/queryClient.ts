import { QueryClient } from '@tanstack/react-query';

// Cache partagé par toute l'application.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // données considérées fraîches pendant 5 minutes
      retry: 2, // deux nouvelles tentatives en cas d'échec réseau
    },
  },
});
