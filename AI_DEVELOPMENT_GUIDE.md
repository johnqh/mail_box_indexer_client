# AI-Assisted Development Guide

This guide is designed to help AI assistants (like Claude Code) quickly understand and effectively work with this codebase.

## Project Overview

**Project:** `@johnqh/indexer_client`
**Type:** TypeScript client library for 0xMail Indexer API
**Compatibility:** React and React Native
**Backend:** Located at `../mail_box_indexer` (Ponder-based blockchain indexer)

## Quick Architecture Reference

```
IndexerClient (HTTP client - axios)
    ↓
Business Services
    ├─ IndexerService (caching, public endpoints)
    ├─ IndexerAdminHelper (admin operations)
    ├─ IndexerGraphQLHelper (GraphQL queries)
    └─ IndexerWebhookHelper (webhook utilities)
    ↓
React Hooks (@tanstack/react-query)
    ├─ useIndexerMail (accounts, delegations, nonces)
    ├─ useIndexerPoints (balance, leaderboard, stats)
    ├─ useIndexerNameService (ENS/SNS resolution)
    ├─ useIndexerReferralCode (generate referral code)
    ├─ useIndexerReferralStats (view referral statistics)
    └─ useIndexerReferralConsumption (use referral code)
    ↓
React/React Native Components
```

## File Structure

```
src/
├── network/
│   ├── IndexerClient.ts          # Core HTTP client (643 lines)
│   └── __tests__/
│       └── IndexerClient.test.ts # Client unit tests
│
├── business/
│   ├── indexer-service.ts        # Business logic wrapper with caching
│   ├── index.ts                  # Barrel export
│   └── __tests__/
│       └── indexer-service.test.ts
│
├── hooks/
│   ├── useIndexerMail.ts         # Mail/account operations
│   ├── useIndexerPoints.ts       # Points queries
│   ├── useIndexerNameService.ts  # ENS/SNS operations
│   ├── useReferralCode.ts        # Referral code generation
│   ├── useReferralStats.ts       # Referral statistics
│   ├── useReferralConsumption.ts # Use referral codes
│   ├── mocks.ts                  # Mock data for dev mode
│   ├── index.ts                  # Barrel export
│   └── __tests__/
│       └── useIndexerMail.test.ts
│
├── utils/
│   ├── indexer-admin.ts          # Admin helper class
│   ├── indexer-graphql.ts        # GraphQL helper class
│   ├── indexer-webhooks.ts       # Webhook helper class
│   ├── indexer-factory.ts        # Factory functions
│   └── index.ts                  # Barrel export
│
└── index.ts                      # Main entry point (all exports)
```

## Key Dependencies

- `@johnqh/types@1.8.20` - Shared type definitions
- `@johnqh/di@1.4.5` - Dependency injection
- `@tanstack/react-query@5.90.2` - Data fetching/caching
- `axios@1.12.2` - HTTP client
- `react@19.2.0` - Peer dependency

## Backend Reference

The backend (`../mail_box_indexer`) uses:
- **@johnqh/types@1.8.9** (slightly older version)
- Ponder 0.13.9 (blockchain indexing framework)
- Hono 4.9.9 (HTTP router)
- PostgreSQL (via pg)
- Multi-chain support (EVM + Solana)

## Authentication Patterns

### 1. Signature-Based Auth

Most endpoints require signature headers:

```typescript
const headers = {
  'x-signature': walletSignature,      // Signature string
  'x-message': encodedMessage,         // URL-encoded SIWE/SIWS message
  'x-dev': 'true'                      // Optional: dev mode
};
```

### 2. Message Formats

**EVM (SIWE):**
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

**Solana (SIWS):**
```
localhost:3000 wants you to sign in with your Solana account:
5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG

Sign in with Solana to the app.

URI: http://localhost:3000
Version: 1
Issued At: 2024-01-01T00:00:00.000Z
```

## Common Patterns

### Pattern 1: Adding a New Endpoint

