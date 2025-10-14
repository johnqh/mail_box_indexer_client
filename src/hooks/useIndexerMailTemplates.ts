import { useCallback, useMemo, useState } from 'react';
import type { Optional } from '@sudobility/types';
import {
  IndexerClient,
  type MailTemplate,
  type MailTemplateCreateRequest,
  type MailTemplateDeleteResponse,
  type MailTemplateResponse,
  type MailTemplatesListParams,
  type MailTemplatesListResponse,
  type MailTemplateUpdateRequest,
} from '../network/IndexerClient';
import type { IndexerUserAuth } from '../types';

/**
 * Hook for managing mail templates
 * Provides CRUD operations for user email templates
 *
 * @param endpointUrl - Indexer backend URL
 * @param dev - Development mode flag
 * @returns Hook state and CRUD functions
 *
 * @example
 * ```typescript
 * const {
 *   templates,
 *   template,
 *   isLoading,
 *   error,
 *   createTemplate,
 *   getTemplates,
 *   getTemplate,
 *   updateTemplate,
 *   deleteTemplate
 * } = useIndexerMailTemplates('https://indexer.0xmail.box', false);
 *
 * // Create a new template
 * await createTemplate(walletAddress, auth, {
 *   templateName: 'Welcome Email',
 *   bodyContent: 'Hello {{name}}!'
 * });
 *
 * // Get list of templates
 * await getTemplates(walletAddress, auth, { active: true, limit: 10 });
 *
 * // Get single template
 * await getTemplate(walletAddress, templateId, auth);
 *
 * // Update template
 * await updateTemplate(walletAddress, templateId, auth, {
 *   templateName: 'Updated Welcome Email'
 * });
 *
 * // Delete template
 * await deleteTemplate(walletAddress, templateId, auth);
 * ```
 */
export const useIndexerMailTemplates = (endpointUrl: string, dev: boolean) => {
  const [templates, setTemplates] =
    useState<Optional<MailTemplatesListResponse>>(null);
  const [template, setTemplate] = useState<Optional<MailTemplate>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const client = new IndexerClient(endpointUrl, dev);

  /**
   * Create a new mail template
   */
  const createTemplate = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      templateData: MailTemplateCreateRequest
    ): Promise<MailTemplateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.createMailTemplate(
          walletAddress,
          auth,
          templateData
        );
        if (response.data) {
          setTemplate(response.data.template);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get list of templates for a wallet
   */
  const getTemplates = useCallback(
    async (
      walletAddress: string,
      auth: IndexerUserAuth,
      params?: MailTemplatesListParams
    ): Promise<MailTemplatesListResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getMailTemplates(
          walletAddress,
          auth,
          params
        );
        setTemplates(response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get templates';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Get a single template by ID
   */
  const getTemplate = useCallback(
    async (
      walletAddress: string,
      templateId: string,
      auth: IndexerUserAuth
    ): Promise<MailTemplateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.getMailTemplate(
          walletAddress,
          templateId,
          auth
        );
        if (response.data) {
          setTemplate(response.data.template);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(
    async (
      walletAddress: string,
      templateId: string,
      auth: IndexerUserAuth,
      updates: MailTemplateUpdateRequest
    ): Promise<MailTemplateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.updateMailTemplate(
          walletAddress,
          templateId,
          auth,
          updates
        );
        if (response.data) {
          setTemplate(response.data.template);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  /**
   * Delete a template (soft delete)
   */
  const deleteTemplate = useCallback(
    async (
      walletAddress: string,
      templateId: string,
      auth: IndexerUserAuth
    ): Promise<MailTemplateDeleteResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await client.deleteMailTemplate(
          walletAddress,
          templateId,
          auth
        );
        // Clear current template if it was deleted
        if (template?.id === templateId) {
          setTemplate(null);
        }
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, template]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTemplates(null);
    setTemplate(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      // State
      templates,
      template,
      isLoading,
      error,
      // CRUD operations
      createTemplate,
      getTemplates,
      getTemplate,
      updateTemplate,
      deleteTemplate,
      // Utilities
      clearError,
      reset,
    }),
    [
      templates,
      template,
      isLoading,
      error,
      createTemplate,
      getTemplates,
      getTemplate,
      updateTemplate,
      deleteTemplate,
      clearError,
      reset,
    ]
  );
};
