import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type Optional, type PointsResponse } from '@johnqh/types';
import type { SignatureAuth } from '../types';

interface UseGetPointsBalanceReturn {
  getPointsBalance: (
    walletAddress: string,
    auth: SignatureAuth
  ) => Promise<Optional<PointsResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for fetching user's points balance
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getPointsBalance function and state
 */
export const useGetPointsBalance = (
  endpointUrl: string,
  dev: boolean = false
): UseGetPointsBalanceReturn => {
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
    }): Promise<Optional<PointsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsBalance(walletAddress, auth);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get points balance';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getPointsBalance = useCallback(
    async (
      walletAddress: string,
      auth: SignatureAuth
    ): Promise<Optional<PointsResponse>> => {
      return await mutation.mutateAsync({ walletAddress, auth });
    },
    [mutation]
  );

  return {
    getPointsBalance,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
