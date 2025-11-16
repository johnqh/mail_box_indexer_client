import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  type IndexerEmailAccountsResponse,
  type NetworkClient,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching wallet accounts from Indexer API
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param networkClient - Network client for making HTTP requests
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
 *   networkClient,
 *   'https://indexer.example.com',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress },
 *   referralCode
 * );
 *
 * if (data?.success) {
 *   // Access data.data.accounts
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetWalletAccounts = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  referralCode?: string,
  options?: UseQueryOptions<IndexerEmailAccountsResponse>
): UseQueryResult<IndexerEmailAccountsResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

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
    retry: false,
    ...options,
  });
};
