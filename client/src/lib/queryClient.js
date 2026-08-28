import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes cache validity
      gcTime: 1000 * 60 * 10,    // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent unwanted refetch when user switches tabs/apps
      retry: 1,
    },
  },
});
