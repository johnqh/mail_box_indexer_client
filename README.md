# @sudobility/indexer_client

TypeScript client library for the 0xMail blockchain indexer REST and GraphQL APIs. Provides an `IndexerClient` class, TanStack React Query hooks, GraphQL/admin/webhook helpers, and a business service layer. Works cross-platform on React and React Native via an injected `NetworkClient` interface.

## Installation

```bash
bun add @sudobility/indexer_client
```

Peer dependencies: `react` (>=18), `@tanstack/react-query` (>=5), `@sudobility/di`, `@sudobility/types`, `@sudobility/mail_box_types`, `@sudobility/configs`.

## Usage

```typescript
import { IndexerClient } from '@sudobility/indexer_client';

// Core client (uses injected NetworkClient for cross-platform HTTP)
const client = new IndexerClient(endpointUrl, networkClient, dev);
const accounts = await client.getWalletAccounts(walletAddress, auth);
const points = await client.getPointsBalance(walletAddress, auth);
```

### React Hooks

```typescript
import {
  useIndexerGetWalletAccounts,
  useIndexerPointsInfo,
  useIndexerPointsLeaderboard,
  useIndexerGetDelegatedTo,
  useWalletNames,
  useResolveNameToAddress,
  useIndexerMailTemplates,
  useIndexerMailWebhooks,
  useIndexerReferralCode,
} from '@sudobility/indexer_client';

// Public endpoints (no auth)
const { data } = useIndexerPointsInfo(networkClient, endpointUrl, dev);
const { data } = useResolveNameToAddress(networkClient, endpointUrl, dev, 'vitalik.eth');

// Authenticated endpoints (wallet signature required)
const { data } = useIndexerGetWalletAccounts(networkClient, endpointUrl, dev, walletAddress, auth);
```

### Utility Helpers

```typescript
import { createIndexerHelpers } from '@sudobility/indexer_client';

const { admin, graphql, webhook } = createIndexerHelpers(config, networkClient);

// Admin: campaigns, points awards, user flags
// GraphQL: mails, delegations, statistics
// Webhook: email-sent, login, referral events
```

## API

| Export | Description |
|--------|-------------|
| `IndexerClient` | Core REST API client (~40 endpoints) |
| `IndexerService` | Singleton with 5-min in-memory cache (public endpoints) |
| `useIndexer*` hooks | 18 individual TanStack React Query hooks |
| `IndexerMockData` | Static mock factories for all response types |
| `IndexerAdminHelper` | Admin API helper (campaigns, points, flags) |
| `IndexerGraphQLHelper` | GraphQL query helper (mails, delegations, stats) |
| `IndexerWebhookHelper` | Webhook processing helper |
| `createAuthHeaders` | Build signature auth headers (`x-signature`, `x-message`, `x-signer`) |

## Development

```bash
bun install
bun run check-all          # lint + typecheck + test:run
bun run build              # TypeScript compilation
bun run test               # Vitest (watch mode)
bun run test:run           # Single run
bun run test:coverage      # Coverage (70% threshold)
bun run test:integration   # Integration tests (requires live indexer)
bun run typecheck          # tsc --noEmit
bun run lint               # ESLint
```

## Related Packages

- `@0xmail/indexer` -- the backend this client connects to
- `@sudobility/di` -- provides `NetworkClient` interface
- `@sudobility/mail_box_types` -- shared API response types
- `@sudobility/types` -- core types (ChainType, Optional)
- `@sudobility/configs` -- application configuration

## License

BUSL-1.1
