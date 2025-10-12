import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type IndexerDelegatedToResponse } from '@sudobility/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for fetching delegation info (who this wallet delegates to)
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address (delegator)
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with delegation data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetDelegatedTo(
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success && data.data.hasDelegation) {
 *   console.log('Delegated to:', data.data.delegatedTo.address);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetDelegatedTo = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerDelegatedToResponse>
): UseQueryResult<IndexerDelegatedToResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'delegated-to', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerDelegatedToResponse> => {
      return await client.getDelegatedTo(walletAddress, auth);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