1. **Add method to `IndexerClient`:**
```typescript
// src/network/IndexerClient.ts
async getNewEndpoint(param: string): Promise<NewResponse> {
  return this.request<NewResponse>({
    method: 'GET',
    url: `/api/new-endpoint/${param}`,
    requiresAuth: false // or true
  });
}
```

2. **Add React hook (if user-facing):**
```typescript
// src/hooks/useNewFeature.ts
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { IndexerClient } from '../network/IndexerClient';

export const useNewFeature = (
  endpointUrl: string,
  dev: boolean,
  param: string,
  options?: UseQueryOptions<NewResponse>
): UseQueryResult<NewResponse> => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['indexer', 'new-feature', param],
    queryFn: () => client.getNewEndpoint(param),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!param,
    ...options,
  });
};
```

3. **Export from hooks index:**
```typescript
// src/hooks/index.ts
export * from './useNewFeature';
```

4. **Export from main index:**
```typescript
// src/index.ts
export { useNewFeature } from './hooks';
```

5. **Add test:**
```typescript
// src/hooks/__tests__/useNewFeature.test.ts
describe('useNewFeature', () => {
  it('should fetch data successfully', async () => {
    // Test implementation
  });
});
```

### Pattern 2: Signature-Protected Endpoint

```typescript
async getProtectedData(
  walletAddress: string,
  signature: string,
  message: string
): Promise<DataResponse> {
  return this.request<DataResponse>({
    method: 'GET',
    url: `/wallets/${walletAddress}/data`,
    requiresAuth: true, // Adds signature headers
    signature,
    message
  });
}
```

### Pattern 3: POST with Body

```typescript
async createResource(
  data: CreateData,
  signature: string,
  message: string
): Promise<ResourceResponse> {
  return this.request<ResourceResponse>({
    method: 'POST',
    url: '/resources',
    requiresAuth: true,
    signature,
    message,
    data
  });
}
```

### Pattern 4: Query Parameters

```typescript
async searchResources(
  query: string,
  limit: number = 10
): Promise<SearchResponse> {
  return this.request<SearchResponse>({
    method: 'GET',
    url: '/resources/search',
    params: { q: query, limit }
  });
}
```

## Testing Patterns

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { IndexerClient } from '../IndexerClient';

describe('IndexerClient', () => {
  let client: IndexerClient;

  beforeEach(() => {
    client = new IndexerClient('https://test-indexer.example.com', false);
  });

  describe('newMethod', () => {
    it('should fetch data successfully', async () => {
      const result = await client.newMethod('param');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await expect(client.newMethod('invalid')).rejects.toThrow();
    });
  });
});
```

### Hook Test Template

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNewFeature } from '../useNewFeature';

describe('useNewFeature', () => {
  const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

  it('should fetch data', async () => {
    const { result } = renderHook(
      () => useNewFeature('https://test.com', false, 'param'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

## Implementation Priorities

### High Priority (Missing Features)

1. **OAuth 2.0 Flow** - 8 endpoints needed for third-party integrations
2. **Block Status** - `GET /blocks` for monitoring indexing progress
3. **Auth Status** - `GET /wallets/:walletAddress/authenticated`

### Medium Priority

4. **KYC Module** - 3 endpoints (only if KYC feature is needed)
5. **GraphQL Expansion** - Add common queries to `IndexerGraphQLHelper`
6. **Solana Admin** - 3 endpoints for admin panel

### Low Priority

7. **Admin Endpoints** - Backend doesn't have these yet (planned feature)

## Type Safety Guidelines

1. **Always use types from `@johnqh/types`:**
```typescript
import type {
  AddressValidationResponse,
  PointsResponse,
  ReferralCodeResponse
} from '@johnqh/types';
```

2. **Never use `any`** - Use `unknown` and type guards instead
3. **Optional properties use `Optional<T>` type:**
```typescript
import type { Optional } from '@johnqh/types';
```

## Error Handling

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: Optional<string>;
  timestamp: string;
}
```

Handle errors consistently:

