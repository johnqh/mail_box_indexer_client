import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type IndexerDelegatedFromResponse } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for fetching reverse delegation info (who delegates to this wallet)
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address (delegate)
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with delegators data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useIndexerGetDelegatedFrom(
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message }
 * );
 *
 * if (data?.success) {
 *   console.log('Delegators:', data.data.delegations);
 * }
 * ```
 */
export const useIndexerGetDelegatedFrom = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerDelegatedFromResponse>
): UseQueryResult<IndexerDelegatedFromResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'delegated-from', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerDelegatedFromResponse> => {
      return await client.getDelegatedFrom(walletAddress, auth);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
