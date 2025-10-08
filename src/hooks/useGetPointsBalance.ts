import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type Optional, type PointsResponse } from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseGetPointsBalanceReturn {
  getPointsBalance: (
    walletAddress: string,
    signature: string,
    message: string
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
 * @param devMode - Whether to use mock data on errors
 * @returns Object with getPointsBalance function and state
 */
export const useGetPointsBalance = (
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
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
      signature,
      message,
    }: {
      walletAddress: string;
      signature: string;
      message: string;
    }): Promise<Optional<PointsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsBalance(
          walletAddress,
          signature,
          message
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getPointsBalance failed, returning mock data:',
            err
          );
          return IndexerMockData.getPointsBalance(walletAddress);
        }
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
      signature: string,
      message: string
    ): Promise<Optional<PointsResponse>> => {
      return await mutation.mutateAsync({ walletAddress, signature, message });
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
