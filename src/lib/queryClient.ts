/**
 * Optimized React Query client configuration
 * Configured for scalability with proper caching, retries, and error handling
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: how long unused data stays in cache (30 minutes)
      gcTime: 30 * 60 * 1000,
      
      // Retry configuration for resilience
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on reconnect by default (can be overwhelming)
      refetchOnReconnect: 'always',
      
      // Network mode: online first, but support offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Log mutation errors
      onError: (error) => {
        logger.error('Mutation failed', error);
      },
    },
  },
});

// Global error handler for queries
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    logger.error('Query failed', event.query.state.error as Error, {
      queryKey: event.query.queryKey,
    });
  }
});

// Prefetch common data on app load
export async function prefetchCommonData(): Promise<void> {
  // This can be called after auth to prefetch commonly needed data
  logger.debug('Prefetching common data');
}
