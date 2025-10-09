/**
 * @johnqh/indexer_client
 * React and React Native compatible client library for 0xMail indexer API
 */

// Network client
export * from './network/index.js';

// Business logic
export * from './business/index.js';

// Hooks
export * from './hooks/index.js';

// Utilities
export * from './utils/index.js';

// Local types
export type { IndexerUserAuth } from './types.js';

// Re-export types from @johnqh/types for convenience
export type {
  IndexerAddressValidationResponse,
  ChainType,
  IndexerDelegatedFromResponse,
  IndexerDelegatedToResponse,
  IndexerEmailAccountsResponse,
  IndexerEntitlementResponse,
  IndexerLeaderboardResponse,
  IndexerNameResolutionResponse,
  IndexerNameServiceResponse,
  IndexerNonceResponse,
  Optional,
  IndexerPointsResponse,
  IndexerSignInMessageResponse,
  IndexerSiteStatsResponse,
} from '@johnqh/types';
