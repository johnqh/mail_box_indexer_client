import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type Optional, type SignInMessageResponse } from '@johnqh/types';

interface UseIndexerGetSigningMessageReturn {
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for getting signing message for wallet authentication
 * Public endpoint - no authentication required
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getSigningMessage function and state
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
    }): Promise<Optional<SignInMessageResponse>> => {
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
    ): Promise<Optional<SignInMessageResponse>> => {
      return await mutation.mutateAsync({
        walletAddress,
        chainId,
        domain,
        url,
      });
    },
    [mutation]
  );

  return {
    getSigningMessage,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
