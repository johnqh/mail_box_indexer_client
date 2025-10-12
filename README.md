# @sudobility/indexer_client

TypeScript client library for the 0xMail Indexer API. Compatible with React and React Native applications.

## Features

- ✅ **Complete Type Safety** - Full TypeScript support with `@sudobility/types`
- ✅ **React Integration** - Built-in hooks using `@tanstack/react-query`
- ✅ **Multi-Chain Support** - EVM and Solana blockchains
- ✅ **Authentication** - SIWE/SIWS signature verification
- ✅ **Points System** - Track and display user points
- ✅ **Referral System** - Generate and track referral codes
- ✅ **Name Service** - ENS and SNS resolution
- ✅ **Delegation** - Wallet delegation management
- ✅ **Development Mode** - Mock data for testing

## Installation

```bash
npm install @sudobility/indexer_client
```

### Peer Dependencies

```bash
npm install react @tanstack/react-query axios @sudobility/di @sudobility/types
```

## Quick Start

### 1. Setup React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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

### 2. Use Hooks

```typescript
import { useIndexerPoints } from '@sudobility/indexer_client';

function PointsDisplay({ wallet, signature, message }) {
  const { data, isLoading } = useIndexerPoints(
    'https://indexer.0xmail.box',
    false, // dev mode
    wallet,
    signature,
    message
  );

  if (isLoading) return <div>Loading...</div>;
  if (!data?.success) return <div>Error</div>;

  return <div>Points: {data.data.pointsEarned}</div>;
}
```

## API Coverage

| Feature | Status | Endpoints |
|---------|--------|-----------|
| Mail & User Management | ✅ 71% | 12/17 implemented |
| Points System | ✅ 100% | 3/3 implemented |
| Referral System | ✅ 100% | Fully implemented |
| OAuth 2.0 | ❌ 0% | Planned for v1.0 |
| KYC Verification | ❌ 0% | Optional feature |
| Solana Admin | ❌ 0% | Admin tools |

See [COVERAGE.md](COVERAGE.md) for complete endpoint matrix.

## Documentation

- **[API.md](API.md)** - Complete API endpoint documentation
- **[EXAMPLES.md](EXAMPLES.md)** - Code examples for all features
- **[AI_DEVELOPMENT_GUIDE.md](AI_DEVELOPMENT_GUIDE.md)** - Guide for AI-assisted development
- **[COVERAGE.md](COVERAGE.md)** - API implementation status

## Core Components

### IndexerClient

Low-level HTTP client for direct API access:

```typescript
import { IndexerClient } from '@sudobility/indexer_client';

const client = new IndexerClient('https://indexer.0xmail.box', false);

// Validate wallet address
const result = await client.validateUsername('0x742d35Cc...');

// Get signing message
const msgResult = await client.getMessage(
  '0x742d35Cc...',
  1, // chainId
  '0xmail.box',
  'https://0xmail.box'
);

// Get points balance (requires signature)
const points = await client.getPointsBalance(wallet, signature, message);
```

### React Hooks

High-level hooks with automatic caching and refetching:

#### useIndexerMail
```typescript
import { useIndexerMail } from '@sudobility/indexer_client';

const { data, isLoading, error, refetch } = useIndexerMail(
  endpointUrl,
  dev,
  walletAddress,
  signature,
  message
);
```

#### useIndexerPoints
```typescript
import { useIndexerPoints } from '@sudobility/indexer_client';

const { data, isLoading } = useIndexerPoints(
  endpointUrl,
  dev,
  walletAddress,
  signature,
  message
);
```

#### useIndexerReferralCode
```typescript
import { useIndexerReferralCode } from '@sudobility/indexer_client';

const { data, isLoading } = useIndexerReferralCode(
  endpointUrl,
  dev,
  walletAddress,
  signature,
  message
);
```

#### useIndexerReferralStats
```typescript
import { useIndexerReferralStats } from '@sudobility/indexer_client';

const { data, isLoading } = useIndexerReferralStats(
  endpointUrl,
  dev,
  referralCode
);
```

#### useWalletNames / useResolveNameToAddress
```typescript
import { useWalletNames, useResolveNameToAddress } from '@sudobility/indexer_client';

// Get all names for a wallet
const { data: names } = useWalletNames(
  endpointUrl,
  dev,
  walletAddress,
  signature,
  message
);

// Resolve name to address
const { data: resolved } = useResolveNameToAddress(
  endpointUrl,
  dev,
  'vitalik.eth'
);
```

### Business Services

#### IndexerService
Caching wrapper for public endpoints:

```typescript
import { IndexerService } from '@sudobility/indexer_client';

const config = {
  indexerBackendUrl: 'https://indexer.0xmail.box'
};

const service = IndexerService.getInstance(config);

// Get leaderboard (cached for 5 minutes)
const leaderboard = await service.getLeaderboard(10);

// Get public stats
const stats = await service.getPublicStats();
```

### Factory Helpers

Create helper instances with automatic client injection:

```typescript
import {
  createIndexerAdmin,
  createIndexerGraphQL,
  createIndexerWebhook,
  createIndexerHelpers
} from '@sudobility/indexer_client';

const config = {
  indexerBackendUrl: 'https://indexer.0xmail.box'
};

// Create individual helpers
const admin = createIndexerAdmin(config);
const graphql = createIndexerGraphQL(config);
const webhook = createIndexerWebhook(config);

// Or create all at once
const { admin, graphql, webhook } = createIndexerHelpers(config);
```

## Authentication

All protected endpoints require signature authentication:

### 1. Generate Message

```typescript
const msgResult = await client.getMessage(
  walletAddress,
  chainId,
  'domain.com',
  'https://domain.com'
);
const message = msgResult.data.message;
```

