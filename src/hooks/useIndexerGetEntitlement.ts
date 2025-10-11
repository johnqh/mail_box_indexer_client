import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type IndexerEntitlementResponse } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for checking wallet entitlement status
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address to check
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with entitlement data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetEntitlement(
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success) {
 *   console.log('Has Entitlement:', data.data.hasEntitlement);
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetEntitlement = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerEntitlementResponse>
): UseQueryResult<IndexerEntitlementResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'entitlement', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerEntitlementResponse> => {
      return await client.getEntitlement(walletAddress, auth);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - entitlements don't change often
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
