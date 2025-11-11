import { useCallback, useMemo, useState } from 'react';
import type { NetworkClient, Optional } from '@sudobility/types';
import type { ReferralStatsResponse } from '../network/IndexerClient';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Hook for getting referral statistics by referral code (public endpoint)
 * POST /referrals/:referralCode/stats
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and fetch function
 *
 * @example
 * ```typescript
 * const { stats, isLoading, error, fetchStats } = useIndexerReferralStats(
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Get referral statistics by code
 * await fetchStats('ABC123DEF');
 * console.log(stats?.data.totalReferred); // Number of referrals
 * console.log(stats?.data.referredWallets); // Array of referred wallets
 * ```
 */
export const useIndexerReferralStats = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean
) => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );
  const [stats, setStats] = useState<Optional<ReferralStatsResponse>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const fetchStats = useCallback(
    async (referralCode: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getReferralStats(referralCode);
        setStats(response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get referral stats';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStats(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      stats,
      isLoading,
      error,
      fetchStats,
      clearError,
      reset,
    }),
    [stats, isLoading, error, fetchStats, clearError, reset]
  );
};
