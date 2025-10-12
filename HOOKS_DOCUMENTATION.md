# 0xMail Indexer Client - Hooks Documentation

This document provides comprehensive documentation for all React hooks in the `@sudobility/indexer_client` package. The hooks provide a React-friendly interface to interact with the 0xMail indexer API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Public Endpoints (No Authentication)](#public-endpoints-no-authentication)
  - [useIndexerValidateUsername](#useindexervalidateusername)
  - [useIndexerGetSigningMessage](#useindexergetsigningmessage)
  - [useIndexerPoints](#useindexerpoints)
  - [useResolveNameToAddress](#useresolvelnametoaddress)
  - [useIndexerReferralStats](#useindexerreferralstats)
- [Signature-Protected Endpoints](#signature-protected-endpoints)
  - [useIndexerGetWalletAccounts](#useindexergetwalletaccounts)
  - [useIndexerGetPointsBalance](#useindexergetpointsbalance)
  - [useIndexerGetEntitlement](#useindexergetentitlement)
  - [useIndexerGetDelegatedTo](#useindexergetdelegatedto)
  - [useIndexerGetDelegatedFrom](#useindexergetdelegatedfrom)
  - [useIndexerCreateNonce](#useindexercreatenonce)
  - [useIndexerGetNonce](#useindexergetnonce)
  - [useWalletNames](#usewalletnames)
  - [useIndexerReferralCode](#useindexerreferralcode)
- [Utility Hooks](#utility-hooks)
  - [useIndexerReferralShare](#useindexerreferralshare)
  - [useIndexerReferralConsumption](#useindexerreferralconsumption)
- [Legacy Hooks](#legacy-hooks)
  - [useIndexerMail](#useindexermail)

---

## Overview

All hooks follow these conventions:

- **Hook Parameters**: Most hooks accept `endpointUrl` (string) and `dev` (boolean) as initialization parameters
- **Return Values**: Hooks return an object with:
  - Main function(s) for API calls
  - `isLoading`: Boolean indicating loading state
  - `error`: String containing error message (or null)
  - `clearError`: Function to clear error state
- **React Query**: Most hooks use `@tanstack/react-query` for state management, caching, and error handling
- **TypeScript**: Full TypeScript support with comprehensive type definitions

---

## Authentication

The indexer API uses two authentication models:

### 1. Public Endpoints
No authentication required. These endpoints are accessible to anyone.

### 2. Signature-Protected Endpoints
Require wallet signature verification using the `IndexerUserAuth` type:

```typescript
interface IndexerUserAuth {
  message: string;    // SIWE/SIWS message that was signed
  signature: string;  // Wallet signature of the message
}
```

**Authentication Flow:**
1. Get the signing message using `useIndexerGetSigningMessage`
2. Have user sign the message with their wallet
3. Pass the `{ message, signature }` to signature-protected endpoints

**Example:**
```typescript
// Step 1: Get message to sign
const { getSigningMessage } = useIndexerGetSigningMessage(
  'https://indexer.0xmail.box',
  false
);

const messageData = await getSigningMessage(
  walletAddress,
  1,  // chainId (1 for Ethereum mainnet, -1 for Solana mainnet)
  'app.0xmail.box',
  'https://app.0xmail.box'
);

// Step 2: Sign message with wallet
const signature = await walletProvider.signMessage(messageData.data.message);

// Step 3: Create auth object
const auth: IndexerUserAuth = {
  message: messageData.data.message,
  signature: signature
};

// Step 4: Use auth with protected endpoints
const { getWalletAccounts } = useIndexerGetWalletAccounts(
  'https://indexer.0xmail.box',
  false
);

const accounts = await getWalletAccounts(walletAddress, auth);
```

---

## Public Endpoints (No Authentication)

### useIndexerValidateUsername

Validates username format according to 0xMail rules.

**API Endpoint:** `GET /users/:username/validate`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API (e.g., 'https://indexer.0xmail.box') |
| `dev` | boolean | No | false | If true, sends 'x-dev: true' header for backend development mode |

#### Returns

```typescript
interface UseIndexerValidateUsernameReturn {
  validateUsername: (username: string) => Promise<Optional<AddressValidationResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**AddressValidationResponse:**
```typescript
interface AddressValidationResponse {
  success: boolean;
  data: {
    valid: boolean;
    reason?: string;  // Present if valid is false
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerValidateUsername } from '@sudobility/indexer_client';

function ValidateUsernameForm() {
  const { validateUsername, isLoading, error, clearError } =
    useIndexerValidateUsername('https://indexer.0xmail.box', false);

  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleValidate = async () => {
    try {
      const response = await validateUsername(username);
      if (response?.success) {
        setIsValid(response.data.valid);
        if (!response.data.valid) {
          console.log('Invalid reason:', response.data.reason);
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  return (
    <div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <button onClick={handleValidate} disabled={isLoading}>
        {isLoading ? 'Validating...' : 'Validate'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {isValid !== null && (
        <p style={{color: isValid ? 'green' : 'red'}}>
          {isValid ? 'Username is valid!' : 'Username is invalid'}
        </p>
      )}
    </div>
  );
}
```

---

### useIndexerGetSigningMessage

Gets a deterministic SIWE/SIWS message for wallet authentication. This message should be signed by the user's wallet to create authentication credentials.

**API Endpoint:** `GET /wallets/:walletAddress/message?chainId=...&domain=...&url=...`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

The `getSigningMessage` function accepts:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address requesting authentication |
| `chainId` | number | Yes | Chain ID: positive for EVM chains (1=Ethereum, 8453=Base), negative for Solana (-1=mainnet, -2=devnet) |
| `domain` | string | Yes | Domain of the application (e.g., 'app.0xmail.box') |
| `url` | string | Yes | Full URL of the application (e.g., 'https://app.0xmail.box') |

#### Returns

```typescript
interface UseIndexerGetSigningMessageReturn {
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**SignInMessageResponse:**
```typescript
interface SignInMessageResponse {
  success: boolean;
  data: {
    message: string;        // SIWE/SIWS formatted message to sign
    walletAddress: string;
    chainId: number;
    domain: string;
    url: string;
    nonce: string;         // Unique nonce for this request
    timestamp: string;
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetSigningMessage } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function WalletAuthButton({ walletAddress, chainId }: { walletAddress: string, chainId: number }) {
  const { getSigningMessage, isLoading, error } =
    useIndexerGetSigningMessage('https://indexer.0xmail.box', false);

  const [auth, setAuth] = useState<IndexerUserAuth | null>(null);

  const handleSignIn = async () => {
    try {
      // Step 1: Get message to sign
      const messageData = await getSigningMessage(
        walletAddress,
        chainId,
        'app.0xmail.box',
        'https://app.0xmail.box'
      );

      if (!messageData?.success) {
        console.error('Failed to get message:', messageData?.error);
        return;
      }

      console.log('Message to sign:', messageData.data.message);

      // Step 2: Sign with wallet (example using ethers)
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageData.data.message, walletAddress]
      });

      // Step 3: Create auth object for future API calls
      const authCredentials: IndexerUserAuth = {
        message: messageData.data.message,
        signature: signature
      };

      setAuth(authCredentials);
      console.log('Authentication successful!');

      // Now you can use authCredentials with signature-protected endpoints

    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSignIn} disabled={isLoading || !!auth}>
        {isLoading ? 'Getting message...' : auth ? 'Signed In' : 'Sign In with Wallet'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {auth && <p style={{color: 'green'}}>✓ Authenticated</p>}
    </div>
  );
}
```

**Chain ID Reference:**
- Ethereum Mainnet: `1`
- Ethereum Sepolia: `11155111`
- Base Mainnet: `8453`
- Base Sepolia: `84532`
- Solana Mainnet: `-1`
- Solana Devnet: `-2`

---

### useIndexerPoints

Access public points-related endpoints (leaderboard and site statistics).

**API Endpoints:**
- `GET /points/leaderboard/:count` - Get top users by points
- `GET /points/site-stats` - Get site-wide statistics

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Returns

```typescript
interface UseIndexerPointsReturn {
  getPointsLeaderboard: (count?: number) => Promise<LeaderboardResponse>;
  getPointsSiteStats: () => Promise<SiteStatsResponse>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**LeaderboardResponse:**
```typescript
interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: Array<{
      walletAddress: string;
      chainType: 'evm' | 'solana';
      totalPoints: number;
      rank: number;
    }>;
    count: number;
  };
  error: Optional<string>;
  timestamp: string;
}
```

**SiteStatsResponse:**
```typescript
interface SiteStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    totalPoints: number;
    totalEmailsSent: number;
    totalEmailsRead: number;
    totalReferrals: number;
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerPoints } from '@sudobility/indexer_client';

function PointsLeaderboard() {
  const { getPointsLeaderboard, getPointsSiteStats, isLoading, error } =
    useIndexerPoints('https://indexer.0xmail.box', false);

  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Get top 10 users
        const leaders = await getPointsLeaderboard(10);
        setLeaderboard(leaders.data.leaderboard);

        // Get site statistics
        const siteStats = await getPointsSiteStats();
        setStats(siteStats.data);
      } catch (err) {
        console.error('Failed to load points data:', err);
      }
    }
    loadData();
  }, [getPointsLeaderboard, getPointsSiteStats]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Site Statistics</h2>
      {stats && (
        <ul>
          <li>Total Users: {stats.totalUsers}</li>
          <li>Total Points: {stats.totalPoints}</li>
          <li>Emails Sent: {stats.totalEmailsSent}</li>
          <li>Emails Read: {stats.totalEmailsRead}</li>
        </ul>
      )}

      <h2>Top 10 Leaderboard</h2>
      {leaderboard && (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Wallet</th>
              <th>Chain</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user: any) => (
              <tr key={user.walletAddress}>
                <td>{user.rank}</td>
                <td>{user.walletAddress.slice(0, 8)}...</td>
                <td>{user.chainType}</td>
                <td>{user.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

### useResolveNameToAddress

Resolves ENS (Ethereum Name Service) or SNS (Solana Name Service) names to wallet addresses.

**API Endpoint:** `GET /wallets/named/:name`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | Yes | - | Development mode flag |
| `name` | string | Yes | - | ENS/SNS name to resolve (e.g., 'vitalik.eth') |
| `options` | UseQueryOptions | No | - | Additional React Query options for customization |

#### Returns

```typescript
UseQueryResult<NameResolutionResponse>
```

**NameResolutionResponse:**
```typescript
interface NameResolutionResponse {
  success: boolean;
  data: {
    name: string;
    address: string;
    chainType: 'evm' | 'solana';
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useResolveNameToAddress } from '@sudobility/indexer_client';

function NameResolver() {
  const [name, setName] = useState('vitalik.eth');

  const { data, isLoading, error } = useResolveNameToAddress(
    'https://indexer.0xmail.box',
    false,
    name,
    {
      enabled: !!name,  // Only run query if name is not empty
      staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    }
  );

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter ENS/SNS name"
      />

      {isLoading && <p>Resolving...</p>}
      {error && <p style={{color: 'red'}}>Error: {error.message}</p>}
      {data?.success && (
        <div>
          <h3>Resolved Address:</h3>
          <p>Name: {data.data.name}</p>
          <p>Address: {data.data.address}</p>
          <p>Chain: {data.data.chainType}</p>
        </div>
      )}
    </div>
  );
}
```

---

### useIndexerReferralStats

Gets referral statistics for a specific referral code (public endpoint).

**API Endpoint:** `POST /referrals/:referralCode/stats`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | Yes | - | Development mode flag |

#### Returns

```typescript
interface UseIndexerReferralStatsReturn {
  stats: Optional<ReferralStatsResponse>;
  isLoading: boolean;
  error: Optional<string>;
  fetchStats: (referralCode: string) => Promise<ReferralStatsResponse>;
  clearError: () => void;
  reset: () => void;
}
```

**ReferralStatsResponse:**
```typescript
interface ReferralStatsResponse {
  success: boolean;
  data: {
    walletAddress: string;
    chainType: 'evm' | 'solana';
    referralCode: string;
    totalReferred: number;
    referredWallets: Array<{
      walletAddress: string;
      chainType: 'evm' | 'solana';
      createdAt: string;
      ipAddress?: string;
    }>;
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerReferralStats } from '@sudobility/indexer_client';

function ReferralStatsDisplay({ referralCode }: { referralCode: string }) {
  const { stats, isLoading, error, fetchStats } =
    useIndexerReferralStats('https://indexer.0xmail.box', false);

  useEffect(() => {
    if (referralCode) {
      fetchStats(referralCode);
    }
  }, [referralCode, fetchStats]);

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h2>Referral Statistics</h2>
      <p>Code: {stats.data.referralCode}</p>
      <p>Total Referrals: {stats.data.totalReferred}</p>
      <p>Owner: {stats.data.walletAddress}</p>

      <h3>Referred Wallets:</h3>
      <ul>
        {stats.data.referredWallets.map((wallet, idx) => (
          <li key={idx}>
            {wallet.walletAddress} ({wallet.chainType}) - {new Date(wallet.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Signature-Protected Endpoints

All endpoints in this section require `IndexerUserAuth` credentials. See the [Authentication](#authentication) section for details.

---

### useIndexerGetWalletAccounts

Gets email accounts associated with a wallet address. This is the primary endpoint for retrieving user email accounts and also handles referral code consumption.

**API Endpoint:** `GET /wallets/:walletAddress/accounts`

**Headers:**
- `x-signature`: Wallet signature
- `x-message`: Signed message (URL encoded)
- `x-referral`: Referral code (optional)

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

The `getWalletAccounts` function accepts:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address to query |
| `auth` | IndexerUserAuth | Yes | Authentication credentials (signature + message) |
| `referralCode` | string | No | Referral code to associate with new user registration |

#### Returns

```typescript
interface UseIndexerGetWalletAccountsReturn {
  getWalletAccounts: (
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**EmailAccountsResponse:**
```typescript
interface EmailAccountsResponse {
  success: boolean;
  data: {
    accounts: Array<{
      address: string;        // Email address (e.g., "user@0xmail.box")
      name?: string;          // Display name
      created: string;        // ISO timestamp
      quota: {
        allowed: number;      // Max storage in bytes
        used: number;         // Used storage in bytes
      };
    }>;
    walletAddress: string;
    chainType: 'evm' | 'solana';
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetWalletAccounts, useIndexerReferralConsumption } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function WalletAccountsViewer({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { getWalletAccounts, isLoading, error } =
    useIndexerGetWalletAccounts('https://indexer.0xmail.box', false);

  // Handle referral code if present in URL
  const { consumeReferralCode, clearReferralCode, hasPendingCode } =
    useIndexerReferralConsumption();

  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        // Get pending referral code if any
        const referralCode = hasPendingCode ? consumeReferralCode() : undefined;

        const response = await getWalletAccounts(
          walletAddress,
          auth,
          referralCode  // Pass referral code for new user registration
        );

        if (response?.success) {
          setAccounts(response.data.accounts);

          // Clear referral code after successful consumption
          if (referralCode) {
            clearReferralCode();
          }
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    }

    if (walletAddress && auth) {
      loadAccounts();
    }
  }, [walletAddress, auth, getWalletAccounts]);

  if (isLoading) return <div>Loading accounts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Email Accounts</h2>
      {accounts.length === 0 ? (
        <p>No email accounts found for this wallet</p>
      ) : (
        <ul>
          {accounts.map((account, idx) => (
            <li key={idx}>
              <strong>{account.address}</strong>
              {account.name && ` (${account.name})`}
              <br />
              Storage: {(account.quota.used / 1024 / 1024).toFixed(2)} MB / {(account.quota.allowed / 1024 / 1024).toFixed(2)} MB
              <br />
              Created: {new Date(account.created).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Important Notes:**
- If a `referralCode` is provided and this is the user's first registration, the referral will be recorded and the referrer will earn points
- The referral code is only consumed on first wallet registration, subsequent calls with the same code have no effect
- Use `useIndexerReferralConsumption` hook to automatically detect and manage referral codes from URL parameters

---

### useIndexerGetPointsBalance

Gets the points balance for a specific wallet address.

**API Endpoint:** `GET /wallets/:walletAddress/points`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address to query |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerGetPointsBalanceReturn {
  getPointsBalance: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<PointsResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**PointsResponse:**
```typescript
interface PointsResponse {
  success: boolean;
  data: {
    walletAddress: string;
    chainType: 'evm' | 'solana';
    totalPoints: number;
    breakdown: {
      Send: number;       // 5 points per email sent
      ReadBy: number;     // 25 points when recipient reads your email
      Referral: number;   // 50 points per successful referral
      Delegate: number;   // 100 points when delegating to another wallet
    };
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetPointsBalance } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function UserPointsDisplay({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { getPointsBalance, isLoading, error } =
    useIndexerGetPointsBalance('https://indexer.0xmail.box', false);

  const [points, setPoints] = useState<any>(null);

  useEffect(() => {
    async function loadPoints() {
      try {
        const response = await getPointsBalance(walletAddress, auth);
        if (response?.success) {
          setPoints(response.data);
        }
      } catch (err) {
        console.error('Failed to load points:', err);
      }
    }

    if (walletAddress && auth) {
      loadPoints();
    }
  }, [walletAddress, auth, getPointsBalance]);

  if (isLoading) return <div>Loading points...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!points) return null;

  return (
    <div>
      <h2>Your Points</h2>
      <p style={{fontSize: '2em', fontWeight: 'bold'}}>
        Total: {points.totalPoints} points
      </p>

      <h3>Breakdown:</h3>
      <ul>
        <li>Sending Emails: {points.breakdown.Send} points (5 per email)</li>
        <li>Emails Read: {points.breakdown.ReadBy} points (25 per read)</li>
        <li>Referrals: {points.breakdown.Referral} points (50 per referral)</li>
        <li>Delegations: {points.breakdown.Delegate} points (100 per delegation)</li>
      </ul>
    </div>
  );
}
```

**Points System:**
- **Send (5 points)**: Earned when sending an email
- **ReadBy (25 points)**: Earned when a recipient reads your email
- **Referral (50 points)**: Earned when someone signs up with your referral code
- **Delegate (100 points)**: Earned when delegating email access to another wallet

---

### useIndexerGetEntitlement

Checks if a wallet has premium entitlements (via RevenueCat subscription).

**API Endpoint:** `GET /wallets/:walletAddress/entitlements/`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address to check |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerGetEntitlementReturn {
  getEntitlement: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<EntitlementResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**EntitlementResponse:**
```typescript
interface EntitlementResponse {
  success: boolean;
  data: {
    hasEntitlement: boolean;
    entitlementId?: string;
    expiresAt?: string;      // ISO timestamp
    isActive: boolean;
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetEntitlement } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function PremiumFeatureGate({
  walletAddress,
  auth,
  children
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
  children: React.ReactNode;
}) {
  const { getEntitlement, isLoading, error } =
    useIndexerGetEntitlement('https://indexer.0xmail.box', false);

  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkEntitlement() {
      try {
        const response = await getEntitlement(walletAddress, auth);
        if (response?.success) {
          setHasAccess(response.data.hasEntitlement && response.data.isActive);
        }
      } catch (err) {
        console.error('Failed to check entitlement:', err);
      }
    }

    if (walletAddress && auth) {
      checkEntitlement();
    }
  }, [walletAddress, auth, getEntitlement]);

  if (isLoading) return <div>Checking subscription...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!hasAccess) {
    return (
      <div>
        <h3>Premium Feature</h3>
        <p>This feature requires a premium subscription.</p>
        <button>Subscribe Now</button>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

### useIndexerGetDelegatedTo

Gets the latest wallet address that this wallet has delegated email access to.

**API Endpoint:** `GET /delegations/from/:walletAddress`

**Delegation Concept:** Allows a wallet to delegate email account access to another wallet. The delegated-to wallet can then access and manage emails on behalf of the delegating wallet.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address (delegator) |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerGetDelegatedToReturn {
  getDelegatedTo: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<DelegatedToResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**DelegatedToResponse:**
```typescript
interface DelegatedToResponse {
  success: boolean;
  data: {
    hasDelegation: boolean;
    delegatedTo?: {
      address: string;      // Wallet address delegated to
      chainType: 'evm' | 'solana';
      createdAt: string;    // ISO timestamp
    };
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetDelegatedTo } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function DelegationStatus({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { getDelegatedTo, isLoading, error } =
    useIndexerGetDelegatedTo('https://indexer.0xmail.box', false);

  const [delegation, setDelegation] = useState<any>(null);

  useEffect(() => {
    async function checkDelegation() {
      try {
        const response = await getDelegatedTo(walletAddress, auth);
        if (response?.success) {
          setDelegation(response.data);
        }
      } catch (err) {
        console.error('Failed to check delegation:', err);
      }
    }

    if (walletAddress && auth) {
      checkDelegation();
    }
  }, [walletAddress, auth, getDelegatedTo]);

  if (isLoading) return <div>Checking delegation...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!delegation) return null;

  return (
    <div>
      <h3>Delegation Status</h3>
      {delegation.hasDelegation ? (
        <div>
          <p>✓ Email access delegated to:</p>
          <p><strong>{delegation.delegatedTo.address}</strong></p>
          <p>Chain: {delegation.delegatedTo.chainType}</p>
          <p>Since: {new Date(delegation.delegatedTo.createdAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No active delegation</p>
      )}
    </div>
  );
}
```

---

### useIndexerGetDelegatedFrom

Gets all wallet addresses that have delegated email access TO this wallet (reverse delegation lookup).

**API Endpoint:** `GET /delegations/to/:walletAddress`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | string | Yes | Wallet address (delegate) |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerGetDelegatedFromReturn {
  getDelegatedFrom: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<DelegatedFromResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**DelegatedFromResponse:**
```typescript
interface DelegatedFromResponse {
  success: boolean;
  data: {
    delegations: Array<{
      address: string;         // Wallet address that delegated to you
      chainType: 'evm' | 'solana';
      createdAt: string;       // ISO timestamp
    }>;
    count: number;
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerGetDelegatedFrom } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function DelegatedAccountsList({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { getDelegatedFrom, isLoading, error } =
    useIndexerGetDelegatedFrom('https://indexer.0xmail.box', false);

  const [delegators, setDelegators] = useState<any[]>([]);

  useEffect(() => {
    async function loadDelegators() {
      try {
        const response = await getDelegatedFrom(walletAddress, auth);
        if (response?.success) {
          setDelegators(response.data.delegations);
        }
      } catch (err) {
        console.error('Failed to load delegators:', err);
      }
    }

    if (walletAddress && auth) {
      loadDelegators();
    }
  }, [walletAddress, auth, getDelegatedFrom]);

  if (isLoading) return <div>Loading delegated accounts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Accounts You Manage</h2>
      {delegators.length === 0 ? (
        <p>No accounts have delegated access to you</p>
      ) : (
        <>
          <p>You can manage email for {delegators.length} account(s):</p>
          <ul>
            {delegators.map((delegator, idx) => (
              <li key={idx}>
                <strong>{delegator.address}</strong> ({delegator.chainType})
                <br />
                Delegated since: {new Date(delegator.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

---

### useIndexerCreateNonce

Creates a new authentication nonce for a username. Nonces are used in the WildDuck mail server authentication flow.

**API Endpoint:** `POST /users/:username/nonce`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Email username (without @domain) |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerCreateNonceReturn {
  createNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<NonceResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**NonceResponse:**
```typescript
interface NonceResponse {
  success: boolean;
  data: {
    nonce: string;           // Unique nonce value
    username: string;
    expiresAt: string;       // ISO timestamp
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerCreateNonce } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function EmailAuthFlow({
  username,
  auth
}: {
  username: string;
  auth: IndexerUserAuth;
}) {
  const { createNonce, isLoading, error } =
    useIndexerCreateNonce('https://indexer.0xmail.box', false);

  const [nonce, setNonce] = useState<string | null>(null);

  const handleCreateNonce = async () => {
    try {
      const response = await createNonce(username, auth);
      if (response?.success) {
        setNonce(response.data.nonce);
        console.log('Nonce created:', response.data.nonce);
        console.log('Expires at:', response.data.expiresAt);

        // Use this nonce for email server authentication
        // The nonce will be used by WildDuck to verify the user
      }
    } catch (err) {
      console.error('Failed to create nonce:', err);
    }
  };

  return (
    <div>
      <button onClick={handleCreateNonce} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Auth Nonce'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {nonce && <p>Nonce: {nonce}</p>}
    </div>
  );
}
```

---

### useIndexerGetNonce

Retrieves an existing authentication nonce for a username.

**API Endpoint:** `GET /users/:username/nonce`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Email username (without @domain) |
| `auth` | IndexerUserAuth | Yes | Authentication credentials |

#### Returns

```typescript
interface UseIndexerGetNonceReturn {
  getNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<NonceResponse>>;
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

**NonceResponse:** Same as `useIndexerCreateNonce`

#### Example Usage

```typescript
import { useIndexerGetNonce } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function CheckExistingNonce({
  username,
  auth
}: {
  username: string;
  auth: IndexerUserAuth;
}) {
  const { getNonce, isLoading, error } =
    useIndexerGetNonce('https://indexer.0xmail.box', false);

  const [nonce, setNonce] = useState<any>(null);

  const handleCheckNonce = async () => {
    try {
      const response = await getNonce(username, auth);
      if (response?.success) {
        setNonce(response.data);

        // Check if nonce is still valid
        const expiresAt = new Date(response.data.expiresAt);
        const isExpired = expiresAt < new Date();

        if (isExpired) {
          console.log('Nonce has expired, create a new one');
        } else {
          console.log('Nonce is valid until:', expiresAt);
        }
      }
    } catch (err) {
      console.error('Failed to get nonce:', err);
    }
  };

  return (
    <div>
      <button onClick={handleCheckNonce} disabled={isLoading}>
        Check Nonce
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {nonce && (
        <div>
          <p>Nonce: {nonce.nonce}</p>
          <p>Expires: {new Date(nonce.expiresAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
```

---

### useWalletNames

Gets all ENS/SNS names associated with a wallet address. Uses React Query's `useQuery` for automatic caching and refetching.

**API Endpoint:** `GET /wallets/:walletAddress/names`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | Yes | - | Development mode flag |
| `walletAddress` | string | Yes | - | Wallet address to query |
| `auth` | IndexerUserAuth | Yes | - | Authentication credentials |
| `options` | UseQueryOptions | No | - | Additional React Query options |

#### Returns

```typescript
UseQueryResult<NameServiceResponse>
```

**NameServiceResponse:**
```typescript
interface NameServiceResponse {
  success: boolean;
  data: {
    walletAddress: string;
    chainType: 'evm' | 'solana';
    names: string[];         // Array of ENS/SNS names
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useWalletNames } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function WalletNamesDisplay({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { data, isLoading, error, refetch } = useWalletNames(
    'https://indexer.0xmail.box',
    false,
    walletAddress,
    auth,
    {
      enabled: !!walletAddress && !!auth.signature,
      staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
      retry: 2,
    }
  );

  if (isLoading) return <div>Loading names...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data?.success) return <div>Failed to load names</div>;

  return (
    <div>
      <h3>Your ENS/SNS Names</h3>
      {data.data.names.length === 0 ? (
        <p>No ENS/SNS names found for this wallet</p>
      ) : (
        <ul>
          {data.data.names.map((name, idx) => (
            <li key={idx}>{name}</li>
          ))}
        </ul>
      )}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

---

### useIndexerReferralCode

Gets or creates a referral code for a wallet. Each wallet gets one unique referral code.

**API Endpoint:** `POST /wallets/:walletAddress/referral`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | Yes | - | Development mode flag |

#### Returns

```typescript
interface UseIndexerReferralCodeReturn {
  referralCode: Optional<ReferralCodeResponse>;
  isLoading: boolean;
  error: Optional<string>;
  fetchReferralCode: (walletAddress: string, auth: IndexerUserAuth) => Promise<ReferralCodeResponse>;
  clearError: () => void;
  reset: () => void;
}
```

**ReferralCodeResponse:**
```typescript
interface ReferralCodeResponse {
  success: boolean;
  data: {
    walletAddress: string;
    chainType: 'evm' | 'solana';
    referralCode: string;       // Unique referral code (e.g., "ABC123DEF")
    totalRedemptions: number;   // How many times this code has been used
    lastUsedAt?: string;        // ISO timestamp of last usage
    createdAt: string;          // ISO timestamp
  };
  error: Optional<string>;
  timestamp: string;
}
```

#### Example Usage

```typescript
import { useIndexerReferralCode } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function ReferralCodeManager({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { referralCode, isLoading, error, fetchReferralCode } =
    useIndexerReferralCode('https://indexer.0xmail.box', false);

  useEffect(() => {
    if (walletAddress && auth) {
      fetchReferralCode(walletAddress, auth);
    }
  }, [walletAddress, auth, fetchReferralCode]);

  const copyToClipboard = () => {
    if (referralCode?.data.referralCode) {
      navigator.clipboard.writeText(referralCode.data.referralCode);
      alert('Referral code copied!');
    }
  };

  if (isLoading) return <div>Loading referral code...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!referralCode) return null;

  return (
    <div>
      <h2>Your Referral Code</h2>
      <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>
        {referralCode.data.referralCode}
      </div>
      <button onClick={copyToClipboard}>Copy Code</button>

      <div style={{marginTop: '1em'}}>
        <p>Total uses: {referralCode.data.totalRedemptions}</p>
        {referralCode.data.lastUsedAt && (
          <p>Last used: {new Date(referralCode.data.lastUsedAt).toLocaleDateString()}</p>
        )}
        <p>Points earned: {referralCode.data.totalRedemptions * 50}</p>
      </div>
    </div>
  );
}
```

---

## Utility Hooks

### useIndexerReferralShare

Combines referral code fetching with URL generation for easy sharing.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | Yes | - | Development mode flag |

#### Returns

```typescript
interface UseIndexerReferralShareReturn {
  referralCode: Optional<string>;  // Just the code string
  isLoading: boolean;
  error: Optional<string>;
  getShareUrl: (
    baseUrl: string,
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<string>;  // Returns full URL with referral parameter
}
```

#### Example Usage

```typescript
import { useIndexerReferralShare } from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function ShareReferralButton({
  walletAddress,
  auth
}: {
  walletAddress: string;
  auth: IndexerUserAuth;
}) {
  const { getShareUrl, isLoading, error } =
    useIndexerReferralShare('https://indexer.0xmail.box', false);

  const handleShare = async () => {
    try {
      // Generate share URL with referral code
      const shareUrl = await getShareUrl(
        'https://app.0xmail.box',
        walletAddress,
        auth
      );

      // shareUrl will be something like:
      // "https://app.0xmail.box?referral=ABC123DEF"

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');

      // Or use Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Join 0xMail',
          text: 'Sign up for 0xMail using my referral link!',
          url: shareUrl
        });
      }
    } catch (err) {
      console.error('Failed to generate share URL:', err);
    }
  };

  return (
    <button onClick={handleShare} disabled={isLoading}>
      {isLoading ? 'Generating...' : 'Share Referral Link'}
    </button>
  );
}
```

---

### useIndexerReferralConsumption

Manages referral code consumption from URL parameters and localStorage. Automatically detects referral codes in URL and persists them until consumed.

#### Parameters

None - this hook works automatically

#### Returns

```typescript
interface UseIndexerReferralConsumptionReturn {
  pendingReferralCode: Optional<string>;
  hasPendingCode: boolean;
  consumeReferralCode: () => Optional<string>;  // Returns code but doesn't delete it
  clearReferralCode: () => void;                 // Deletes after successful consumption
  setReferralCode: (code: string) => void;       // Manually set a code
}
```

#### Flow

1. On app load, checks URL for `?referral=XXX` parameter
2. If found, saves to `localStorage` and removes from URL
3. Code persists until explicitly cleared
4. When calling `getWalletAccounts`, pass the code from `consumeReferralCode()`
5. After successful API call, call `clearReferralCode()`

#### Example Usage

```typescript
import {
  useIndexerReferralConsumption,
  useIndexerGetWalletAccounts
} from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function App() {
  // This hook automatically checks URL on mount
  const {
    pendingReferralCode,
    hasPendingCode,
    consumeReferralCode,
    clearReferralCode
  } = useIndexerReferralConsumption();

  const { getWalletAccounts } = useIndexerGetWalletAccounts(
    'https://indexer.0xmail.box',
    false
  );

  // Show banner if there's a pending referral code
  useEffect(() => {
    if (hasPendingCode) {
      console.log('Referral code detected:', pendingReferralCode);
      // Show UI notification: "You have a referral code! Connect your wallet to claim it."
    }
  }, [hasPendingCode, pendingReferralCode]);

  const handleWalletConnect = async (walletAddress: string, auth: IndexerUserAuth) => {
    try {
      // Get the referral code (doesn't delete it yet)
      const referralCode = consumeReferralCode();

      // Call API with referral code
      const accounts = await getWalletAccounts(
        walletAddress,
        auth,
        referralCode  // This will be undefined if no pending code
      );

      // If successful and we had a referral code, clear it
      if (accounts?.success && referralCode) {
        clearReferralCode();
        console.log('Referral code successfully used!');
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      // Don't clear referral code on error - user can try again
    }
  };

  return (
    <div>
      {hasPendingCode && (
        <div style={{background: 'yellow', padding: '1em'}}>
          ⭐ You have a referral code! Connect your wallet to activate it.
        </div>
      )}
      {/* Rest of app */}
    </div>
  );
}
```

**Complete Referral Flow Example:**

User A shares: `https://app.0xmail.box?referral=ABC123`

User B visits the link:
1. `useIndexerReferralConsumption` detects `?referral=ABC123`
2. Saves to localStorage
3. Cleans URL to `https://app.0xmail.box`
4. Shows banner: "You have a referral code!"

User B connects wallet:
1. App calls `consumeReferralCode()` → returns "ABC123"
2. Passes to `getWalletAccounts(address, auth, "ABC123")`
3. Backend records the referral
4. App calls `clearReferralCode()` to remove from localStorage
5. User A earns 50 points

---

## Legacy Hooks

### useIndexerMail

**⚠️ DEPRECATED**: This is a legacy monolithic hook that provides all endpoint functions in one hook. It's recommended to use individual endpoint hooks instead for better tree-shaking and clarity.

**Why deprecated:**
- Large bundle size (includes all endpoints even if you only need one)
- Less clear which endpoints you're actually using
- Harder to test and maintain

**Migration guide:**
```typescript
// OLD (deprecated)
const { getWalletAccounts, validateUsername } = useIndexerMail(url, dev);

// NEW (recommended)
const { getWalletAccounts } = useIndexerGetWalletAccounts(url, dev);
const { validateUsername } = useIndexerValidateUsername(url, dev);
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `endpointUrl` | string | Yes | - | Base URL of the indexer API |
| `dev` | boolean | No | false | Development mode flag |

#### Returns

```typescript
interface UseIndexerMailReturn {
  // Public endpoints
  validateUsername: (username: string) => Promise<Optional<AddressValidationResponse>>;
  getSigningMessage: (
    chainId: number,
    walletAddress: string,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;

  // Signature-protected endpoints
  getWalletAccounts: (
    walletAddress: string,
    auth: IndexerUserAuth,
    referralCode?: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  getDelegatedTo: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<DelegatedToResponse>>;
  getDelegatedFrom: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<DelegatedFromResponse>>;
  createNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<NonceResponse>>;
  getNonce: (
    username: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<NonceResponse>>;
  getEntitlement: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<EntitlementResponse>>;
  getPointsBalance: (
    walletAddress: string,
    auth: IndexerUserAuth
  ) => Promise<Optional<PointsResponse>>;

  // State
  isLoading: boolean;
  error: Optional<string>;
  clearError: () => void;
}
```

#### Example Usage

```typescript
import { useIndexerMail } from '@sudobility/indexer_client';

// This works but is NOT recommended
function LegacyComponent() {
  const {
    validateUsername,
    getWalletAccounts,
    isLoading,
    error
  } = useIndexerMail('https://indexer.0xmail.box', false);

  // Use the functions...
}
```

**Instead, use individual hooks:**

```typescript
import {
  useIndexerValidateUsername,
  useIndexerGetWalletAccounts
} from '@sudobility/indexer_client';

// This is the recommended approach
function ModernComponent() {
  const { validateUsername, isLoading: validating, error: validationError } =
    useIndexerValidateUsername('https://indexer.0xmail.box', false);

  const { getWalletAccounts, isLoading: loading, error: accountError } =
    useIndexerGetWalletAccounts('https://indexer.0xmail.box', false);

  // Use the functions with independent loading states...
}
```

---

## Common Patterns

### Pattern 1: Authentication Flow

```typescript
import {
  useIndexerGetSigningMessage,
  useIndexerGetWalletAccounts
} from '@sudobility/indexer_client';
import type { IndexerUserAuth } from '@sudobility/indexer_client';

function AuthenticatedApp({ walletAddress, chainId }: Props) {
  const [auth, setAuth] = useState<IndexerUserAuth | null>(null);

  const { getSigningMessage } = useIndexerGetSigningMessage(
    'https://indexer.0xmail.box',
    false
  );

  const { getWalletAccounts } = useIndexerGetWalletAccounts(
    'https://indexer.0xmail.box',
    false
  );

  // Step 1: Sign in
  const handleSignIn = async () => {
    const messageData = await getSigningMessage(
      walletAddress,
      chainId,
      'app.0xmail.box',
      'https://app.0xmail.box'
    );

    const signature = await walletProvider.signMessage(messageData.data.message);

    const credentials: IndexerUserAuth = {
      message: messageData.data.message,
      signature
    };

    setAuth(credentials);
  };

  // Step 2: Use authenticated endpoints
  const loadUserData = async () => {
    if (!auth) return;

    const accounts = await getWalletAccounts(walletAddress, auth);
    // ... use accounts
  };

  return (
    <div>
      {!auth ? (
        <button onClick={handleSignIn}>Sign In</button>
      ) : (
        <button onClick={loadUserData}>Load My Data</button>
      )}
    </div>
  );
}
```

### Pattern 2: Referral System Integration

```typescript
import {
  useIndexerReferralConsumption,
  useIndexerReferralCode,
  useIndexerReferralShare,
  useIndexerReferralStats
} from '@sudobility/indexer_client';

function ReferralSystem({ walletAddress, auth }: Props) {
  // Handle incoming referrals
  const { hasPendingCode, consumeReferralCode, clearReferralCode } =
    useIndexerReferralConsumption();

  // Get user's referral code
  const { referralCode, fetchReferralCode } =
    useIndexerReferralCode('https://indexer.0xmail.box', false);

  // Generate share links
  const { getShareUrl } =
    useIndexerReferralShare('https://indexer.0xmail.box', false);

  // View stats
  const { stats, fetchStats } =
    useIndexerReferralStats('https://indexer.0xmail.box', false);

  useEffect(() => {
    if (walletAddress && auth) {
      // Fetch user's referral code
      fetchReferralCode(walletAddress, auth);
    }
  }, [walletAddress, auth]);

  useEffect(() => {
    if (referralCode?.data.referralCode) {
      // Load stats for this code
      fetchStats(referralCode.data.referralCode);
    }
  }, [referralCode]);

  const handleShare = async () => {
    const url = await getShareUrl(
      'https://app.0xmail.box',
      walletAddress,
      auth
    );
    navigator.clipboard.writeText(url);
  };

  return (
    <div>
      {hasPendingCode && (
        <div>You have a pending referral code!</div>
      )}

      <div>
        <h3>Your Referral Code: {referralCode?.data.referralCode}</h3>
        <button onClick={handleShare}>Share Link</button>
      </div>

      <div>
        <h3>Your Referral Stats</h3>
        <p>Total Referrals: {stats?.data.totalReferred}</p>
        <p>Points Earned: {(stats?.data.totalReferred || 0) * 50}</p>
      </div>
    </div>
  );
}
```

### Pattern 3: Points Dashboard

```typescript
import {
  useIndexerGetPointsBalance,
  useIndexerPoints
} from '@sudobility/indexer_client';

function PointsDashboard({ walletAddress, auth }: Props) {
  const { getPointsBalance } = useIndexerGetPointsBalance(
    'https://indexer.0xmail.box',
    false
  );

  const { getPointsLeaderboard, getPointsSiteStats } = useIndexerPoints(
    'https://indexer.0xmail.box',
    false
  );

  const [userPoints, setUserPoints] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [siteStats, setSiteStats] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // Load user's points
      const points = await getPointsBalance(walletAddress, auth);
      setUserPoints(points?.data);

      // Load leaderboard
      const leaders = await getPointsLeaderboard(100);
      setLeaderboard(leaders.data.leaderboard);

      // Load site stats
      const stats = await getPointsSiteStats();
      setSiteStats(stats.data);
    }

    if (walletAddress && auth) {
      loadData();
    }
  }, [walletAddress, auth]);

  return (
    <div>
      <h2>Your Points: {userPoints?.totalPoints}</h2>

      <h3>Breakdown:</h3>
      <ul>
        <li>Emails Sent: {userPoints?.breakdown.Send}</li>
        <li>Emails Read: {userPoints?.breakdown.ReadBy}</li>
        <li>Referrals: {userPoints?.breakdown.Referral}</li>
        <li>Delegations: {userPoints?.breakdown.Delegate}</li>
      </ul>

      <h3>Leaderboard</h3>
      {/* Render leaderboard */}

      <h3>Site Statistics</h3>
      <p>Total Users: {siteStats?.totalUsers}</p>
      <p>Total Points: {siteStats?.totalPoints}</p>
    </div>
  );
}
```

---

## Error Handling

All hooks provide consistent error handling:

```typescript
const { someFunction, isLoading, error, clearError } = useSomeHook(...);

try {
  const result = await someFunction(...);
  // Success - result contains the data
} catch (err) {
  // Error is also available in the `error` state
  console.error('API call failed:', error);

  // Clear error when user dismisses
  clearError();
}
```

Common error scenarios:
- **Network errors**: "Indexer API request failed: Network Error"
- **Authentication errors**: "Failed to get wallet accounts: Invalid signature"
- **Not found errors**: "Failed to get nonce: Nonce not found"
- **Validation errors**: "Failed to validate username: Invalid format"

---

## TypeScript Support

All hooks and types are fully typed. Import types from the package:

```typescript
import type {
  IndexerUserAuth,
  AddressValidationResponse,
  SignInMessageResponse,
  EmailAccountsResponse,
  PointsResponse,
  EntitlementResponse,
  DelegatedToResponse,
  DelegatedFromResponse,
  NonceResponse,
  NameServiceResponse,
  NameResolutionResponse,
  LeaderboardResponse,
  SiteStatsResponse,
  ReferralCodeResponse,
  ReferralStatsResponse,
} from '@sudobility/indexer_client';
```

---

## Development Mode

The `dev` parameter (boolean) controls whether the `x-dev: true` header is sent to the backend. This is useful for:

- Testing against development/staging environments
- Bypassing certain production restrictions
- Enabling additional logging on the backend

```typescript
// Production
const hook = useIndexerHook('https://indexer.0xmail.box', false);

// Development
const hook = useIndexerHook('https://dev-indexer.0xmail.box', true);
```

**Note:** The `dev` parameter does NOT enable mock data - all hooks make real API calls.

---

## Additional Resources

- **Backend API Documentation**: See `../mail_box_indexer/docs/API.md` for complete API specifications
- **Type Definitions**: See `@sudobility/types` package for shared type definitions
- **Example Apps**: Check the integration tests in `src/__integration__/` for working examples
