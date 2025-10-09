import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import {
  type IndexerAddressValidationResponse,
  type Optional,
} from '@johnqh/types';

interface UseIndexerValidateUsernameReturn {
  validateUsername: (
    username: string
  ) => Promise<Optional<IndexerAddressValidationResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for validating usernames
 * Public endpoint - no authentication required
 * Uses React Query useMutation for on-demand validation (no caching)
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with validateUsername function and state
 *
 * @note This uses useMutation instead of useQuery because validation is typically
 * called on-demand (e.g., onBlur in a form) and should not be cached.
 */
export const useIndexerValidateUsername = (
  endpointUrl: string,
  dev: boolean = false
): UseIndexerValidateUsernameReturn => {
  const [error, setError] = useState<Optional<string>>(null);

  const indexerClient = useMemo(
    () => new IndexerClient(endpointUrl, dev),
    [endpointUrl, dev]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const mutation = useMutation({
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

  const validateUsername = useCallback(
    async (
      username: string
    ): Promise<Optional<IndexerAddressValidationResponse>> => {
      return await mutation.mutateAsync(username);
    },
    [mutation]
  );

  return {
    validateUsername,
    isLoading: mutation.isPending,
    error,
    clearError,
  };
};