### 2. Sign Message

**EVM (ethers.js):**
```typescript
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const signature = await signer.signMessage(message);
```

**Solana:**
```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

const { publicKey, signMessage } = useWallet();
const encodedMessage = new TextEncoder().encode(message);
const signatureBuffer = await signMessage(encodedMessage);
const signature = bs58.encode(signatureBuffer);
```

### 3. Make Authenticated Request

```typescript
const result = await client.getWalletAccounts(
  walletAddress,
  signature,
  message
);
```

## Common Use Cases

### Get Email Accounts

```typescript
const accounts = await client.getWalletAccounts(
  walletAddress,
  signature,
  message
);

if (accounts.success) {
  accounts.data.accounts.forEach(account => {
    console.log('Primary:', account.primaryAccount);
    account.domainAccounts.forEach(domain => {
      console.log('Domain:', domain.account);
    });
  });
}
```

### Apply Referral Code

```typescript
// Referral code is applied on first /accounts call
const accounts = await client.getWalletAccounts(
  walletAddress,
  signature,
  message,
  'ABC123XYZ' // Referral code (applied once)
);
```

### Check Points Balance

```typescript
const points = await client.getPointsBalance(
  walletAddress,
  signature,
  message
);

console.log(`Points: ${points.data.pointsEarned}`);
```

### Generate Referral Code

```typescript
const referral = await client.getReferralCode(
  walletAddress,
  signature,
  message
);

console.log(`Code: ${referral.data.referralCode}`);
console.log(`Redemptions: ${referral.data.totalRedemptions}`);
```

### Resolve ENS/SNS Name

```typescript
const resolved = await client.resolveNameToAddress('vitalik.eth');

if (resolved.success) {
  console.log('Address:', resolved.data.address);
  console.log('Chain:', resolved.data.chainType);
}
```

## Development Mode

Enable development mode to use mock data:

```typescript
const client = new IndexerClient('https://indexer.0xmail.box', true); // dev = true
```

Mock data is defined in `src/hooks/mocks.ts`.

## Error Handling

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  timestamp: string;
}
```

Handle errors consistently:

```typescript
const result = await client.someMethod();

if (!result.success) {
  console.error('Error:', result.error);
  return;
}

// Use result.data
```

## TypeScript Support

All types are imported from `@sudobility/types`:

```typescript
import type {
  AddressValidationResponse,
  EmailAccountsResponse,
  PointsResponse,
  ReferralCodeResponse,
  LeaderboardResponse,
  // ... and more
} from '@sudobility/indexer_client';
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run unit tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Integration Tests

Integration tests run against a real indexer endpoint. See [src/__integration__/README.md](src/__integration__/README.md) for details.

```bash
# Setup
cp .env.example .env.test
# Edit .env.test and set INTEGRATION_TEST_INDEXER_URL

# Run integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch
```

### Other Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# All checks (lint + typecheck + unit tests)
npm run check-all
```

## Building

```bash
# Build for production
npm run build

# Build and watch
npm run build:watch

# Clean build artifacts
npm run clean
```

## Roadmap

### v0.1.0 (Current)
- ✅ Core mail and user management
- ✅ Points system
- ✅ Referral system
- ✅ Name service integration
- ✅ React hooks

### v1.0.0 (Planned)
- [ ] Complete OAuth 2.0 flow
- [ ] Block status monitoring
- [ ] Authentication status check
- [ ] Enhanced GraphQL support

### v1.1.0 (Future)
- [ ] KYC verification module
- [ ] Solana admin tools
- [ ] Advanced caching strategies
- [ ] Request deduplication

See [COVERAGE.md](COVERAGE.md) for detailed implementation status.

## CI/CD

This project uses GitHub Actions for automated testing and releases.

### Automated Workflow

On every push to `main`:
1. ✅ Run tests on Node.js 20.x and 22.x
2. ✅ Type checking and linting
3. ✅ Build verification
4. ✅ Create GitHub release
5. ✅ Publish to NPM

### Triggering a Release

```bash
# Bump version
npm version patch  # 0.0.1 -> 0.0.2

# Push to trigger release
git push origin main
```

See [.github/workflows/README.md](.github/workflows/README.md) for detailed CI/CD documentation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Backend Repository

This client library connects to the mail_box_indexer backend, located at `../mail_box_indexer`.

The backend provides:
- Blockchain indexing (Ponder framework)
- REST API (Hono framework)
- GraphQL API
- OAuth 2.0 server
- KYC integration (Sumsub)
- Multi-chain support (EVM + Solana)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Application                   │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │           React Query Hooks                     │ │
│  │  useIndexerMail, useIndexerPoints, etc.        │ │
│  └────────────────────────────────────────────────┘ │
│                        ↓                             │
│  ┌────────────────────────────────────────────────┐ │
│  │         Business Services                       │ │
│  │  IndexerService, IndexerAdminHelper, etc.      │ │
│  └────────────────────────────────────────────────┘ │
│                        ↓                             │
│  ┌────────────────────────────────────────────────┐ │
│  │           IndexerClient (HTTP)                  │ │
│  │               axios                             │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│           mail_box_indexer Backend                   │
│                                                      │
│  REST API (Hono) + GraphQL + OAuth 2.0              │
│  PostgreSQL Database (Ponder framework)             │
│  Multi-chain indexing (EVM + Solana)                │
└─────────────────────────────────────────────────────┘
```

## License

MIT

## Support

For questions and support:
- GitHub Issues: https://github.com/johnqh/mail_box_indexer_client/issues
- Documentation: See `API.md` and `EXAMPLES.md`
- Backend: `../mail_box_indexer`

## Version

Current version: **0.0.18**

See [COVERAGE.md](COVERAGE.md) for implementation roadmap.
