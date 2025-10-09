/**
 * Platform-agnostic React hooks for indexer points operations (public endpoints only)
 * Uses React Query for caching, background refetching, and deduplication
 */

import { useCallback, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import type {
  IndexerLeaderboardResponse,
  IndexerSiteStatsResponse,
  Optional,
} from '@johnqh/types';

/**
 * React hook for fetching points leaderboard (public endpoint)
 * GET /points/leaderboard/:count
 *
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 * @param count - Number of top users to fetch (default: 10)
 * @param options - Additional React Query options
 * @returns Query result with leaderboard data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useIndexerPointsLeaderboard(
 *   'https://indexer.0xmail.box',
 *   false,
 *   10
 * );
 *
 * if (data?.success) {
 *   data.data.leaderboard.forEach(user => {
 *     console.log(`${user.rank}. ${user.walletAddress}: ${user.totalPoints} points`);
 *   });
 * }
 * ```
 */
export function useIndexerPointsLeaderboard(
  endpointUrl: string,
  dev: boolean,
  count: number = 10,
  options?: UseQueryOptions<IndexerLeaderboardResponse>
): UseQueryResult<IndexerLeaderboardResponse> {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'points-leaderboard', count],
    queryFn: async (): Promise<IndexerLeaderboardResponse> => {
      return await client.getPointsLeaderboard(count);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - leaderboard changes frequently
    ...options,
  });
}

/**
 * React hook for fetching site-wide statistics (public endpoint)
 * GET /points/site-stats
 *
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 * @param options - Additional React Query options
 * @returns Query result with site stats data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useIndexerPointsSiteStats(
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * if (data?.success) {
 *   console.log('Total Users:', data.data.totalUsers);
 *   console.log('Total Points:', data.data.totalPoints);
 * }
 * ```
 */
export function useIndexerPointsSiteStats(
  endpointUrl: string,
  dev: boolean,
  options?: UseQueryOptions<IndexerSiteStatsResponse>
): UseQueryResult<IndexerSiteStatsResponse> {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'points-site-stats'],
    queryFn: async (): Promise<IndexerSiteStatsResponse> => {
      return await client.getPointsSiteStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - site stats don't change as frequently
    ...options,
  });
}

/**
 * Legacy combined hook with mutation-style API for backward compatibility
 * @deprecated Use useIndexerPointsLeaderboard and useIndexerPointsSiteStats instead
 */
export function useIndexerPoints(endpointUrl: string, dev: boolean = false) {
  const [error, setError] = useState<Optional<string>>(null);

  // Create stable client instance to prevent unnecessary re-renders
  const indexerClient = useMemo(() => {
    return new IndexerClient(endpointUrl, dev);
  }, [endpointUrl, dev]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mutation for getting leaderboard
  const leaderboardMutation = useMutation({
    mutationFn: async (
      count: number = 10
    ): Promise<IndexerLeaderboardResponse> => {
      setError(null);
      try {
        const result = await indexerClient.getPointsLeaderboard(count);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getting site stats
  const siteStatsMutation = useMutation({
    mutationFn: async (): Promise<IndexerSiteStatsResponse> => {
      setError(null);
      try {
        const result = await indexerClient.getPointsSiteStats();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get site stats';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getPointsLeaderboard = useCallback(
    async (count: number = 10): Promise<IndexerLeaderboardResponse> => {
      const result = await leaderboardMutation.mutateAsync(count);
      return result;
    },
    [leaderboardMutation]
  );

  const getPointsSiteStats =
    useCallback(async (): Promise<IndexerSiteStatsResponse> => {
      const result = await siteStatsMutation.mutateAsync();
      return result;
    }, [siteStatsMutation]);

  const isLoading =
    leaderboardMutation.isPending || siteStatsMutation.isPending;

  return {
    // Public API endpoints only
    getPointsLeaderboard,
    getPointsSiteStats,
    // State
    isLoading,
    error,
    clearError,

    // Note: The following methods have been removed as they require signature verification:
    // - getPointsBalance (requires signature verification - not usable by client applications)
  };
}
