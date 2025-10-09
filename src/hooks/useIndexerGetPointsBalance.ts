import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type PointsResponse } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

/**
 * React hook for fetching user's points balance
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address to query
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with points balance data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetPointsBalance(
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message }
 * );
 *
 * if (data?.success) {
 *   console.log('Total Points:', data.data.totalPoints);
 *   console.log('Breakdown:', data.data.breakdown);
 * }
 * ```
 */
export const useIndexerGetPointsBalance = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<PointsResponse>
): UseQueryResult<PointsResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'points-balance', walletAddress, auth.signature],
    queryFn: async (): Promise<PointsResponse> => {
      return await client.getPointsBalance(walletAddress, auth);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - points change frequently
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    ...options,
  });
};
