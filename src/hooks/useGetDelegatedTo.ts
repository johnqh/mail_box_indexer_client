import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type DelegatedToResponse, type Optional } from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseGetDelegatedToReturn {
  getDelegatedTo: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedToResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for fetching delegation info (who this wallet delegates to)
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @param devMode - Whether to use mock data on errors
 * @returns Object with getDelegatedTo function and state
 */
export const useGetDelegatedTo = (
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
): UseGetDelegatedToReturn => {
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
    }): Promise<Optional<DelegatedToResponse>> => {
      setError(null);
      try {
        return await indexerClient.getDelegatedTo(
          walletAddress,
          signature,
          message
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getDelegatedTo failed, returning mock data:',
            err
          );
          return IndexerMockData.getDelegatedTo(walletAddress);
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get delegated to';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getDelegatedTo = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<Optional<DelegatedToResponse>> => {
      return await mutation.mutateAsync({ walletAddress, signature, message });
    },
    [mutation]
  );

  return {
    getDelegatedTo,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
