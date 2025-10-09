import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type DelegatedFromResponse, type Optional } from '@johnqh/types';
import type { IndexerAuth } from '../types';

interface UseIndexerGetDelegatedFromReturn {
  getDelegatedFrom: (
    walletAddress: string,
    auth: IndexerAuth
  ) => Promise<Optional<DelegatedFromResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for fetching reverse delegation info (who delegates to this wallet)
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getDelegatedFrom function and state
 */
export const useIndexerGetDelegatedFrom = (
  endpointUrl: string,
  dev: boolean = false
): UseIndexerGetDelegatedFromReturn => {
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
      auth,
    }: {
      walletAddress: string;
      auth: IndexerAuth;
    }): Promise<Optional<DelegatedFromResponse>> => {
      setError(null);
      try {
        return await indexerClient.getDelegatedFrom(walletAddress, auth);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get delegated from';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getDelegatedFrom = useCallback(
    async (
      walletAddress: string,
      auth: IndexerAuth
    ): Promise<Optional<DelegatedFromResponse>> => {
      return await mutation.mutateAsync({ walletAddress, auth });
    },
    [mutation]
  );

  return {
    getDelegatedFrom,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
