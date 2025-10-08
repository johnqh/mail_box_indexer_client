# Mail Box Indexer API Documentation

This document provides comprehensive documentation for the 0xMail Indexer API endpoints and their implementation status in this client library.

## Table of Contents

- [Authentication](#authentication)
- [Mail & User Management](#mail--user-management)
- [Points System](#points-system)
- [Referral System](#referral-system)
- [OAuth 2.0](#oauth-20)
- [KYC Verification](#kyc-verification)
- [Solana Integration](#solana-integration)
- [Implementation Status](#implementation-status)

## Authentication

The API uses three authentication mechanisms:

### 1. Signature-Based Authentication

Protected endpoints require these headers:
- `x-signature`: Wallet signature (EVM or Solana)
- `x-message`: URL-encoded signed message (SIWE or SIWS format)
- `x-dev`: "true" for development mode (optional)

#### SIWE Message Format (EVM)
```
localhost:3000 wants you to sign in with your Ethereum account:
0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb

Sign in with Ethereum to the app.

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: 550e8400-e29b-41d4-a716-446655440000
Issued At: 2024-01-01T00:00:00.000Z
```

#### SIWS Message Format (Solana)
```
localhost:3000 wants you to sign in with your Solana account:
5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG

Sign in with Solana to the app.

URI: http://localhost:3000
Version: 1
Issued At: 2024-01-01T00:00:00.000Z
```

### 2. IP Restriction

Certain endpoints (reward distribution, authentication verification) are restricted to the WildDuck mail server IP address and cannot be called from client applications.

### 3. OAuth 2.0

Full OAuth 2.0/OIDC flow for third-party integrations. See [OAuth 2.0 section](#oauth-20) for details.

## Mail & User Management

### Public Endpoints (No Authentication Required)

#### `GET /users/:username/validate`

Validate wallet address format and normalize addresses.

**Client Method:** `validateUsername(username: string)`

**Parameters:**
- `username`: Wallet address (EVM or Solana) or domain name

**Response:** `AddressValidationResponse`
```typescript
{
  success: true,
  data: {
    walletAddress: "0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb",
    chainType: "evm",
    isValid: true,
    normalized: "0x742d35cc6285c9d3c0ef5badf3a70b1e95c1e6bb"
  }
}
```

---

#### `GET /wallets/:walletAddress/message`

Generate deterministic signing message for wallet authentication.

**Client Method:** `getMessage(walletAddress, chainId, domain, url)`

**Query Parameters:**
- `chainId`: Blockchain chain ID (e.g., 1 for Ethereum mainnet)
- `domain`: Domain name (e.g., "0xmail.box")
- `url`: Full URL (e.g., "https://0xmail.box")

**Response:** `SignInMessageResponse`
```typescript
{
  success: true,
  data: {
    message: "localhost:3000 wants you to sign in..."
  }
}
```

---

#### `GET /wallets/named/:name`

Resolve ENS/SNS name to wallet address.

**Client Method:** `resolveNameToAddress(name: string)`

**Parameters:**
- `name`: ENS name (e.g., "vitalik.eth") or SNS name

**Response:** `NameResolutionResponse`
```typescript
{
  success: true,
  data: {
    name: "vitalik.eth",
    address: "0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb",
    chainType: "evm"
  }
}
```

---

#### `GET /blocks`

Get current and indexed block numbers for all supported chains.

**Client Method:** ❌ **NOT IMPLEMENTED**

**Response:** `BlockStatusResponse`
```typescript
{
  success: true,
  data: {
    chains: [
      {
        chainId: 1,
        chainName: "Ethereum Mainnet",
        currentBlock: 19000000,
        indexedBlock: 18999500,
        blocksBehind: 500
      }
    ]
  }
}
```

### Signature-Protected Endpoints

#### `GET /wallets/:walletAddress/accounts`

Get all email accounts for a wallet (primary, delegated, ENS/SNS domains).

**Client Method:** `getWalletAccounts(walletAddress, signature, message, referralCode?)`

**Headers:**
- `x-signature`: Required
- `x-message`: Required
- `x-referral`: Optional (applies referral code on first use)

**Response:** `EmailAccountsResponse`
```typescript
{
  success: true,
  data: {
    accounts: [
      {
        walletAddress: "0x742d35Cc...",
        chainType: "evm",
        isPrimary: true,
        primaryAccount: "0x742d35cc6285c9d3c0ef5badf3a70b1e95c1e6bb@0xmail.box",
        domainAccounts: [
          {
            account: "vitalik.eth@0xmail.box",
            type: "ens",
            domain: { name: "vitalik.eth", ... },
            verified: true,
            entitled: true
          }
        ],
        totalAccounts: 2
      }
    ]
  }
}
```

**Features:**
- Referral code application (one-time via `x-referral` header)
- RevenueCat entitlement checking for ENS/SNS domains
- Includes delegated wallets' email accounts
- Returns hierarchical account structure

---

#### `GET /wallets/:walletAddress/names`

Get all ENS/SNS names owned by a wallet.

**Client Method:** `getWalletNames(walletAddress, signature, message)`

**Response:** `NameServiceResponse`
```typescript
{
  success: true,
  data: {
    names: ["vitalik.eth", "example.eth"]
  }
}
```

---

#### `GET /delegations/from/:walletAddress`

Get who this wallet has delegated TO.

**Client Method:** `getDelegatedTo(walletAddress, signature, message)`

**Response:** `DelegatedToResponse`
```typescript
{
  success: true,
  data: {
    delegator: "0x742d35Cc...",
    delegate: "0xAbCdEf...",
    chainId: 1,
    isActive: true,
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /delegations/to/:walletAddress`

Get all wallets that delegated TO this wallet.

**Client Method:** `getDelegatedFrom(walletAddress, signature, message)`

**Response:** `DelegatedFromResponse`
```typescript
{
  success: true,
  data: {
    delegators: [
      {
        delegator: "0x123...",
        chainId: 1,
        isActive: true,
        timestamp: "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /users/:username/nonce`

Create or replace nonce for signature verification.

**Client Method:** `createNonce(username, signature, message)`

**Response:** `NonceResponse`
```typescript
{
  success: true,
  data: {
    nonce: "550e8400-e29b-41d4-a716-446655440000",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /users/:username/nonce`

Retrieve existing nonce.

**Client Method:** `getNonce(username, signature, message)`

**Response:** `NonceResponse` (or 404 if not found)

---

#### `GET /wallets/:walletAddress/entitlements`

Check RevenueCat subscription status for name service.

**Client Method:** `getEntitlement(walletAddress, signature, message)`

**Response:** `EntitlementResponse`
```typescript
{
  success: true,
  data: {
    entitled: true,
    subscription: {
      productId: "nameservice_monthly",
      expiresAt: "2024-12-31T23:59:59.000Z"
    }
  }
}
```

---

#### `GET /wallets/:walletAddress/points`

Get user's points balance and activity.

**Client Method:** `getPointsBalance(walletAddress, signature, message)`

**Response:** `PointsResponse`
```typescript
{
  success: true,
  data: {
    walletAddress: "0x742d35Cc...",
    chainType: "evm",
    pointsEarned: "5000",
    lastActivityDate: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /wallets/:walletAddress/authenticated`

Check if user has ever authenticated with the system.

**Client Method:** ❌ **NOT IMPLEMENTED**

**Response:** `AuthenticationStatusResponse`
```typescript
{
  success: true,
  data: {
    hasAuthenticated: true,
    firstAuthenticationDate: "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `POST /wallets/:walletAddress/referral`

Get or create referral code for wallet.

**Client Method:** `getReferralCode(walletAddress, signature, message)`

**Response:** `ReferralCodeResponse`
```typescript
{
  success: true,
  data: {
    walletAddress: "0x742d35Cc...",
    chainType: "evm",
    referralCode: "ABC123XYZ",
    totalRedemptions: 5,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

## Points System

### Public Endpoints

#### `GET /points/leaderboard/:count`

Get top users by points.

**Client Method:** `getPointsLeaderboard(count: number)`

**Parameters:**
- `count`: Number of users to return (1-100)

**Response:** `LeaderboardResponse`
```typescript
{
  success: true,
  data: {
    leaderboard: [
      {
        walletAddress: "0x742d35Cc...",
        chainType: "evm",
        pointsEarned: "10000",
        rank: 1,
        lastActivityDate: "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `GET /points/site-stats`

Get platform-wide statistics.

**Client Method:** `getPointsSiteStats()`

**Response:** `SiteStatsResponse`
```typescript
{
  success: true,
  data: {
    totalPoints: "1000000",
    totalUsers: 5000,
    lastUpdated: "2024-01-01T00:00:00.000Z"
  }
}
```

## Referral System

#### `POST /referrals/:referralCode/stats`

Get statistics for a referral code.

**Client Method:** `getReferralStats(referralCode: string)`

**Response:** `ReferralStatsResponse`
```typescript
{
  success: true,
  data: {
    walletAddress: "0x742d35Cc...",
    chainType: "evm",
    referralCode: "ABC123XYZ",
    totalReferred: 10,
    referredWallets: [
      {
        walletAddress: "0x123...",
        chainType: "evm",
        createdAt: "2024-01-01T00:00:00.000Z",
        ipAddress: "192.168.1.1"
      }
    ]
  }
}
```

## OAuth 2.0

Full OAuth 2.0/OIDC implementation for third-party app integrations.

### ❌ **NOT IMPLEMENTED IN CLIENT**

The backend provides a complete OAuth 2.0 server, but the client library does not yet implement the flow. This is a **high priority** addition.

**Required Endpoints:**

1. `GET /.well-known/openid-configuration` - OIDC discovery
2. `POST /auth/challenge` - Generate wallet authentication challenge
3. `POST /auth/verify` - Verify wallet signature
4. `GET /oauth/authorize` - Authorization endpoint
5. `POST /oauth/token` - Token exchange and refresh
6. `GET /oauth/userinfo` - Get user profile
7. `POST /oauth/revoke` - Revoke refresh token
8. `GET /oauth/clients/:clientId` - Get client info

**Flow:**
1. Challenge → Sign → Verify → Authorize → Token → UserInfo
2. Supports PKCE for native apps
3. Privacy levels: full, partial, anonymous
4. Device fingerprinting and trusted devices
5. Token rotation for security

## KYC Verification

Integration with Sumsub for identity verification.

### ❌ **NOT IMPLEMENTED IN CLIENT**

**Endpoints:**

#### `POST /kyc/initiate/:walletAddress`

Start KYC verification process.

**Parameters:**
- `verificationLevel`: "basic" | "enhanced" | "accredited"

**Response:** Sumsub access token for Web SDK

---

#### `GET /kyc/status/:walletAddress`

Check KYC verification status.

**Response:** Current status and retry information

---

#### `POST /kyc/webhook`

Webhook endpoint for Sumsub status updates (not for client use).

## Solana Integration

### ❌ **NOT IMPLEMENTED IN CLIENT**

**Admin Endpoints:**

1. `POST /solana/setup-webhooks` - Configure Helius webhooks
2. `GET /solana/status` - Check indexer status
3. `POST /solana/test-transaction` - Create test transaction

## Implementation Status

### ✅ Fully Implemented (18/35 endpoints)

**Mail & User Management:**
- ✅ GET `/users/:username/validate`
- ✅ GET `/wallets/:walletAddress/message`
- ✅ GET `/wallets/named/:name`
- ✅ GET `/wallets/:walletAddress/accounts`
- ✅ GET `/wallets/:walletAddress/names`
- ✅ GET `/delegations/from/:walletAddress`
- ✅ GET `/delegations/to/:walletAddress`
- ✅ POST `/users/:username/nonce`
- ✅ GET `/users/:username/nonce`
- ✅ GET `/wallets/:walletAddress/entitlements`
- ✅ GET `/wallets/:walletAddress/points`
- ✅ POST `/wallets/:walletAddress/referral`

**Points System:**
- ✅ GET `/points/leaderboard/:count`
- ✅ GET `/points/site-stats`
- ✅ POST `/referrals/:referralCode/stats`

**IP-Restricted (Server-Only):**
- ⚠️ POST `/wallets/:walletAddress/points/add` - Not exposed (intentional)
- ⚠️ POST `/authenticate` - Not exposed (intentional)
- ⚠️ POST `/addresses/:address/verify` - Not exposed (intentional)

### ❌ Not Implemented (14 endpoints)

**High Priority:**
- ❌ GET `/blocks` - Block status monitoring
- ❌ GET `/wallets/:walletAddress/authenticated` - Auth status check
- ❌ OAuth 2.0 Flow (8 endpoints) - **Critical for integrations**

**Medium Priority:**
- ❌ KYC Endpoints (3 endpoints) - Feature-specific
- ❌ Solana Management (3 endpoints) - Admin functions

**Webhooks (not for client):**
- N/A POST `/kyc/webhook`
- N/A POST `/solana/webhook`

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  success: false,
  error: "Human-readable error message",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Validation error (invalid parameters)
- `401` - Authentication failed (invalid signature)
- `403` - Forbidden (IP restriction)
- `404` - Resource not found
- `500` - Internal server error

## Rate Limiting

The backend implements rate limiting on a per-client basis. OAuth clients can be assigned different rate limit tiers.

## CORS

The backend supports CORS for browser-based clients. Allowed origins are configurable per OAuth client.

## Development Mode

Set `x-dev: "true"` header to bypass certain validations during development. This should **never** be used in production.
