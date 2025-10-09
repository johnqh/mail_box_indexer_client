import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type IndexerEmailAccountsResponse } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for fetching wallet accounts from Indexer API
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address to query
 * @param auth - Authentication credentials (signature and message)
 * @param referralCode - Optional referral code for new user registration
 * @param options - Additional React Query options
 * @returns Query result with wallet accounts data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetWalletAccounts(
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message },
 *   referralCode
 * );
 *
 * if (data?.success) {
 *   console.log('Accounts:', data.data.accounts);
 * }
 * ```
 */
export const useIndexerGetWalletAccounts = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  referralCode?: string,
  options?: UseQueryOptions<IndexerEmailAccountsResponse>
): UseQueryResult<IndexerEmailAccountsResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: [
      'indexer',
      'wallet-accounts',
      walletAddress,
      auth.signature,
      referralCode,
    ],
    queryFn: async (): Promise<IndexerEmailAccountsResponse> => {
      return await client.getWalletAccounts(walletAddress, auth, referralCode);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
