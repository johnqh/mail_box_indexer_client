# API Coverage Matrix

This document tracks the implementation status of all mail_box_indexer API endpoints in this client library.

Last Updated: 2025-01-08

## Legend

- ✅ **Implemented** - Fully implemented and tested
- ⚠️ **Intentionally Not Exposed** - Server-only endpoints (IP-restricted)
- ❌ **Not Implemented** - Missing from client library
- 🔄 **Planned** - Scheduled for future implementation

## Summary

| Category | Total | Implemented | Not Exposed | Missing | Coverage |
|----------|-------|-------------|-------------|---------|----------|
| Mail & User Management | 17 | 12 | 3 | 2 | 71% |
| Points System | 3 | 3 | 0 | 0 | 100% |
| OAuth 2.0 | 8 | 0 | 0 | 8 | 0% |
| KYC Verification | 3 | 0 | 0 | 3 | 0% |
| Solana Integration | 4 | 0 | 1 | 3 | 0% |
| **Total** | **35** | **15** | **4** | **16** | **43%** |

## Detailed Coverage

### Mail & User Management (17 endpoints)

#### Public Endpoints

| Endpoint | Method | Status | Client Method | Notes |
|----------|--------|--------|---------------|-------|
| `/users/:username/validate` | GET | ✅ | `validateUsername()` | Validates wallet addresses |
| `/wallets/:walletAddress/message` | GET | ✅ | `getMessage()` | Generates SIWE/SIWS message |
| `/wallets/named/:name` | GET | ✅ | `resolveNameToAddress()` | Resolves ENS/SNS names |
| `/blocks` | GET | ❌ | - | **MISSING**: Block status monitoring |

#### Signature-Protected Endpoints

| Endpoint | Method | Status | Client Method | Notes |
|----------|--------|--------|---------------|-------|
| `/wallets/:walletAddress/accounts` | GET | ✅ | `getWalletAccounts()` | Includes referral code support |
| `/wallets/:walletAddress/names` | GET | ✅ | `getWalletNames()` | Get ENS/SNS names for wallet |
| `/delegations/from/:walletAddress` | GET | ✅ | `getDelegatedTo()` | Who this wallet delegated to |
| `/delegations/to/:walletAddress` | GET | ✅ | `getDelegatedFrom()` | Who delegated to this wallet |
| `/users/:username/nonce` | POST | ✅ | `createNonce()` | Create/replace nonce |
| `/users/:username/nonce` | GET | ✅ | `getNonce()` | Retrieve nonce |
| `/wallets/:walletAddress/entitlements` | GET | ✅ | `getEntitlement()` | RevenueCat subscription check |
| `/wallets/:walletAddress/points` | GET | ✅ | `getPointsBalance()` | Get points balance |
| `/wallets/:walletAddress/authenticated` | GET | ❌ | - | **MISSING**: Check auth status |
| `/wallets/:walletAddress/referral` | POST | ✅ | `getReferralCode()` | Get/create referral code |

#### IP-Restricted Endpoints (Server-Only)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/wallets/:walletAddress/points/add` | POST | ⚠️ | WildDuck server only - Not exposed |
| `/authenticate` | POST | ⚠️ | WildDuck server only - Not exposed |
| `/addresses/:address/verify` | POST | ⚠️ | WildDuck server only - Not exposed |

### Points System (3 endpoints)

| Endpoint | Method | Status | Client Method | Notes |
|----------|--------|--------|---------------|-------|
| `/points/leaderboard/:count` | GET | ✅ | `getPointsLeaderboard()` | Top users by points |
| `/points/site-stats` | GET | ✅ | `getPointsSiteStats()` | Platform-wide statistics |
| `/referrals/:referralCode/stats` | POST | ✅ | `getReferralStats()` | Referral code statistics |

### OAuth 2.0 (8 endpoints)

