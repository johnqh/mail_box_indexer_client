import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  type IndexerPointsResponse,
  type NetworkClient,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching user's points balance
 * Requires wallet signature for authentication
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param networkClient - Network client for making HTTP requests
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
 *   networkClient,
 *   'https://indexer.0xmail.box',
 *   false,
 *   walletAddress,
 *   { signature, message, signer: walletAddress }
 * );
 *
 * if (data?.success) {
 *   // Access data.data.totalPoints
 *   // Access data.data.breakdown
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetPointsBalance = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerPointsResponse>
): UseQueryResult<IndexerPointsResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'points-balance', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerPointsResponse> => {
      return await client.getPointsBalance(walletAddress, auth);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - points change frequently
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    retry: false,
    ...options,
  });
};
