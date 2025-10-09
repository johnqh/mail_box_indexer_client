import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type EntitlementResponse, type Optional } from '@johnqh/types';
import type { SignatureAuth } from '../types';

interface UseGetEntitlementReturn {
  getEntitlement: (
    walletAddress: string,
    auth: SignatureAuth
  ) => Promise<Optional<EntitlementResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for checking wallet entitlement status
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getEntitlement function and state
 */
export const useGetEntitlement = (
  endpointUrl: string,
  dev: boolean = false
): UseGetEntitlementReturn => {
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
    }): Promise<Optional<EntitlementResponse>> => {
      setError(null);
      try {
        return await indexerClient.getEntitlement(walletAddress, auth);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get entitlement';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getEntitlement = useCallback(
    async (
      walletAddress: string,
      auth: SignatureAuth
    ): Promise<Optional<EntitlementResponse>> => {
      return await mutation.mutateAsync({ walletAddress, auth });
    },
    [mutation]
  );

  return {
    getEntitlement,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