```typescript
try {
  const result = await client.someMethod();
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  return result.data;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

## Development Workflow

### Running Tests
```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage
```

### Type Checking
```bash
npm run typecheck       # Check types
npm run typecheck:watch # Watch mode
```

### Linting
```bash
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues
```

### Building
```bash
npm run build         # Compile TypeScript
npm run build:watch   # Watch mode
```

### Full Check
```bash
npm run check-all  # Lint + typecheck + test
```

## Common Gotchas

1. **AppConfig.devMode** - The `devMode` property doesn't exist in `AppConfig` type yet, so use `(config as any).devMode || false`

2. **Headers Encoding** - Message must be URL-encoded in headers, but the backend decodes it

3. **Chain IDs** - Solana uses negative chain IDs: -101 (mainnet), -102 (devnet), -103 (testnet)

4. **Referral Codes** - Can only be applied ONCE per wallet via `x-referral` header on first `/accounts` call

5. **Delegation** - When a signer ≠ wallet address, backend checks delegation table to authorize

## Adding Documentation

When adding features, update these files:

1. **API.md** - Add endpoint documentation with examples
2. **README.md** - Update feature list and usage examples
3. **CHANGELOG.md** - Document changes
4. **JSDoc comments** - In the code itself

## Backend Integration

### Checking Backend Implementation

1. Backend API routes are in: `../mail_box_indexer/api/`
   - `mail.ts` - Mail/user/delegation endpoints
   - `points.ts` - Points system
   - `oauth.ts` - OAuth 2.0 flow
   - `kyc.ts` - KYC verification
   - `solana.ts` - Solana integration

2. Backend helpers are in: `../mail_box_indexer/src/lib/`
   - `request-validator.ts` - Signature verification
   - `points-helper.ts` - Points logic
   - `referral-helper.ts` - Referral system
   - `nameservice.ts` - ENS/SNS resolution

3. Backend schema: `../mail_box_indexer/ponder.schema.ts`
   - All database tables and their fields

### Version Sync

Keep `@johnqh/types` version aligned:
- Backend uses: 1.8.9
- Client uses: 1.8.20

Monitor for breaking changes when updating.

## Mock Data

For development mode (`dev: true`), the client returns mock data from `src/hooks/mocks.ts`.

Add mock data for new features:

```typescript
// src/hooks/mocks.ts
export const IndexerMockData = {
  newFeature: {
    success: true,
    data: {
      // Mock data here
    },
    timestamp: new Date().toISOString()
  }
};
```

## GraphQL Considerations

The backend exposes GraphQL at `/graphql`, but the client's `IndexerGraphQLHelper` is minimal.

To add GraphQL support:

```typescript
// src/utils/indexer-graphql.ts
async queryMails(filters: MailFilters): Promise<Mail[]> {
  const query = `
    query GetMails($filter: MailFilter) {
      mails(filter: $filter) {
        id
        subject
        sender
        timestamp
      }
    }
  `;

  return this.networkClient.graphql(query, { filter: filters });
}
```

## Security Notes

1. **Never log signatures or messages** - Contains sensitive auth data
2. **IP-restricted endpoints** cannot be called from client - they're server-only
3. **Dev mode** should never be used in production
4. **Rate limiting** - Backend has rate limits, implement exponential backoff

## AI Assistant Tips

When working on this project:

1. **Read API.md first** - Comprehensive endpoint documentation
2. **Check backend** - Source of truth is `../mail_box_indexer`
3. **Follow patterns** - Consistency is key
4. **Write tests** - All new features need tests
5. **Update docs** - Keep documentation in sync
6. **Check types** - Use `@johnqh/types` for all API types
7. **Run checks** - `npm run check-all` before committing

## Resources

- **Backend Repo:** `../mail_box_indexer`
- **API Documentation:** `API.md`
- **Shared Types:** `@johnqh/types` package
- **React Query Docs:** https://tanstack.com/query/latest
- **Ponder Docs:** https://ponder.sh

## Getting Help

1. Check `API.md` for endpoint documentation
2. Review backend implementation in `../mail_box_indexer`
3. Look at existing patterns in similar files
4. Run tests to see expected behavior
5. Check type definitions in `@johnqh/types`
