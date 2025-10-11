# Code Examples

Complete examples for common use cases with the 0xMail Indexer Client.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Authentication Flow](#authentication-flow)
- [User Accounts & Email](#user-accounts--email)
- [Points System](#points-system)
- [Referral System](#referral-system)
- [Delegation](#delegation)
- [Name Service (ENS/SNS)](#name-service-enssns)
- [React Hooks](#react-hooks)
- [Error Handling](#error-handling)

## Basic Setup

### Installing the Package

```bash
npm install @johnqh/indexer_client @johnqh/types @tanstack/react-query axios
```

### Creating a Client Instance

```typescript
import { IndexerClient } from '@johnqh/indexer_client';

const client = new IndexerClient(
  'https://indexer.0xmail.box',  // Endpoint URL
  false                           // Dev mode (false for production)
);
```

### React Query Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## Authentication Flow

### Step 1: Validate Wallet Address

```typescript
import { IndexerClient } from '@johnqh/indexer_client';

const client = new IndexerClient('https://indexer.0xmail.box', false);

async function validateWallet(address: string) {
  try {
    const result = await client.validateUsername(address);

    if (result.success && result.data?.isValid) {
      console.log('Valid wallet:', result.data.normalized);
      console.log('Chain type:', result.data.chainType);
      return result.data;
    } else {
      console.error('Invalid wallet address');
      return null;
    }
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

// Example usage
const walletData = await validateWallet('0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb');
```

### Step 2: Generate Signing Message

```typescript
async function getSigningMessage(
  walletAddress: string,
  chainId: number,
  domain: string = '0xmail.box',
  url: string = 'https://0xmail.box'
) {
  const result = await client.getMessage(walletAddress, chainId, domain, url);

  if (result.success && result.data) {
    return result.data.message;
  }

  throw new Error('Failed to generate message');
}

// Example usage
const message = await getSigningMessage(
  '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb',
  1,  // Ethereum mainnet
  '0xmail.box',
  'https://0xmail.box'
);

console.log('Sign this message:', message);
```

### Step 3: Sign Message with Wallet

```typescript
// Using ethers.js (EVM)
import { ethers } from 'ethers';

async function signMessage(message: string): Promise<string> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);
  return signature;
}

// Using @solana/wallet-adapter (Solana)
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

function SolanaSigningComponent() {
  const { publicKey, signMessage } = useWallet();

  async function signSolanaMessage(message: string): Promise<string> {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }

    const encodedMessage = new TextEncoder().encode(message);
    const signature = await signMessage(encodedMessage);
    return bs58.encode(signature);
  }

  // ...
}
```

### Step 4: Make Authenticated Request

```typescript
async function getWalletAccounts(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getWalletAccounts(
    walletAddress,
    signature,
    message
  );

  if (result.success && result.data) {
    return result.data.accounts;
  }

  throw new Error(result.error || 'Failed to get accounts');
}

// Complete flow
async function authenticateAndGetAccounts(walletAddress: string, chainId: number) {
  // 1. Generate message
  const message = await getSigningMessage(walletAddress, chainId);

  // 2. Sign message
  const signature = await signMessage(message);

  // 3. Get accounts
  const accounts = await getWalletAccounts(walletAddress, signature, message);

  return accounts;
}
```

## User Accounts & Email

### Get All Email Accounts

```typescript
async function getAllEmailAccounts(
  walletAddress: string,
  signature: string,
  message: string,
  referralCode?: string
) {
  const result = await client.getWalletAccounts(
    walletAddress,
    signature,
    message,
    referralCode  // Optional: apply referral code on first use
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to get accounts');
  }

  // Extract all email addresses
  const allEmails: string[] = [];

  for (const account of result.data.accounts) {
    // Primary email
    allEmails.push(account.primaryAccount);

    // Domain emails (ENS/SNS)
    for (const domainAccount of account.domainAccounts) {
      if (domainAccount.verified && domainAccount.entitled) {
        allEmails.push(domainAccount.account);
      }
    }
  }

  return {
    accounts: result.data.accounts,
    emails: allEmails
  };
}

// Example usage
const { accounts, emails } = await getAllEmailAccounts(
  '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb',
  signature,
  message,
  'ABC123XYZ'  // Apply referral code
);

console.log('Your email addresses:');
emails.forEach(email => console.log('-', email));
```

### Check Name Service Entitlement

```typescript
async function checkNameServiceSubscription(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getEntitlement(walletAddress, signature, message);

  if (result.success && result.data) {
    if (result.data.entitled) {
      console.log('✅ Subscribed to name service');
      console.log('Product:', result.data.subscription?.productId);
      console.log('Expires:', result.data.subscription?.expiresAt);
      return true;
    } else {
      console.log('❌ No active subscription');
      return false;
    }
  }

  return false;
}
```

## Points System

### Get User Points Balance

```typescript
async function getUserPoints(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getPointsBalance(walletAddress, signature, message);

  if (result.success && result.data) {
    return {
      points: result.data.pointsEarned,
      lastActivity: result.data.lastActivityDate,
      createdAt: result.data.createdAt
    };
  }

  throw new Error(result.error || 'Failed to get points');
}

// Example usage
const points = await getUserPoints(wallet, signature, message);
console.log(`You have ${points.points} points`);
```

### Get Points Leaderboard

```typescript
async function getTopUsers(count: number = 10) {
  const result = await client.getPointsLeaderboard(count);

  if (result.success && result.data?.leaderboard) {
    return result.data.leaderboard.map((user, index) => ({
      rank: index + 1,
      address: user.walletAddress,
      points: user.pointsEarned,
      chainType: user.chainType,
      lastActivity: user.lastActivityDate
    }));
  }

  return [];
}

// Example usage
const leaderboard = await getTopUsers(10);
leaderboard.forEach(user => {
  console.log(`${user.rank}. ${user.address} - ${user.points} points`);
});
```

### Get Site Statistics

```typescript
async function getSiteStats() {
  const result = await client.getPointsSiteStats();

  if (result.success && result.data) {
    return {
      totalPoints: result.data.totalPoints,
      totalUsers: result.data.totalUsers,
      lastUpdated: result.data.lastUpdated
    };
  }

  return null;
}

// Example usage
const stats = await getSiteStats();
console.log(`Total users: ${stats.totalUsers}`);
console.log(`Total points: ${stats.totalPoints}`);
```

## Referral System

### Generate Referral Code

```typescript
async function getMyReferralCode(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getReferralCode(walletAddress, signature, message);

  if (result.success && result.data) {
    return {
      code: result.data.referralCode,
      totalRedemptions: result.data.totalRedemptions,
      createdAt: result.data.createdAt
    };
  }

  throw new Error(result.error || 'Failed to get referral code');
}

// Example usage
const referral = await getMyReferralCode(wallet, signature, message);
console.log(`Your referral code: ${referral.code}`);
console.log(`Used ${referral.totalRedemptions} times`);
```

### Get Referral Statistics

```typescript
async function getReferralStatistics(referralCode: string) {
  const result = await client.getReferralStats(referralCode);

  if (result.success && result.data) {
    return {
      code: result.data.referralCode,
      totalReferred: result.data.totalReferred,
      referredWallets: result.data.referredWallets.map(wallet => ({
        address: wallet.walletAddress,
        chainType: wallet.chainType,
        joinedAt: wallet.createdAt
      }))
    };
  }

  throw new Error(result.error || 'Failed to get stats');
}

// Example usage
const stats = await getReferralStatistics('ABC123XYZ');
console.log(`Code: ${stats.code}`);
console.log(`Total referrals: ${stats.totalReferred}`);
stats.referredWallets.forEach(wallet => {
  console.log(`- ${wallet.address} (joined ${wallet.joinedAt})`);
});
```

### Apply Referral Code

```typescript
// Referral codes are applied via x-referral header on first /accounts call
async function joinWithReferralCode(
  walletAddress: string,
  signature: string,
  message: string,
  referralCode: string
) {
  // The referral code is applied automatically on first call
  const result = await client.getWalletAccounts(
    walletAddress,
    signature,
    message,
    referralCode  // Applied only if this is the first call for this wallet
  );

  if (result.success) {
    console.log('✅ Referral code applied successfully');
    return result.data;
  } else {
    throw new Error(result.error || 'Failed to apply referral code');
  }
}
```

## Delegation

### Get Who You Delegated To

```typescript
async function getMyDelegate(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getDelegatedTo(walletAddress, signature, message);

  if (result.success && result.data) {
    return {
      delegator: result.data.delegator,
      delegate: result.data.delegate,
      chainId: result.data.chainId,
      isActive: result.data.isActive,
      timestamp: result.data.timestamp
    };
  }

  return null;  // No delegation
}

// Example usage
const delegation = await getMyDelegate(wallet, signature, message);
if (delegation) {
  console.log(`You delegated to: ${delegation.delegate}`);
  console.log(`Status: ${delegation.isActive ? 'Active' : 'Inactive'}`);
} else {
  console.log('No delegation set');
}
```

### Get Who Delegated To You

```typescript
async function getMyDelegators(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getDelegatedFrom(walletAddress, signature, message);

  if (result.success && result.data?.delegators) {
    return result.data.delegators.map(delegator => ({
      address: delegator.delegator,
      chainId: delegator.chainId,
      isActive: delegator.isActive,
      timestamp: delegator.timestamp
    }));
  }

  return [];
}

// Example usage
const delegators = await getMyDelegators(wallet, signature, message);
console.log(`${delegators.length} wallet(s) delegated to you:`);
delegators.forEach(delegator => {
  console.log(`- ${delegator.address} (chain ${delegator.chainId})`);
});
```

## Name Service (ENS/SNS)

### Resolve Name to Address

```typescript
async function resolveName(name: string) {
  const result = await client.resolveNameToAddress(name);

  if (result.success && result.data) {
    return {
      name: result.data.name,
      address: result.data.address,
      chainType: result.data.chainType
    };
  }

  return null;
}

// Example usage
const resolved = await resolveName('vitalik.eth');
if (resolved) {
  console.log(`${resolved.name} → ${resolved.address}`);
  console.log(`Chain: ${resolved.chainType}`);
} else {
  console.log('Name not found');
}
```

### Get All Names for Wallet

```typescript
async function getWalletNames(
  walletAddress: string,
  signature: string,
  message: string
) {
  const result = await client.getWalletNames(walletAddress, signature, message);

  if (result.success && result.data?.names) {
    return result.data.names;
  }

  return [];
}

// Example usage
const names = await getWalletNames(wallet, signature, message);
console.log('Your names:');
names.forEach(name => console.log(`- ${name}`));
```

## React Hooks

### Using Points Hook

```typescript
import { useIndexerPoints } from '@johnqh/indexer_client';

function PointsDisplay({ wallet, signature, message }) {
  const { data, isLoading, error } = useIndexerPoints(
    'https://indexer.0xmail.box',
    false,  // dev mode
    wallet,
    signature,
    message
  );

  if (isLoading) return <div>Loading points...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data?.success) return <div>Failed to load points</div>;

  return (
    <div>
      <h2>Your Points</h2>
      <p className="points">{data.data.pointsEarned}</p>
      <p className="date">
        Last activity: {new Date(data.data.lastActivityDate).toLocaleDateString()}
      </p>
    </div>
  );
}
```

### Using Mail Hook

```typescript
import { useIndexerMail } from '@johnqh/indexer_client';

function EmailAccounts({ wallet, signature, message }) {
  const { data, isLoading, refetch } = useIndexerMail(
    'https://indexer.0xmail.box',
    false,
    wallet,
    signature,
    message
  );

  if (isLoading) return <div>Loading accounts...</div>;
  if (!data?.success) return <div>Failed to load accounts</div>;

  return (
    <div>
      <h2>Your Email Accounts</h2>
      {data.data.accounts.map((account, index) => (
        <div key={index}>
          <h3>{account.isPrimary ? 'Primary' : 'Delegated'}</h3>
          <p>{account.primaryAccount}</p>

          {account.domainAccounts.length > 0 && (
            <div>
              <h4>Domain Emails</h4>
              {account.domainAccounts.map((domain, i) => (
                <div key={i}>
                  <p>{domain.account}</p>
                  <span>{domain.type.toUpperCase()}</span>
                  {domain.entitled ? (
                    <span className="badge-success">Subscribed</span>
                  ) : (
                    <span className="badge-warning">Subscription Required</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Using Referral Hook

```typescript
import { useIndexerReferralCode } from '@johnqh/indexer_client';

function ReferralCodeDisplay({ wallet, signature, message }) {
  const { data, isLoading } = useIndexerReferralCode(
    'https://indexer.0xmail.box',
    false,
    wallet,
    signature,
    message
  );

  if (isLoading) return <div>Loading...</div>;
  if (!data?.success) return null;

  const { referralCode, totalRedemptions } = data.data;
  const referralUrl = `https://0xmail.box?ref=${referralCode}`;

  return (
    <div className="referral-card">
      <h3>Your Referral Code</h3>
      <div className="code">{referralCode}</div>
      <p>Used {totalRedemptions} times</p>

      <div className="share">
        <input
          type="text"
          value={referralUrl}
          readOnly
          onClick={(e) => e.target.select()}
        />
        <button onClick={() => navigator.clipboard.writeText(referralUrl)}>
          Copy Link
        </button>
      </div>
    </div>
  );
}
```

## Error Handling

### Handling API Errors

```typescript
async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

// Example usage
const result = await safeApiCall(() =>
  client.getPointsBalance(wallet, signature, message)
);

if (result.success) {
  console.log('Points:', result.data.data.pointsEarned);
} else {
  console.error('Error:', result.error);
}
```

### Retry Logic

```typescript
async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Example usage
const points = await retryApiCall(
  () => client.getPointsBalance(wallet, signature, message),
  3,
  2000
);
```

### React Error Boundary

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Indexer client error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <IndexerApp />
    </ErrorBoundary>
  );
}
```

## Complete Example App

```typescript
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndexerClient, useIndexerMail, useIndexerPoints } from '@johnqh/indexer_client';
import { ethers } from 'ethers';

const queryClient = new QueryClient();
const client = new IndexerClient('https://indexer.0xmail.box', false);

function IndexerApp() {
  const [wallet, setWallet] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  async function connectWallet() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setWallet(address);

    // Generate and sign message
    const msgResult = await client.getMessage(address, 1, '0xmail.box', 'https://0xmail.box');
    if (msgResult.success && msgResult.data) {
      const msg = msgResult.data.message;
      const sig = await signer.signMessage(msg);

      setMessage(msg);
      setSignature(sig);
      setIsAuthenticated(true);
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>0xMail Indexer Client</h1>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {wallet.slice(0, 6)}...{wallet.slice(-4)}</h1>
      <Dashboard wallet={wallet} signature={signature} message={message} />
    </div>
  );
}

function Dashboard({ wallet, signature, message }) {
  const mailQuery = useIndexerMail('https://indexer.0xmail.box', false, wallet, signature, message);
  const pointsQuery = useIndexerPoints('https://indexer.0xmail.box', false, wallet, signature, message);

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Your Points</h2>
        {pointsQuery.isLoading ? (
          <p>Loading...</p>
        ) : pointsQuery.data?.success ? (
          <p className="points">{pointsQuery.data.data.pointsEarned}</p>
        ) : (
          <p>Error loading points</p>
        )}
      </div>

      <div className="card">
        <h2>Your Email Accounts</h2>
        {mailQuery.isLoading ? (
          <p>Loading...</p>
        ) : mailQuery.data?.success ? (
          <ul>
            {mailQuery.data.data.accounts.map((account, i) => (
              <li key={i}>{account.primaryAccount}</li>
            ))}
          </ul>
        ) : (
          <p>Error loading accounts</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IndexerApp />
    </QueryClientProvider>
  );
}
```
