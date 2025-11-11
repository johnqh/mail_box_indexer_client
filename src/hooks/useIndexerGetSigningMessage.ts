import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  type IndexerSignInMessageResponse,
  type NetworkClient,
  type Optional,
} from '@sudobility/types';
import { IndexerClient } from '../network/IndexerClient';

interface UseIndexerGetSigningMessageReturn {
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<IndexerSignInMessageResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for getting signing message for wallet authentication
 * Public endpoint - no authentication required
 * Uses React Query useMutation to ensure fresh message each time (no caching)
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getSigningMessage function and state
 *
 * @note This uses useMutation instead of useQuery to always fetch fresh messages
 * without caching, even though it's a GET endpoint. This ensures each authentication
 * attempt gets a new signing message.
 */
export const useIndexerGetSigningMessage = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean = false
): UseIndexerGetSigningMessageReturn => {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, networkClient, dev),
    [endpointUrl, networkClient, dev]
  );
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const mutation = useMutation({
    mutationFn: async ({
      walletAddress,
      chainId,
      domain,
      url,
    }: {
      walletAddress: string;
      chainId: number;
      domain: string;
      url: string;
    }): Promise<Optional<IndexerSignInMessageResponse>> => {
      setError(null);
      try {
        return await client.getMessage(chainId, walletAddress, domain, url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get signing message';
        setError(errorMessage);
        throw err;
      }
    },
    retry: false,
  });

  const getSigningMessage = useCallback(
    async (
      walletAddress: string,
      chainId: number,
      domain: string,
      url: string
    ): Promise<Optional<IndexerSignInMessageResponse>> => {
      return await mutation.mutateAsync({
        walletAddress,
        chainId,
        domain,
        url,
      });
    },
    [mutation]
  );

  const isLoading = mutation.isPending;

  return useMemo(
    () => ({
      getSigningMessage,
      isLoading,
      error,
      clearError,
    }),
    [getSigningMessage, isLoading, error, clearError]
  );
};
