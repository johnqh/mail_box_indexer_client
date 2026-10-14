import { useMemo } from 'react';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type { NetworkClient } from '@sudobility/types';
import type { IndexerCustomAddressResponse } from '@sudobility/mail_box_types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * React hook for fetching a wallet's custom (user-defined) address state -- the
 * active custom address, if any, and the remaining set allowance. Requires a
 * wallet signature. Uses React Query for caching and refetching.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param walletAddress - Wallet address to query
 * @param auth - Authentication credentials (signature and message)
 * @param options - Additional React Query options
 * @returns Query result with the custom address state
 */
export const useIndexerGetCustomAddress = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  auth: IndexerUserAuth,
  options?: UseQueryOptions<IndexerCustomAddressResponse>
): UseQueryResult<IndexerCustomAddressResponse> => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );

  return useQuery({
    queryKey: ['indexer', 'custom-address', walletAddress, auth.signature],
    queryFn: async (): Promise<IndexerCustomAddressResponse> => {
      return await client.getCustomAddress(walletAddress, auth);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!walletAddress && !!auth.signature && !!auth.message,
    retry: false,
    ...options,
  });
};
