import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type {
  IndexerNameResolutionResponse,
  IndexerNameServiceResponse,
  NetworkClient,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

// Query stale times (5 minutes for name service resolution)
const STALE_TIMES = {
  NAME_SERVICE_RESOLUTION: 5 * 60 * 1000,
};

/**
 * Hook to get all ENS/SNS names for a wallet address (signature-protected)
 * GET /wallets/:walletAddress/names
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @param walletAddress - Wallet address to query names for
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with names data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useWalletNames(
 *   networkClient,
 *   'https://indexer.example.com',
 *   false,
 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   { signature, message, signer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' }
 * );
 *
 * if (data?.success) {
 *   // Access data.data.names - array of names like ['vitalik.eth', 'example.eth']
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useWalletNames = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerNameServiceResponse>
): UseQueryResult<IndexerNameServiceResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'wallet-names', walletAddress],
    queryFn: async (): Promise<IndexerNameServiceResponse> => {
      return await client.getWalletNames(walletAddress, auth);
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    retry: false,
    ...options,
  });
};

/**
 * Hook to resolve ENS/SNS name to wallet address (public endpoint)
 * GET /wallets/named/:name
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @param name - ENS/SNS name to resolve
 * @param options - Additional React Query options
 * @returns Query result with wallet data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useResolveNameToAddress(
 *   networkClient,
 *   'https://indexer.example.com',
 *   false,
 *   'vitalik.eth'
 * );
 *
 * if (data?.success) {
 *   // Access data.data.address
 *   // Access data.data.chainType
 * }
 *
 * // Force refresh the data
 * await refetch();
 * ```
 */
export const useResolveNameToAddress = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  name: string,
  options?: UseQueryOptions<IndexerNameResolutionResponse>
): UseQueryResult<IndexerNameResolutionResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'resolve-name', name],
    queryFn: async (): Promise<IndexerNameResolutionResponse> => {
      return await client.resolveNameToAddress(name);
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!name,
    retry: false,
    ...options,
  });
};
