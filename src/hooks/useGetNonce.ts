import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type NonceResponse, type Optional } from '@johnqh/types';
import type { SignatureAuth } from '../types';

interface UseGetNonceReturn {
  getNonce: (
    username: string,
    auth: SignatureAuth
  ) => Promise<Optional<NonceResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for getting existing authentication nonce
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getNonce function and state
 */
export const useGetNonce = (
  endpointUrl: string,
  dev: boolean = false
): UseGetNonceReturn => {
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
      username,
      auth,
    }: {
      username: string;
      auth: SignatureAuth;
    }): Promise<Optional<NonceResponse>> => {
      setError(null);
      try {
        return await indexerClient.getNonce(username, auth);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get nonce';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getNonce = useCallback(
    async (
      username: string,
      auth: SignatureAuth
    ): Promise<Optional<NonceResponse>> => {
      return await mutation.mutateAsync({ username, auth });
    },
    [mutation]
  );

  return {
    getNonce,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
