import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import {
  type AddressValidationResponse,
  type DelegatedFromResponse,
  type DelegatedToResponse,
  type EmailAccountsResponse,
  type EntitlementResponse,
  type LeaderboardResponse,
  type NonceResponse,
  type Optional,
  type PointsResponse,
  type SignInMessageResponse,
  type SiteStatsResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseIndexerMailReturn {
  isLoading: boolean;
  error: Optional<string>;
  // Public endpoints (no auth required)
  validateUsername: (
    username: string
  ) => Promise<Optional<AddressValidationResponse>>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  getPointsLeaderboard: (
    count?: number
  ) => Promise<Optional<LeaderboardResponse>>;
  getPointsSiteStats: () => Promise<Optional<SiteStatsResponse>>;
  // Signature-protected endpoints
  getWalletAccounts: (
    walletAddress: string,
    signature: string,
    message: string,
    referralCode?: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  getDelegatedTo: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedToResponse>>;
  getDelegatedFrom: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedFromResponse>>;
  createNonce: (
    username: string,
    signature: string,
    message: string
  ) => Promise<Optional<NonceResponse>>;
  getNonce: (
    username: string,
    signature: string,
    message: string
  ) => Promise<Optional<NonceResponse>>;
  getEntitlement: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<EntitlementResponse>>;
  getPointsBalance: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<PointsResponse>>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 * Includes both public endpoints and signature-protected endpoints
 * Uses React Query for better state management, caching, and error handling
 * Note: IP-restricted endpoints (using IPHelper) are not included as they're only accessible from WildDuck server
 */
const useIndexerMail = (
  endpointUrl: string,
  dev: boolean = false,
  devMode: boolean = false
): UseIndexerMailReturn => {
  const [error, setError] = useState<Optional<string>>(null);

  // Memoize indexerClient to prevent recreation on every render
  const indexerClient = useMemo(
    () => new IndexerClient(endpointUrl, dev),
    [endpointUrl, dev]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mutation for validateUsername
  const validateUsernameMutation = useMutation({
    mutationFn: async (
      username: string
    ): Promise<Optional<AddressValidationResponse>> => {
      setError(null);
      try {
        return await indexerClient.validateUsername(username);
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] validateUsername failed, returning mock data:',
            err
          );
          return IndexerMockData.getValidation(username);
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Validation failed';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getSigningMessage
  const getSigningMessageMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      chainId,
      domain,
      url,
    }: {
      walletAddress: string;
      chainId: number;
      domain: string;
      url: string;
    }): Promise<Optional<SignInMessageResponse>> => {
      setError(null);
      try {
        return await indexerClient.getMessage(
          chainId,
          walletAddress,
          domain,
          url
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getSigningMessage failed, returning mock data:',
            err
          );
          return IndexerMockData.getSigningMessage(
            walletAddress,
            chainId,
            domain
          );
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get signing message';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getPointsLeaderboard
  const getPointsLeaderboardMutation = useMutation({
    mutationFn: async (
      count: number = 10
    ): Promise<Optional<LeaderboardResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsLeaderboard(count);
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getPointsLeaderboard failed, returning mock data:',
            err
          );
          return IndexerMockData.getLeaderboard();
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getPointsSiteStats
  const getPointsSiteStatsMutation = useMutation({
    mutationFn: async (): Promise<Optional<SiteStatsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsSiteStats();
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getPointsSiteStats failed, returning mock data:',
            err
          );
          return IndexerMockData.getSiteStats();
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get site stats';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getWalletAccounts
  const getWalletAccountsMutation = useMutation({
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

  // Mutation for getDelegatedTo
  const getDelegatedToMutation = useMutation({
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

  // Mutation for getDelegatedFrom
  const getDelegatedFromMutation = useMutation({
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

  // Mutation for createNonce
  const createNonceMutation = useMutation({
    mutationFn: async ({
      username,
      signature,
      message,
    }: {
      username: string;
      signature: string;
      message: string;
    }): Promise<Optional<NonceResponse>> => {
      setError(null);
      try {
        return await indexerClient.createNonce(username, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] createNonce failed, returning mock data:',
            err
          );
          return IndexerMockData.createNonce(username);
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create nonce';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getNonce
  const getNonceMutation = useMutation({
    mutationFn: async ({
      username,
      signature,
      message,
    }: {
      username: string;
      signature: string;
      message: string;
    }): Promise<Optional<NonceResponse>> => {
      setError(null);
      try {
        return await indexerClient.getNonce(username, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getNonce failed, returning mock data:', err);
          return IndexerMockData.getNonce(username);
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get nonce';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getEntitlement
  const getEntitlementMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      signature,
      message,
    }: {
      walletAddress: string;
      signature: string;
      message: string;
    }): Promise<Optional<EntitlementResponse>> => {
      setError(null);
      try {
        return await indexerClient.getEntitlement(
          walletAddress,
          signature,
          message
        );
      } catch (err) {
        if (devMode) {
          console.warn(
            '[DevMode] getEntitlement failed, returning mock data:',
            err
          );
          return IndexerMockData.getEntitlement(walletAddress);
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get entitlement';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getPointsBalance
  const getPointsBalanceMutation = useMutation({
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

  // Wrapper functions
  const validateUsername = useCallback(
    async (username: string): Promise<Optional<AddressValidationResponse>> => {
      return await validateUsernameMutation.mutateAsync(username);
    },
    [validateUsernameMutation]
  );

  const getSigningMessage = useCallback(
    async (
      walletAddress: string,
      chainId: number,
      domain: string,
      url: string
    ): Promise<Optional<SignInMessageResponse>> => {
      return await getSigningMessageMutation.mutateAsync({
        walletAddress,
        chainId,
        domain,
        url,
      });
    },
    [getSigningMessageMutation]
  );

  const getPointsLeaderboard = useCallback(
    async (count: number = 10): Promise<Optional<LeaderboardResponse>> => {
      return await getPointsLeaderboardMutation.mutateAsync(count);
    },
    [getPointsLeaderboardMutation]
  );

  const getPointsSiteStats = useCallback(async (): Promise<
    Optional<SiteStatsResponse>
  > => {
    return await getPointsSiteStatsMutation.mutateAsync();
  }, [getPointsSiteStatsMutation]);

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
      return await getWalletAccountsMutation.mutateAsync(params);
    },
    [getWalletAccountsMutation]
  );

  const getDelegatedTo = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<Optional<DelegatedToResponse>> => {
      return await getDelegatedToMutation.mutateAsync({
        walletAddress,
        signature,
        message,
      });
    },
    [getDelegatedToMutation]
  );

  const getDelegatedFrom = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<Optional<DelegatedFromResponse>> => {
      return await getDelegatedFromMutation.mutateAsync({
        walletAddress,
        signature,
        message,
      });
    },
    [getDelegatedFromMutation]
  );

  const createNonce = useCallback(
    async (
      username: string,
      signature: string,
      message: string
    ): Promise<Optional<NonceResponse>> => {
      return await createNonceMutation.mutateAsync({
        username,
        signature,
        message,
      });
    },
    [createNonceMutation]
  );

  const getNonce = useCallback(
    async (
      username: string,
      signature: string,
      message: string
    ): Promise<Optional<NonceResponse>> => {
      return await getNonceMutation.mutateAsync({
        username,
        signature,
        message,
      });
    },
    [getNonceMutation]
  );

  const getEntitlement = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<Optional<EntitlementResponse>> => {
      return await getEntitlementMutation.mutateAsync({
        walletAddress,
        signature,
        message,
      });
    },
    [getEntitlementMutation]
  );

  const getPointsBalance = useCallback(
    async (
      walletAddress: string,
      signature: string,
      message: string
    ): Promise<Optional<PointsResponse>> => {
      return await getPointsBalanceMutation.mutateAsync({
        walletAddress,
        signature,
        message,
      });
    },
    [getPointsBalanceMutation]
  );

  const isLoading =
    validateUsernameMutation.isPending ||
    getSigningMessageMutation.isPending ||
    getPointsLeaderboardMutation.isPending ||
    getPointsSiteStatsMutation.isPending ||
    getWalletAccountsMutation.isPending ||
    getDelegatedToMutation.isPending ||
    getDelegatedFromMutation.isPending ||
    createNonceMutation.isPending ||
    getNonceMutation.isPending ||
    getEntitlementMutation.isPending ||
    getPointsBalanceMutation.isPending;

  return {
    isLoading,
    error,
    // Public endpoints
    validateUsername,
    getSigningMessage,
    getPointsLeaderboard,
    getPointsSiteStats,
    // Signature-protected endpoints
    getWalletAccounts,
    getDelegatedTo,
    getDelegatedFrom,
    createNonce,
    getNonce,
    getEntitlement,
    getPointsBalance,
    clearError,
  };
};

export { useIndexerMail, type UseIndexerMailReturn };
