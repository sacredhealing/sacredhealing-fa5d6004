/**
 * Optimized React Query client configuration
 * SQI 2050 — tuned for instant perceived performance
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 10 min stale time — data stays fresh, no unnecessary re-fetches
      staleTime: 10 * 60 * 1000,
      
      // 60 min cache — navigating back is instant
      gcTime: 60 * 60 * 1000,
      
      // Don't retry 4xx client errors
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      
      // Disable window-focus refetch — kills perceived jank when switching tabs
      refetchOnWindowFocus: false,
      
      // Reconnect refetch still useful
      refetchOnReconnect: 'always',
      
      // FIXED: was 'offlineFirst' which caused auth query to hang indefinitely
      // on fresh page load with no cached session. 'always' ensures queries
      // always fire a real network request regardless of online/offline status.
      networkMode: 'always',
    },
    mutations: {
      retry: 1,
      networkMode: 'always',
      onError: (error) => {
        logger.error('Mutation failed', error);
      },
    },
  },
});

// Global error handler
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    logger.error('Query failed', event.query.state.error as Error, {
      queryKey: event.query.queryKey,
    });
  }
});

export async function prefetchCommonData(): Promise<void> {
  logger.debug('Prefetching common data');
}
