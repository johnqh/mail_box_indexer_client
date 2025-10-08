/**
 * @johnqh/indexer_client
 * React and React Native compatible client library for 0xMail indexer API
 */

// Configuration
export {
  IndexerConfigProvider,
  useIndexerConfig,
  useIndexerConfigOptional,
} from './context/IndexerConfigContext';
export type {
  IndexerConfig,
  IndexerConfigProviderProps,
} from './context/IndexerConfigContext';

// Network client
export { IndexerClient } from './network/IndexerClient';
export type {
  NetworkRequestOptions,
  NetworkResponse,
  ReferralCodeData,
  ReferralCodeResponse,
  ReferredWallet,
  ReferralStatsData,
  ReferralStatsResponse,
} from './network/IndexerClient';

// Business logic
export { IndexerService } from './business/indexer-service';

// Hooks
export {
  useIndexerMail,
  useIndexerPoints,
  useWalletNames,
  useResolveNameToAddress,
  useReferralCode,
  useReferralConsumption,
  useReferralShare,
  useReferralStats,
  IndexerMockData,
} from './hooks';
export type { UseIndexerMailReturn } from './hooks/useIndexerMail';

// Utilities
export {
  createIndexerAdmin,
  createIndexerGraphQL,
  createIndexerWebhook,
  createIndexerHelpers,
} from './utils/indexer-factory';

export type {
  IndexerAdminHelper,
  IndexerAdminConfig,
} from './utils/indexer-admin';

export type {
  IndexerGraphQLHelper,
  IndexerGraphQLConfig,
} from './utils/indexer-graphql';

export type {
  IndexerWebhookHelper,
  IndexerWebhookConfig,
  WebhookEmailSent,
  WebhookRecipientLogin,
  WebhookReferralRegistration,
  WebhookLoginEvent,
  WebhookLoginResult,
  WebhookResponse,
} from './utils/indexer-webhooks';

// Re-export types from @johnqh/types for convenience
export type {
  AddressValidationResponse,
  ChainType,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NameResolutionResponse,
  NameServiceResponse,
  NonceResponse,
  Optional,
  PointsResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';
