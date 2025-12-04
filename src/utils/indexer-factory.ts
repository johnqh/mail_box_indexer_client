/**
 * Factory functions for creating indexer helper classes with network client injection
 *
 * Note: This package is React Native compatible. You must provide a NetworkClient
 * implementation from your DI container (e.g., @sudobility/di).
 */

import type { AppConfig, NetworkClient } from '@sudobility/types';
import { createIndexerAdminHelper, IndexerAdminHelper } from './indexer-admin';
import {
  createIndexerGraphQLHelper,
  IndexerGraphQLHelper,
} from './indexer-graphql';
import {
  createIndexerWebhookHelper,
  IndexerWebhookHelper,
} from './indexer-webhooks';

/**
 * Create IndexerAdminHelper with network client injection
 * @param config App configuration containing indexer backend URL
 * @param networkClient Network client from DI (platform-agnostic)
 * @returns Configured IndexerAdminHelper instance
 *
 * @example
 * ```typescript
 * import { createIndexerAdmin } from '@sudobility/indexer_client';
 * import { useNetworkClient } from '@sudobility/di/hooks';
 *
 * const networkClient = useNetworkClient();
 * const config = { indexerBackendUrl: 'https://indexer-api.example.com' };
 * const admin = createIndexerAdmin(config, networkClient);
 *
 * // Use the admin helper
 * await admin.getOverviewStats(adminSignature);
 * ```
 */
export const createIndexerAdmin = (
  config: AppConfig,
  networkClient: NetworkClient
): IndexerAdminHelper => {
  if (!config.indexerBackendUrl) {
    throw new Error('indexerBackendUrl is required in AppConfig');
  }
  return createIndexerAdminHelper(config.indexerBackendUrl, networkClient);
};

/**
 * Create IndexerGraphQLHelper with network client injection
 * @param config App configuration containing indexer backend URL
 * @param networkClient Network client from DI (platform-agnostic)
 * @returns Configured IndexerGraphQLHelper instance
 *
 * @example
 * ```typescript
 * import { createIndexerGraphQL } from '@sudobility/indexer_client';
 * import { useNetworkClient } from '@sudobility/di/hooks';
 *
 * const networkClient = useNetworkClient();
 * const config = { indexerBackendUrl: 'https://indexer-api.example.com' };
 * const graphql = createIndexerGraphQL(config, networkClient);
 *
 * // Query blockchain mail data
 * const mails = await graphql.getMailsFromAddress('0x742d35cc...', 1, { first: 10 });
 * ```
 */
export const createIndexerGraphQL = (
  config: AppConfig,
  networkClient: NetworkClient
): IndexerGraphQLHelper => {
  if (!config.indexerBackendUrl) {
    throw new Error('indexerBackendUrl is required in AppConfig');
  }
  return createIndexerGraphQLHelper(config.indexerBackendUrl, networkClient);
};

/**
 * Create IndexerWebhookHelper with network client injection
 * @param config App configuration containing indexer backend URL
 * @param networkClient Network client from DI (platform-agnostic)
 * @returns Configured IndexerWebhookHelper instance
 *
 * @example
 * ```typescript
 * import { createIndexerWebhook } from '@sudobility/indexer_client';
 * import { useNetworkClient } from '@sudobility/di/hooks';
 *
 * const networkClient = useNetworkClient();
 * const config = { indexerBackendUrl: 'https://indexer-api.example.com' };
 * const webhook = createIndexerWebhook(config, networkClient);
 *
 * // Process webhook events
 * await webhook.processEmailSent({
 *   senderAddress: '0x123...',
 *   recipientAddress: '0x456...',
 *   emailId: 'email-123'
 * });
 * ```
 */
export const createIndexerWebhook = (
  config: AppConfig,
  networkClient: NetworkClient
): IndexerWebhookHelper => {
  if (!config.indexerBackendUrl) {
    throw new Error('indexerBackendUrl is required in AppConfig');
  }
  return createIndexerWebhookHelper(config.indexerBackendUrl, networkClient);
};

/**
 * Create all indexer helpers with network client injection
 * @param config App configuration containing indexer backend URL
 * @param networkClient Network client from DI (platform-agnostic)
 * @returns Object containing all configured indexer helpers
 *
 * @example
 * ```typescript
 * import { createIndexerHelpers } from '@sudobility/indexer_client';
 * import { useNetworkClient } from '@sudobility/di/hooks';
 *
 * const networkClient = useNetworkClient();
 * const config = { indexerBackendUrl: 'https://indexer-api.example.com' };
 * const { admin, graphql, webhook } = createIndexerHelpers(config, networkClient);
 *
 * // Use any helper as needed
 * const stats = await admin.getOverviewStats(adminSignature);
 * const mails = await graphql.getMailsFromAddress('0x742d35cc...', 1);
 * await webhook.processEmailSent(emailData);
 * ```
 */
export const createIndexerHelpers = (
  config: AppConfig,
  networkClient: NetworkClient
) => {
  return {
    admin: createIndexerAdmin(config, networkClient),
    graphql: createIndexerGraphQL(config, networkClient),
    webhook: createIndexerWebhook(config, networkClient),
  };
};
