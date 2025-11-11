import { useCallback, useMemo, useState } from 'react';
import { type NetworkClient, type Optional } from '@sudobility/types';
import type { ReferralCodeResponse } from '../network/IndexerClient';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Hook for getting or creating referral code for a wallet
 * POST /wallets/:walletAddress/referral
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and fetch function
 *
 * @example
 * ```typescript
 * const { referralCode, isLoading, error, fetchReferralCode } = useIndexerReferralCode(
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Get or create referral code
 * await fetchReferralCode(walletAddress, { signature, message, signer: walletAddress });
 * // Access referralCode?.referralCode - e.g., "ABC123DEF"
 * ```
 */
export const useIndexerReferralCode = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean
) => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );
  const [referralCode, setReferralCode] =
    useState<Optional<ReferralCodeResponse>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const fetchReferralCode = useCallback(
    async (walletAddress: string, auth: IndexerUserAuth) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getReferralCode(walletAddress, auth);
        setReferralCode(response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get referral code';
        setError(errorMessage);
        console.error('[useIndexerReferralCode]', errorMessage, err);
        return undefined;
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
    setReferralCode(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      referralCode,
      isLoading,
      error,
      fetchReferralCode,
      clearError,
      reset,
    }),
    [referralCode, isLoading, error, fetchReferralCode, clearError, reset]
  );
};