| Endpoint | Method | Status | Notes | Priority |
|----------|--------|--------|-------|----------|
| `/.well-known/openid-configuration` | GET | ❌ | OIDC discovery endpoint | 🔴 High |
| `/auth/challenge` | POST | ❌ | Generate wallet auth challenge | 🔴 High |
| `/auth/verify` | POST | ❌ | Verify wallet signature | 🔴 High |
| `/oauth/authorize` | GET | ❌ | OAuth authorization endpoint | 🔴 High |
| `/oauth/token` | POST | ❌ | Token exchange & refresh | 🔴 High |
| `/oauth/userinfo` | GET | ❌ | Get user profile | 🔴 High |
| `/oauth/revoke` | POST | ❌ | Revoke refresh token | 🔴 High |
| `/oauth/clients/:clientId` | GET | ❌ | Get client information | 🟡 Medium |

**Implementation Notes:**
- OAuth 2.0 is **critical** for third-party app integrations
- Requires complete flow implementation (not individual endpoints)
- Needs state management for auth sessions
- Should support PKCE for native apps
- Priority: **High** (Week 1-2 of next sprint)

### KYC Verification (3 endpoints)

| Endpoint | Method | Status | Notes | Priority |
|----------|--------|--------|-------|----------|
| `/kyc/initiate/:walletAddress` | POST | ❌ | Start KYC with Sumsub | 🟡 Medium |
| `/kyc/status/:walletAddress` | GET | ❌ | Get KYC verification status | 🟡 Medium |
| `/kyc/webhook` | POST | ⚠️ | Webhook (not for client use) | N/A |

**Implementation Notes:**
- Only needed if KYC feature is required
- Check `KYC_ENABLED` environment variable
- Depends on Sumsub integration
- Priority: **Medium** (Feature-specific, implement only if needed)

### Solana Integration (4 endpoints)

| Endpoint | Method | Status | Notes | Priority |
|----------|--------|--------|-------|----------|
| `/solana/setup-webhooks` | POST | ❌ | Configure Helius webhooks | 🟢 Low |
| `/solana/status` | GET | ❌ | Check indexer status | 🟢 Low |
| `/solana/test-transaction` | POST | ❌ | Create test transaction | 🟢 Low |
| `/solana/webhook` | POST | ⚠️ | Webhook (not for client use) | N/A |

**Implementation Notes:**
- Primarily admin/monitoring functions
- Useful for admin panel
- Not critical for end-user functionality
- Priority: **Low** (Admin tools)

## Implementation Roadmap

### Phase 1: Critical Features (Weeks 1-2) 🔴

**Priority:** High
**Goal:** Enable third-party integrations

- [ ] Implement complete OAuth 2.0 flow
  - [ ] Challenge generation (`POST /auth/challenge`)
  - [ ] Signature verification (`POST /auth/verify`)
  - [ ] Authorization flow (`GET /oauth/authorize`)
  - [ ] Token exchange (`POST /oauth/token`)
  - [ ] User info (`GET /oauth/userinfo`)
  - [ ] Token revocation (`POST /oauth/revoke`)
  - [ ] Client info (`GET /oauth/clients/:clientId`)
  - [ ] OIDC discovery (`GET /.well-known/openid-configuration`)

- [ ] Add missing utility endpoints
  - [ ] Block status (`GET /blocks`)
  - [ ] Authentication status (`GET /wallets/:walletAddress/authenticated`)

- [ ] Create `OAuthClient` helper class
- [ ] Add OAuth examples and documentation
- [ ] Write comprehensive OAuth tests
- [ ] Update type definitions

**Estimated Effort:** 40-60 hours

### Phase 2: Feature Complete (Weeks 3-4) 🟡

**Priority:** Medium
**Goal:** Complete feature parity with backend

- [ ] Add KYC module (if needed)
  - [ ] KYC initiation (`POST /kyc/initiate/:walletAddress`)
  - [ ] KYC status check (`GET /kyc/status/:walletAddress`)
  - [ ] Create `IndexerKYCHelper` class
  - [ ] Add KYC tests and examples

- [ ] Expand GraphQL support
  - [ ] Add mail queries
  - [ ] Add delegation queries
  - [ ] Add statistics queries
  - [ ] Update `IndexerGraphQLHelper`

