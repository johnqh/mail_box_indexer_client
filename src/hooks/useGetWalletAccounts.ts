import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type EmailAccountsResponse, type Optional } from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseGetWalletAccountsReturn {
  getWalletAccounts: (
    walletAddress: string,
    signature: string,
    message: string,
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
 * @param devMode - Whether to use mock data on errors
 * @returns Object with getWalletAccounts function and state
 */
export const useGetWalletAccounts = (
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
): UseGetWalletAccountsReturn => {
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
      referralCode,
    }: {
      walletAddress: string;
      signature: string;
      message: string;
      referralCode?: string;
    }): Promise<Optional<EmailAccountsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getWalletAccounts(
          walletAddress,
          signature,
          message,
          referralCode
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getWalletAccounts failed, returning mock data:',
            err
          );
          return IndexerMockData.getWalletAccounts(walletAddress);
        }
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
      signature: string,
      message: string,
      referralCode?: string
    ): Promise<Optional<EmailAccountsResponse>> => {
      const params: {
        walletAddress: string;
        signature: string;
        message: string;
        referralCode?: string;
      } = { walletAddress, signature, message };
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
