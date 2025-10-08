import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type DelegatedFromResponse, type Optional } from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseGetDelegatedFromReturn {
  getDelegatedFrom: (
    walletAddress: string,
    signature: string,
    message: string
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
 * @param devMode - Whether to use mock data on errors
 * @returns Object with getDelegatedFrom function and state
 */
export const useGetDelegatedFrom = (
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
): UseGetDelegatedFromReturn => {
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
      signature,
      message,
    }: {
      walletAddress: string;
      signature: string;
      message: string;
    }): Promise<Optional<DelegatedFromResponse>> => {
      setError(null);
      try {
        return await indexerClient.getDelegatedFrom(
          walletAddress,
          signature,
          message
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getDelegatedFrom failed, returning mock data:',
            err
          );
          return IndexerMockData.getDelegatedFrom(walletAddress);
        }
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
      signature: string,
      message: string
    ): Promise<Optional<DelegatedFromResponse>> => {
      return await mutation.mutateAsync({ walletAddress, signature, message });
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
