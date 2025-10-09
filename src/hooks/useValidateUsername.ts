import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';
import { type AddressValidationResponse, type Optional } from '@johnqh/types';

interface UseValidateUsernameReturn {
  validateUsername: (
    username: string
  ) => Promise<Optional<AddressValidationResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}

/**
 * React hook for validating usernames
 * Public endpoint - no authentication required
 * Uses React Query for better state management and error handling
 *
 * @param endpointUrl - Indexer API endpoint URL
 * @param dev - Whether to use dev mode headers
 * @returns Object with validateUsername function and state
 */
export const useValidateUsername = (
  endpointUrl: string,
  dev: boolean = false
): UseValidateUsernameReturn => {
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
    ): Promise<Optional<AddressValidationResponse>> => {
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
    async (username: string): Promise<Optional<AddressValidationResponse>> => {
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
