import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type DelegatedToResponse, type Optional } from '@johnqh/types';
import type { SignatureAuth } from '../types';

interface UseGetDelegatedToReturn {
  getDelegatedTo: (
    walletAddress: string,
    auth: SignatureAuth
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
 * @returns Object with getDelegatedTo function and state
 */
export const useGetDelegatedTo = (
  endpointUrl: string,
  dev: boolean = false
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
      auth,
    }: {
      walletAddress: string;
      auth: SignatureAuth;
    }): Promise<Optional<DelegatedToResponse>> => {
      setError(null);
      try {
        return await indexerClient.getDelegatedTo(walletAddress, auth);
      } catch (err) {
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
      auth: SignatureAuth
    ): Promise<Optional<DelegatedToResponse>> => {
      return await mutation.mutateAsync({ walletAddress, auth });
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
