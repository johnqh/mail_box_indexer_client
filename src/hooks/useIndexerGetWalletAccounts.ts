import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type EmailAccountsResponse, type Optional } from '@johnqh/types';
import type { IndexerUserAuth } from '../types';

interface UseIndexerGetWalletAccountsReturn {
  getWalletAccounts: (
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for fetching wallet accounts from Indexer API
 * Requires wallet signature for authentication
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with getWalletAccounts function and state
 */
export const useIndexerGetWalletAccounts = (
  endpointUrl: string,
  dev: boolean = false
): UseIndexerGetWalletAccountsReturn => {
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
      referralCode,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
      referralCode?: string;
    }): Promise<Optional<EmailAccountsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getWalletAccounts(
          walletAddress,
          auth,
          referralCode
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get wallet accounts';
        setError(errorMessage);
        throw err;
      }
    },
  });

  const getWalletAccounts = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      referralCode?: string
    ): Promise<Optional<EmailAccountsResponse>> => {
      const params: {
        walletAddress: string;
        auth: IndexerUserAuth;
        referralCode?: string;
      } = { walletAddress, auth };
      if (referralCode !== undefined) {
        params.referralCode = referralCode;
      }
      return await mutation.mutateAsync(params);
    },
    [mutation]
  );

  return {
    getWalletAccounts,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
