/**
 * Platform-agnostic React hook for indexer points operations (public endpoints only)
 * Uses actual IndexerClient to interact with real API endpoints
 * Note: Signature-protected endpoints have been removed as they're not usable by client applications
 */

import { useCallback, useMemo, useState } from 'react';
import { IndexerClient } from '../network/IndexerClient';
import type { LeaderboardResponse, SiteStatsResponse } from '@johnqh/types';
import { IndexerMockData } from './mocks';
import { useIndexerConfigOptional } from '../context/IndexerConfigContext';

/**
 * React hook for Indexer Points API operations using actual API endpoints (public only)
 *
 * @param endpointUrl - Optional. Base URL for the indexer API. If not provided, uses IndexerConfigProvider context
 * @param dev - Optional. Development mode flag
 * @param devMode - Optional. When true, falls back to mock data on errors
 *
 * @example
 * ```tsx
 * // Option 1: Using IndexerConfigProvider (recommended)
 * <IndexerConfigProvider config={{ baseUrl: 'https://indexer.0xmail.box' }}>
 *   <MyComponent />
 * </IndexerConfigProvider>
 *
 * function MyComponent() {
 *   const { getPointsLeaderboard } = useIndexerPoints();
 *   // ...
 * }
 *
 * // Option 2: Direct URL (backward compatible)
 * const { getPointsLeaderboard } = useIndexerPoints('https://indexer.0xmail.box');
 * ```
 */
function useIndexerPoints(
  endpointUrl?: string,
  dev: boolean = false,
  devMode: boolean = false
) {
  const contextConfig = useIndexerConfigOptional();

  // Use provided endpointUrl, or fall back to context, or throw error
  const resolvedEndpointUrl = useMemo(() => {
    if (endpointUrl) {
      return endpointUrl;
    }
    if (contextConfig?.baseUrl) {
      return contextConfig.baseUrl;
    }
    throw new Error(
      'IndexerPoints: No endpoint URL provided. Either pass endpointUrl parameter or wrap your app with IndexerConfigProvider.'
    );
  }, [endpointUrl, contextConfig]);

  const resolvedDevMode = devMode || contextConfig?.devMode || false;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create stable client instance to prevent unnecessary re-renders
  const indexerClient = useMemo(() => {
    return new IndexerClient(resolvedEndpointUrl, dev);
  }, [resolvedEndpointUrl, dev]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getPointsLeaderboard = useCallback(
    async (count: number = 10): Promise<LeaderboardResponse> => {
      setIsLoading(true);
      setError(null);

      // In devMode, try API with short timeout, then fall back to mock data quickly
      if (resolvedDevMode) {
        try {
          // Quick attempt with 2 second timeout in devMode
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const result = await Promise.race([
            indexerClient.getPointsLeaderboard(count),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('DevMode timeout')), 2000);
            }),
          ]);

          clearTimeout(timeoutId);
          return result;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to get leaderboard';
          console.warn(
            '[DevMode] getPointsLeaderboard failed quickly, returning mock data:',
            errorMessage
          );
          setError(null); // Don't show error in devMode
          return IndexerMockData.getLeaderboard(count);
        } finally {
          setIsLoading(false);
        }
      }

      // Normal mode - full timeout and throw errors
      try {
        const result = await indexerClient.getPointsLeaderboard(count);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [indexerClient, resolvedDevMode]
  );

  const getPointsSiteStats =
    useCallback(async (): Promise<SiteStatsResponse> => {
      setIsLoading(true);
      setError(null);

      // In devMode, try API with short timeout, then fall back to mock data quickly
      if (resolvedDevMode) {
        try {
          // Quick attempt with 2 second timeout in devMode
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const result = await Promise.race([
            indexerClient.getPointsSiteStats(),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('DevMode timeout')), 2000);
            }),
          ]);

          clearTimeout(timeoutId);
          return result;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to get site stats';
          console.warn(
            '[DevMode] getPointsSiteStats failed quickly, returning mock data:',
            errorMessage
          );
          setError(null); // Don't show error in devMode
          return IndexerMockData.getSiteStats();
        } finally {
          setIsLoading(false);
        }
      }

      // Normal mode - full timeout and throw errors
      try {
        const result = await indexerClient.getPointsSiteStats();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get site stats';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, [indexerClient, devMode]);

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
