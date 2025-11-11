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
import type { PointsInfoResponse } from '../network/IndexerClient';
import type {
  IndexerLeaderboardResponse,
  IndexerSiteStatsResponse,
  NetworkClient,
  Optional,
} from '@sudobility/types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching general points system information (public endpoint)
 * GET /points
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 * @param options - Additional React Query options
 * @returns Query result with points info data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useIndexerPointsInfo(
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * if (data?.success) {
 *   console.log('Total Users:', data.data.siteStats.totalUsers);
 *   console.log('Total Points:', data.data.siteStats.totalPoints);
 *   console.log('Top 5 Users:', data.data.topUsers);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export function useIndexerPointsInfo(
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  options?: UseQueryOptions<PointsInfoResponse>
): UseQueryResult<PointsInfoResponse> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'points-info'],
    queryFn: async (): Promise<PointsInfoResponse> => {
      return await client.getPointsInfo();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - general info changes frequently
    retry: false,
    ...options,
  });
}

/**
 * React hook for fetching points leaderboard (public endpoint)
 * GET /points/leaderboard/:count
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 * @param count - Number of top users to fetch (default: 10)
 * @param options - Additional React Query options
 * @returns Query result with leaderboard data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useIndexerPointsLeaderboard(
 *   networkClient,
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
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export function useIndexerPointsLeaderboard(
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  count: number = 10,
  options?: UseQueryOptions<IndexerLeaderboardResponse>
): UseQueryResult<IndexerLeaderboardResponse> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'points-leaderboard', count],
    queryFn: async (): Promise<IndexerLeaderboardResponse> => {
      return await client.getPointsLeaderboard(count);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - leaderboard changes frequently
    retry: false,
    ...options,
  });
}

/**
 * React hook for fetching site-wide statistics (public endpoint)
 * GET /points/site-stats
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 * @param options - Additional React Query options
 * @returns Query result with site stats data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useIndexerPointsSiteStats(
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * if (data?.success) {
 *   console.log('Total Users:', data.data.totalUsers);
 *   console.log('Total Points:', data.data.totalPoints);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export function useIndexerPointsSiteStats(
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  options?: UseQueryOptions<IndexerSiteStatsResponse>
): UseQueryResult<IndexerSiteStatsResponse> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'points-site-stats'],
    queryFn: async (): Promise<IndexerSiteStatsResponse> => {
      return await client.getPointsSiteStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - site stats don't change as frequently
    retry: false,
    ...options,
  });
}

/**
 * Legacy combined hook with mutation-style API for backward compatibility
 * @deprecated Use useIndexerPointsInfo, useIndexerPointsLeaderboard and useIndexerPointsSiteStats instead
 */
export function useIndexerPoints(
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean = false
) {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mutation for getting points info
  const pointsInfoMutation = useMutation({
    mutationFn: async (): Promise<PointsInfoResponse> => {
      setError(null);
      try {
        return await client.getPointsInfo();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get points info';
        setError(errorMessage);
        throw err;
      }
    },
    retry: false,
  });

  // Mutation for getting leaderboard
  const leaderboardMutation = useMutation({
    mutationFn: async (
      count: number = 10
    ): Promise<IndexerLeaderboardResponse> => {
      setError(null);
      try {
        return await client.getPointsLeaderboard(count);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      }
    },
    retry: false,
  });

  // Mutation for getting site stats
  const siteStatsMutation = useMutation({
    mutationFn: async (): Promise<IndexerSiteStatsResponse> => {
      setError(null);
      try {
        return await client.getPointsSiteStats();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get site stats';
        setError(errorMessage);
        throw err;
      }
    },
    retry: false,
  });

  const getPointsInfo = useCallback(async (): Promise<PointsInfoResponse> => {
    const result = await pointsInfoMutation.mutateAsync();
    return result;
  }, [pointsInfoMutation]);

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
    pointsInfoMutation.isPending ||
    leaderboardMutation.isPending ||
    siteStatsMutation.isPending;

  return useMemo(
    () => ({
      // Public API endpoints only
      getPointsInfo,
      getPointsLeaderboard,
      getPointsSiteStats,
      // State
      isLoading,
      error,
      clearError,

      // Note: The following methods have been removed as they require signature verification:
      // - getPointsBalance (requires signature verification - not usable by client applications)
    }),
    [
      getPointsInfo,
      getPointsLeaderboard,
      getPointsSiteStats,
      isLoading,
      error,
      clearError,
    ]
  );
}
