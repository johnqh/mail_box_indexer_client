import { useCallback, useMemo, useState } from 'react';
import type { Optional } from '@sudobility/types';
import {
  IndexerClient,
  type Webhook,
  type WebhookCreateRequest,
  type WebhookDeleteResponse,
  type WebhookResponse,
  type WebhooksListParams,
  type WebhooksListResponse,
} from '../network/IndexerClient';
import type { IndexerUserAuth } from '../types';

/**
 * Hook for managing mail webhooks
 * Provides CRUD operations for user webhooks
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and CRUD functions
 *
 * @example
 * ```typescript
 * const {
 *   webhooks,
 *   webhook,
 *   isLoading,
 *   error,
 *   createWebhook,
 *   getWebhooks,
 *   getWebhook,
 *   deleteWebhook
 * } = useIndexerMailWebhooks('https://indexer.0xmail.box', false);
 *
 * // Create a new webhook
 * await createWebhook(walletAddress, auth, {
 *   webhookUrl: 'https://example.com/webhook'
 * });
 *
 * // Get list of webhooks
 * await getWebhooks(walletAddress, auth, { active: true, limit: 10 });
 *
 * // Get single webhook
 * await getWebhook(walletAddress, webhookId, auth);
 *
 * // Delete webhook
 * await deleteWebhook(walletAddress, webhookId, auth);
 * ```
 */
export const useIndexerMailWebhooks = (endpointUrl: string, dev: boolean) => {
  const [webhooks, setWebhooks] =
    useState<Optional<WebhooksListResponse>>(null);
  const [webhook, setWebhook] = useState<Optional<Webhook>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const client = new IndexerClient(endpointUrl, dev);

  /**
   * Create a new webhook
   */
  const createWebhook = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      webhookData: WebhookCreateRequest
    ): Promise<WebhookResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createWebhook(
          walletAddress,
          auth,
          webhookData
        );
        setWebhook(response.webhook);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create webhook';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get list of webhooks for a wallet
   */
  const getWebhooks = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      params?: WebhooksListParams
    ): Promise<WebhooksListResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getWebhooks(walletAddress, auth, params);
        setWebhooks(response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get webhooks';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get a single webhook by ID
   */
  const getWebhook = useCallback(
    async (
      walletAddress: string,
      webhookId: string,
      auth: IndexerUserAuth
    ): Promise<WebhookResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getWebhook(
          walletAddress,
          webhookId,
          auth
        );
        setWebhook(response.webhook);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get webhook';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Delete a webhook (soft delete)
   */
  const deleteWebhook = useCallback(
    async (
      walletAddress: string,
      webhookId: string,
      auth: IndexerUserAuth
    ): Promise<WebhookDeleteResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteWebhook(
          walletAddress,
          webhookId,
          auth
        );
        // Clear current webhook if it was deleted
        if (webhook?.id === webhookId) {
          setWebhook(null);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete webhook';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, webhook]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setWebhooks(null);
    setWebhook(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      // State
      webhooks,
      webhook,
      isLoading,
      error,
      // CRUD operations
      createWebhook,
      getWebhooks,
      getWebhook,
      deleteWebhook,
      // Utilities
      clearError,
      reset,
    }),
    [
      webhooks,
      webhook,
      isLoading,
      error,
      createWebhook,
      getWebhooks,
      getWebhook,
      deleteWebhook,
      clearError,
      reset,
    ]
  );
};
