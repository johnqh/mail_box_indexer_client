/**
 * Network layer exports
 *
 * Note: This package is React Native compatible. The consuming application
 * must provide their own NetworkClient implementation (from @sudobility/di).
 *
 * For testing, use MockNetworkClient from @sudobility/di/mocks:
 * import { MockNetworkClient } from '@sudobility/di/mocks';
 */

export { IndexerClient } from './IndexerClient';
export type {
  ReferralCodeData,
  ReferralCodeResponse,
  ReferredWallet,
  ReferralStatsData,
  ReferralStatsResponse,
  PointsInfoSiteStats,
  PointsInfoTopUser,
  PointsInfoData,
  PointsInfoResponse,
} from './IndexerClient';
