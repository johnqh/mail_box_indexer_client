/**
 * Indexer hooks for mail_box_indexer API integration
 */

// Points hooks
export * from './useIndexerPoints';

// Legacy monolithic hook (deprecated - use individual hooks instead)
export * from './useIndexerMail';

// Individual endpoint hooks (recommended)
export * from './useGetWalletAccounts';
export * from './useValidateUsername';
export * from './useGetSigningMessage';
export * from './useGetDelegatedTo';
export * from './useGetDelegatedFrom';
export * from './useCreateNonce';
export * from './useGetNonce';
export * from './useGetEntitlement';
export * from './useGetPointsBalance';

// Name service hooks
export {
  useWalletNames,
  useResolveNameToAddress,
} from './useIndexerNameService';

// Referral hooks
export * from './useReferralCode';
export * from './useReferralShare';
export * from './useReferralConsumption';
export * from './useReferralStats';

// Mock data for testing
export { IndexerMockData } from './mocks';
