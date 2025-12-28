import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type { NetworkClient } from '@sudobility/types';
import type { IndexerDelegatedToResponse } from '@sudobility/mail_box_types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching delegation info (who this wallet delegates to)
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param networkClient - Network client for making HTTP requests
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
 *   networkClient,
 *   'https://indexer.example.com',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success && data.data.hasDelegation) {
 *   // Access data.data.delegatedTo.address
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetDelegatedTo = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: Omit<
    UseQueryOptions<IndexerDelegatedToResponse>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<IndexerDelegatedToResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'delegated-to', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerDelegatedToResponse> => {
      return await client.getDelegatedTo(walletAddress, auth);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Default enabled check, but can be overridden by options
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!walletAddress && !!auth.signature && !!auth.message,
    retry: false,
    ...options,
  });
};
