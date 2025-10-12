import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import type { IndexerUserAuth } from '../types';
import {
  type IndexerAddressValidationResponse,
  type IndexerDelegatedFromResponse,
  type IndexerDelegatedToResponse,
  type IndexerEmailAccountsResponse,
  type IndexerEntitlementResponse,
  type IndexerLeaderboardResponse,
  type IndexerNonceResponse,
  type IndexerPointsResponse,
  type IndexerSignInMessageResponse,
  type IndexerSiteStatsResponse,
  type Optional,
} from '@sudobility/types';

interface UseIndexerMailReturn {
  isLoading: boolean;
  error: Optional<string>;
  // Public endpoints (no auth required)
  validateUsername: (
    username: string
  ) => Promise<Optional<IndexerAddressValidationResponse>>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<IndexerSignInMessageResponse>>;
  getPointsLeaderboard: (
    count?: number
  ) => Promise<Optional<IndexerLeaderboardResponse>>;
  getPointsSiteStats: () => Promise<Optional<IndexerSiteStatsResponse>>;
  // Signature-protected endpoints
  getWalletAccounts: (
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ) => Promise<Optional<IndexerEmailAccountsResponse>>;
  getDelegatedTo: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerDelegatedToResponse>>;
  getDelegatedFrom: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerDelegatedFromResponse>>;
  createNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerNonceResponse>>;
  getNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerNonceResponse>>;
  getEntitlement: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerEntitlementResponse>>;
  getPointsBalance: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<IndexerPointsResponse>>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 * Includes both public endpoints and signature-protected endpoints
 * Uses React Query for better state management, caching, and error handling
 * Note: IP-restricted endpoints (using IPHelper) are not included as they're only accessible from WildDuck server
 *
 * @deprecated This legacy monolithic hook is kept for backward compatibility only.
 * For new code, use the individual hooks instead:
 * - useIndexerValidateUsername (GET)
 * - useIndexerGetSigningMessage (GET)
 * - useIndexerPointsLeaderboard (GET)
 * - useIndexerPointsSiteStats (GET)
 * - useIndexerGetWalletAccounts (GET)
 * - useIndexerGetDelegatedTo (GET)
 * - useIndexerGetDelegatedFrom (GET)
 * - useIndexerCreateNonce (POST)
 * - useIndexerGetNonce (GET)
 * - useIndexerGetEntitlement (GET)
 * - useIndexerGetPointsBalance (GET)
 *
 * The individual hooks use React Query's useQuery for GET endpoints (with automatic caching)
 * and useMutation for POST endpoints, following React Query best practices.
 */
const useIndexerMail = (
  endpointUrl: string,
  dev: boolean = false
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
    ): Promise<Optional<IndexerAddressValidationResponse>> => {
      setError(null);
      try {
        return await indexerClient.validateUsername(username);
      } catch (err) {
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
    }): Promise<Optional<IndexerSignInMessageResponse>> => {
      setError(null);
      try {
        return await indexerClient.getMessage(
          chainId,
          walletAddress,
          domain,
          url
        );
      } catch (err) {
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
    ): Promise<Optional<IndexerLeaderboardResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsLeaderboard(count);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get leaderboard';
        setError(errorMessage);
        throw err;
      }
    },
  });

  // Mutation for getPointsSiteStats
  const getPointsSiteStatsMutation = useMutation({
    mutationFn: async (): Promise<Optional<IndexerSiteStatsResponse>> => {
      setError(null);
      try {
        return await indexerClient.getPointsSiteStats();
      } catch (err) {
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
      auth,
      referralCode,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
      referralCode?: string;
    }): Promise<Optional<IndexerEmailAccountsResponse>> => {
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

  // Mutation for getDelegatedTo
  const getDelegatedToMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      auth,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerDelegatedToResponse>> => {
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

  // Mutation for getDelegatedFrom
  const getDelegatedFromMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      auth,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerDelegatedFromResponse>> => {
      setError(null);
      try {
        return await indexerClient.getDelegatedFrom(walletAddress, auth);
      } catch (err) {
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
      auth,
    }: {
      username: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerNonceResponse>> => {
      setError(null);
      try {
        return await indexerClient.createNonce(username, auth);
      } catch (err) {
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
      auth,
    }: {
      username: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerNonceResponse>> => {
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

  // Mutation for getEntitlement
  const getEntitlementMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      auth,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerEntitlementResponse>> => {
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

  // Mutation for getPointsBalance
  const getPointsBalanceMutation = useMutation({
    mutationFn: async ({
      walletAddress,
      auth,
    }: {
      walletAddress: string;
      auth: IndexerUserAuth;
    }): Promise<Optional<IndexerPointsResponse>> => {
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

  // Wrapper functions
  const validateUsername = useCallback(
    async (
      username: string
    ): Promise<Optional<IndexerAddressValidationResponse>> => {
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
    ): Promise<Optional<IndexerSignInMessageResponse>> => {
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
    async (
      count: number = 10
    ): Promise<Optional<IndexerLeaderboardResponse>> => {
      return await getPointsLeaderboardMutation.mutateAsync(count);
    },
    [getPointsLeaderboardMutation]
  );

  const getPointsSiteStats = useCallback(async (): Promise<
    Optional<IndexerSiteStatsResponse>
  > => {
    return await getPointsSiteStatsMutation.mutateAsync();
  }, [getPointsSiteStatsMutation]);

  const getWalletAccounts = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      referralCode?: string
    ): Promise<Optional<IndexerEmailAccountsResponse>> => {
      const params: {
        walletAddress: string;
        auth: IndexerUserAuth;
        referralCode?: string;
      } = { walletAddress, auth };
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
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerDelegatedToResponse>> => {
      return await getDelegatedToMutation.mutateAsync({
        walletAddress,
        auth,
      });
    },
    [getDelegatedToMutation]
  );

  const getDelegatedFrom = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerDelegatedFromResponse>> => {
      return await getDelegatedFromMutation.mutateAsync({
        walletAddress,
        auth,
      });
    },
    [getDelegatedFromMutation]
  );

  const createNonce = useCallback(
    async (
      username: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerNonceResponse>> => {
      return await createNonceMutation.mutateAsync({
        username,
        auth,
      });
    },
    [createNonceMutation]
  );

  const getNonce = useCallback(
    async (
      username: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerNonceResponse>> => {
      return await getNonceMutation.mutateAsync({
        username,
        auth,
      });
    },
    [getNonceMutation]
  );

  const getEntitlement = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerEntitlementResponse>> => {
      return await getEntitlementMutation.mutateAsync({
        walletAddress,
        auth,
      });
    },
    [getEntitlementMutation]
  );

  const getPointsBalance = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth
    ): Promise<Optional<IndexerPointsResponse>> => {
      return await getPointsBalanceMutation.mutateAsync({
        walletAddress,
        auth,
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

  return useMemo(
    () => ({
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
    }),
    [
      isLoading,
      error,
      validateUsername,
      getSigningMessage,
      getPointsLeaderboard,
      getPointsSiteStats,
      getWalletAccounts,
      getDelegatedTo,
      getDelegatedFrom,
      createNonce,
      getNonce,
      getEntitlement,
      getPointsBalance,
      clearError,
    ]
  );
};

export { useIndexerMail, type UseIndexerMailReturn };
