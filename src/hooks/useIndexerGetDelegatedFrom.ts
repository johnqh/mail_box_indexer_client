import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  type IndexerDelegatedFromResponse,
  type NetworkClient,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching reverse delegation info (who delegates to this wallet)
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address (delegate)
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with delegators data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetDelegatedFrom(
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success) {
 *   console.log('Delegators:', data.data.delegations);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetDelegatedFrom = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: Omit<
    UseQueryOptions<IndexerDelegatedFromResponse>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<IndexerDelegatedFromResponse> => {
  const client = new IndexerClient(endpointUrl, networkClient, dev);

  return useQuery({
    queryKey: ['indexer', 'delegated-from', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerDelegatedFromResponse> => {
      return await client.getDelegatedFrom(walletAddress, auth);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Default enabled check, but can be overridden by options
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