- [ ] Add Solana admin functions
  - [ ] Webhook setup (`POST /solana/setup-webhooks`)
  - [ ] Status check (`GET /solana/status`)
  - [ ] Test transactions (`POST /solana/test-transaction`)

**Estimated Effort:** 30-40 hours

### Phase 3: Polish & Optimization (Week 5) 🟢

**Priority:** Low
**Goal:** Production-ready quality

- [ ] Comprehensive integration tests
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Mock data expansion
- [ ] Documentation updates
- [ ] Code examples for all features
- [ ] Migration guide from 0.x to 1.0

**Estimated Effort:** 20-30 hours

## Version Compatibility

### Type Package Versions

| Package | Backend | Client | Status |
|---------|---------|--------|--------|
| @johnqh/types | 1.8.9 | 1.8.14 | ⚠️ **Version mismatch** - Should align |
| @johnqh/di | - | 1.3.19 | ✅ Client only |

**Action Required:** Update backend to use `@johnqh/types@1.8.14` or ensure backward compatibility.

## Testing Coverage

### Current Test Coverage

| Module | Files | Tests | Coverage |
|--------|-------|-------|----------|
| network/ | 1/1 | 10 | ✅ Good |
| business/ | 1/1 | 7 | ✅ Good |
| hooks/ | 1/7 | 4 | ⚠️ Needs expansion |
| utils/ | 0/4 | 0 | ❌ Missing |

### Test Coverage Goals

- [ ] Add tests for all hook modules
- [ ] Add tests for utility helpers
- [ ] Add integration tests for complete flows
- [ ] Add OAuth flow tests (when implemented)
- [ ] Target: 80%+ code coverage

## Performance Considerations

### Current Implementation

- ✅ Request caching in `IndexerService` (5-minute TTL)
- ✅ React Query caching in hooks (5-minute stale time)
- ✅ Proper query key management
- ⚠️ No request deduplication
- ⚠️ No request batching

### Optimization Opportunities

1. **Request Deduplication:** Multiple simultaneous identical requests should be deduplicated
2. **Request Batching:** Batch multiple API calls where possible
3. **Prefetching:** Prefetch likely next queries
4. **Cache Invalidation:** Smarter cache invalidation strategies
5. **Optimistic Updates:** Update UI before server confirms

## Security Audit Checklist

- [ ] No sensitive data in logs (signatures, messages)
- [ ] All signature verification done server-side
- [ ] IP-restricted endpoints not exposed
- [ ] Dev mode disabled in production builds
- [ ] HTTPS enforced for production
- [ ] Rate limiting respected
- [ ] Token rotation implemented (OAuth)
- [ ] Secure token storage guidelines

## Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| README.md | ⚠️ Needs update | 2025-01-08 |
| API.md | ✅ Complete | 2025-01-08 |
| AI_DEVELOPMENT_GUIDE.md | ✅ Complete | 2025-01-08 |
| COVERAGE.md | ✅ Complete | 2025-01-08 |
| EXAMPLES.md | ❌ Missing | - |
| CONTRIBUTING.md | ❌ Missing | - |
| CHANGELOG.md | ❌ Missing | - |

## Breaking Changes from Backend

None identified. Both use `@johnqh/types` for type safety.

## Migration Path

When implementing missing features:

1. **OAuth 2.0:** Will be a major version bump (0.x → 1.0.0)
2. **Block Status & Auth Status:** Minor version bump (0.0.x → 0.1.0)
3. **KYC Module:** Minor version bump (0.x.0 → 0.x+1.0)
4. **Solana Admin:** Patch version (0.x.x → 0.x.x+1)

## Questions for Product Team

1. Is OAuth 2.0 implementation required for launch? **Priority?**
2. Is KYC verification needed for the product? **Yes/No?**
3. Are Solana admin functions needed in client, or admin panel only?
4. What is the target timeline for feature-complete client library?
5. Should we maintain backward compatibility with @johnqh/types 1.8.9?

## Notes

- Backend is feature-complete and stable
- Client has good coverage of core user features (71%)
- OAuth 2.0 is the biggest gap for third-party integrations
- All implemented features are well-tested and documented
- Architecture is solid and follows React Query best practices
