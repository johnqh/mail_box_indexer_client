/**
 * Platform-agnostic React hook for indexer points operations (public endpoints only)
 * Uses React Query for caching, background refetching, and deduplication
 * Note: Signature-protected endpoints have been removed as they're not usable by client applications
 */

import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import type { LeaderboardResponse, SiteStatsResponse } from '@johnqh/types';

/**
 * React hook for Indexer Points API operations using actual API endpoints (public only)
 *
 * @param endpointUrl - Base URL for the indexer API
 * @param dev - Development mode flag
 *
 * @example
 * ```tsx
 * const { getPointsLeaderboard } = useIndexerPoints('https://indexer.0xmail.box');
 * ```
 */
function useIndexerPoints(endpointUrl: string, dev: boolean = false) {
  const [error, setError] = useState<string | null>(null);

  // Create stable client instance to prevent unnecessary re-renders
  const indexerClient = useMemo(() => {
    return new IndexerClient(endpointUrl, dev);
  }, [endpointUrl, dev]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mutation for getting leaderboard
  const leaderboardMutation = useMutation({
    mutationFn: async (count: number = 10): Promise<LeaderboardResponse> => {
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
    mutationFn: async (): Promise<SiteStatsResponse> => {
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
    async (count: number = 10): Promise<LeaderboardResponse> => {
      const result = await leaderboardMutation.mutateAsync(count);
      return result;
    },
    [leaderboardMutation]
  );

  const getPointsSiteStats =
    useCallback(async (): Promise<SiteStatsResponse> => {
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

export { useIndexerPoints };
