import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import {
  type IndexerSignInMessageResponse,
  type Optional,
} from '@johnqh/types';

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
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getSigningMessage function and state
 *
 * @note This uses useMutation instead of useQuery to always fetch fresh messages
 * without caching, even though it's a GET endpoint. This ensures each authentication
 * attempt gets a new signing message.
 */
export const useIndexerGetSigningMessage = (
  endpointUrl: string,
  dev: boolean = false
): UseIndexerGetSigningMessageReturn => {
  const [error, setError] = useState<Optional<string>>(null);

  const indexerClient = useMemo(
    () => new IndexerClient(endpointUrl, dev),
    [endpointUrl, dev]
  );

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
        return await indexerClient.getMessage(
          chainId,
          walletAddress,
          domain,
          url
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get signing message';
        setError(errorMessage);
        throw err;
      }
    },
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
