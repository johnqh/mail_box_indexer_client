import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  type IndexerNonceResponse,
  type NetworkClient,
  type Optional,
} from '@sudobility/types';
import type { IndexerUserAuth } from '../types';
import { IndexerClient } from '../network/IndexerClient';

interface UseIndexerCreateNonceReturn {
  createNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerNonceResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for creating authentication nonce
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param networkClient - Network client for making HTTP requests
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with createNonce function and state
 */
export const useIndexerCreateNonce = (
  networkClient: NetworkClient,
  endpointUrl: string,
  dev: boolean = false
): UseIndexerCreateNonceReturn => {
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
      username,
      auth,
    }: {
      username: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerNonceResponse>> => {
      setError(null);
      try {
        return await client.createNonce(username, auth);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create nonce';
        setError(errorMessage);
        throw err;
      }
    },
    retry: false,
  });

  const createNonce = useCallback(
    async (
      username: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerNonceResponse>> => {
      return await mutation.mutateAsync({ username, auth });
    },
    [mutation]
  );

  const isLoading = mutation.isPending;

  return useMemo(
    () => ({
      createNonce,
      isLoading,
      error,
      clearError,
    }),
    [createNonce, isLoading, error, clearError]
  );
};
