/**
 * Indexer hooks for mail_box_indexer API integration
 */

// Points hooks
export * from './useIndexerPoints';

// Legacy monolithic hook (deprecated - use individual hooks instead)
export * from './useIndexerMail';

// Individual endpoint hooks (recommended)
export * from './useIndexerGetWalletAccounts';
export * from './useIndexerValidateUsername';
export * from './useIndexerGetSigningMessage';
export * from './useIndexerGetDelegatedTo';
export * from './useIndexerGetDelegatedFrom';
export * from './useIndexerCreateNonce';
export * from './useIndexerGetNonce';
export * from './useIndexerGetEntitlement';
export * from './useIndexerGetPointsBalance';

// Name service hooks
export {
  useWalletNames,
  useResolveNameToAddress,
} from './useIndexerNameService';

// Referral hooks
export * from './useIndexerReferralCode';
export * from './useIndexerReferralConsumption';
export * from './useIndexerReferralStats';

// Mock data for testing
export { IndexerMockData } from './mocks';
