import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { type NetworkClient } from '@sudobility/types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Wallet permissions response data structure
 */
export interface WalletPermissionsData {
  walletAddress: string;
  chainId: number;
  permissions: string[];
  timestamp: string;
}

/**
 * Wallet permissions response
 */
export interface WalletPermissionsResponse {
  success: boolean;
  data: WalletPermissionsData;
  error?: string;
  timestamp: string;
}

/**
 * React hook for fetching wallet permissions
 * Uses React Query useQuery for automatic caching and refetching
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address to get permissions for
 * @param chainId - Chain ID
 * @param testNet - Whether this is a test network
 * @param options - Additional React Query options
 * @returns Query result with permissions data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useIndexerGetWalletPermissions(
 *   networkClient,
 *   'https://indexer.example.com',
 *   false,
 *   walletAddress,
 *   1,
 *   false
 * );
 *
 * if (data?.success) {
 *   // Access data.data.permissions
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useIndexerGetWalletPermissions = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  chainId: number,
  testNet: boolean = false,
  options?: Omit<
    UseQueryOptions<WalletPermissionsResponse>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<WalletPermissionsResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: [
      'indexer',
      'wallet-permissions',
      walletAddress,
      chainId,
      testNet,
    ],
    queryFn: async (): Promise<WalletPermissionsResponse> => {
      return await client.getWalletPermissions(walletAddress, chainId, testNet);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Default enabled check, but can be overridden by options
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!walletAddress && !!chainId,
    retry: false,
    ...options,
  });
};
