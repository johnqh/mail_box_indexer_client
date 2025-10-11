import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type IndexerNonceResponse } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for getting existing authentication nonce
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param username - Email username (without @domain)
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with nonce data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetNonce(
 *   'https://indexer.0xmail.box',
 *   false,
 *   'myuser',
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success) {
 *   console.log('Nonce:', data.data.nonce);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetNonce = (
  endpointUrl: string,
  dev: boolean,
  username: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerNonceResponse>
): UseQueryResult<IndexerNonceResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'nonce', username, auth.signature],
    queryFn: async (): Promise<IndexerNonceResponse> => {
      return await client.getNonce(username, auth);
    },
    staleTime: 1 * 60 * 1000, // 1 minute - nonces are short-lived
    enabled: !!username && !!auth.signature && !!auth.message,
    ...options,
  });
};
