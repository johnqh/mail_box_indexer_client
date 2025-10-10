import { useCallback, useMemo } from 'react';
import { useIndexerReferralCode } from './useIndexerReferralCode';
import type { IndexerUserAuth } from '../types';

/**
 * Hook for managing referral code sharing
 * Combines referral code fetching with URL generation
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and share URL generator
 *
 * @example
 * ```typescript
 * const { getShareUrl, isLoading, error } = useIndexerReferralShare(
 *   'https://indexer.0xmail.box',
 *   false
 * );
 *
 * // Generate share URL with referral code
 * const shareUrl = await getShareUrl(
 *   'https://0xmail.box',
 *   walletAddress,
 *   { signature, message }
 * );
 * // Returns: "https://0xmail.box?referral=ABC123DEF"
 * ```
 */
export const useIndexerReferralShare = (endpointUrl: string, dev: boolean) => {
  const { referralCode, isLoading, error, fetchReferralCode } =
    useIndexerReferralCode(endpointUrl, dev);

  /**
   * Get referral code and append to share URL
   * @param baseUrl - The URL to share
   * @param walletAddress - User's wallet address
   * @param auth - Authentication credentials (signature and message)
   * @returns URL with referral code appended
   */
  const getShareUrl = useCallback(
    async (
      baseUrl: string,
      walletAddress: string,
      auth: IndexerUserAuth
    ): Promise<string> => {
      const response = await fetchReferralCode(walletAddress, auth);
      const url = new URL(baseUrl);
      url.searchParams.set('referral', response.data.referralCode);
      return url.toString();
    },
    [fetchReferralCode]
  );

  const code = referralCode?.data?.referralCode;

  return useMemo(
    () => ({
      referralCode: code,
      isLoading,
      error,
      getShareUrl,
    }),
    [code, isLoading, error, getShareUrl]
  );
};
