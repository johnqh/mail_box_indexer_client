# mail_box_indexer_client - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

## Overview

`@sudobility/indexer_client` is a TypeScript client library for the blockchain mail indexer REST and GraphQL APIs. It provides an `IndexerClient` class, TanStack React Query hooks, GraphQL/admin/webhook helper utilities, and a business service layer -- all designed to work cross-platform on React 18+ and React Native. Authentication for protected endpoints uses wallet message-signing (`x-signature` / `x-message` / `x-signer` headers).

- **Package**: `@sudobility/indexer_client`
- **Version**: 0.0.109
- **License**: BUSL-1.1
- **Module type**: ESM (`"type": "module"`)
- **Package manager**: **Bun** (always use `bun` commands, never `npm`)

## Project Structure

```
src/
├── index.ts                          # Re-exports all modules: network, business, hooks, utils, types
├── types.ts                          # IndexerUserAuth (message/signature/signer)
│
├── network/
│   ├── index.ts                      # Exports IndexerClient + referral types
│   ├── IndexerClient.ts              # Core API client class (~1270 lines, all REST endpoints)
│   └── __tests__/
│       └── IndexerClient.test.ts
│
├── business/
│   ├── index.ts                      # Exports IndexerService
│   ├── indexer-service.ts            # Singleton service with in-memory cache (public endpoints only)
│   └── __tests__/
│       └── indexer-service.test.ts
│
├── hooks/
│   ├── index.ts                      # Re-exports all hooks + IndexerMockData
│   ├── mocks.ts                      # IndexerMockData class with static mock factories
│   ├── useIndexerMail.ts             # [DEPRECATED] Legacy monolithic hook (all endpoints)
│   ├── useIndexerPoints.ts           # Points hooks: useIndexerPointsInfo, useIndexerPointsLeaderboard, useIndexerPointsSiteStats + legacy useIndexerPoints
│   ├── useIndexerGetWalletAccounts.ts    # useQuery - wallet email accounts (auth required)
│   ├── useIndexerValidateUsername.ts      # useMutation - username validation (public)
│   ├── useIndexerGetSigningMessage.ts     # useMutation - wallet signing message (public, fresh each time)
│   ├── useIndexerGetDelegatedTo.ts        # useQuery - delegation to (auth required)
│   ├── useIndexerGetDelegatedFrom.ts      # useQuery - delegation from (auth required)
│   ├── useIndexerCreateNonce.ts           # useMutation - create nonce (auth required)
│   ├── useIndexerGetNonce.ts              # useQuery - get nonce (auth required)
│   ├── useIndexerGetEntitlement.ts        # useQuery - entitlement check (auth required)
│   ├── useIndexerGetPointsBalance.ts      # useQuery - user points balance (auth required)
│   ├── useIndexerGetWalletPermissions.ts  # useQuery - wallet contract permissions (public)
│   ├── useIndexerNameService.ts           # useWalletNames (auth) + useResolveNameToAddress (public)
│   ├── useIndexerReferralCode.ts          # Referral code hook (auth required)
│   ├── useIndexerReferralStats.ts         # Referral stats hook (public)
│   ├── useIndexerMailTemplates.ts         # CRUD hook for mail templates (auth required)
│   ├── useIndexerMailWebhooks.ts          # CRUD hook for webhooks (auth required)
│   └── __tests__/
│       ├── useIndexerMail.test.tsx
│       ├── useIndexerPoints.test.tsx
│       ├── useIndexerMailTemplates.test.ts
│       └── useIndexerMailWebhooks.test.ts
│
├── utils/
│   ├── index.ts                      # Re-exports all utilities
│   ├── indexer-helpers.ts            # createAuthHeaders, createHeaders, buildUrl, handleApiError
│   ├── indexer-factory.ts            # Factory fns: createIndexerAdmin, createIndexerGraphQL, createIndexerWebhook, createIndexerHelpers
│   ├── indexer-admin.ts              # IndexerAdminHelper class (campaigns, points award, user flags, bulk codes)
│   ├── indexer-graphql.ts            # IndexerGraphQLHelper class (mails, delegations, user/chain stats, event logs)
│   └── indexer-webhooks.ts           # IndexerWebhookHelper class (email-sent, login, referral, Solana webhooks)
│
└── __integration__/
    ├── README.md
    ├── IndexerClient.integration.test.ts
    └── hooks.integration.test.tsx
```

## Key Exports

### Core Client Class (`network/`)

| Export | Description |
|---|---|
| `IndexerClient` | Main REST API client; accepts `(endpointUrl, networkClient, dev?)` |
| `ReferralCodeData`, `ReferralCodeResponse`, `ReferredWallet`, `ReferralStatsData`, `ReferralStatsResponse` | Referral types |
| `PointsInfoResponse`, `PointsInfoData`, `PointsInfoSiteStats`, `PointsInfoTopUser` | Points info types |
| `MailTemplate`, `MailTemplateCreateRequest`, `MailTemplateUpdateRequest`, `MailTemplateResponse`, `MailTemplatesListResponse`, `MailTemplateDeleteResponse`, `MailTemplatesListParams` | Template types |
| `Webhook`, `WebhookCreateRequest`, `WebhookResponse`, `WebhooksListResponse`, `WebhookDeleteResponse`, `WebhooksListParams` | Webhook types |

### React Hooks (`hooks/`)

**Recommended individual hooks (use these for new code):**

| Hook | TanStack Pattern | Auth | Purpose |
|---|---|---|---|
| `useIndexerPointsInfo` | `useQuery` | No | Points system info (`GET /points`) |
| `useIndexerPointsLeaderboard` | `useQuery` | No | Leaderboard (`GET /points/leaderboard/:count`) |
| `useIndexerPointsSiteStats` | `useQuery` | No | Site stats (`GET /points/site-stats`) |
| `useIndexerValidateUsername` | `useMutation` | No | Username validation (`GET /users/:username/validate`) |
| `useIndexerGetSigningMessage` | `useMutation` | No | Signing message (`GET /wallets/:addr/message`) |
| `useIndexerGetWalletPermissions` | `useQuery` | No | Wallet permissions (`GET /permissions/wallet/:addr`) |
| `useResolveNameToAddress` | `useQuery` | No | ENS/SNS resolution (`GET /wallets/named/:name`) |
| `useIndexerGetWalletAccounts` | `useQuery` | Yes | Email accounts (`GET /wallets/:addr/accounts`) |
| `useIndexerGetDelegatedTo` | `useQuery` | Yes | Delegation to (`GET /delegations/from/:addr`) |
| `useIndexerGetDelegatedFrom` | `useQuery` | Yes | Delegation from (`GET /delegations/to/:addr`) |
| `useIndexerCreateNonce` | `useMutation` | Yes | Create nonce (`POST /users/:username/nonce`) |
| `useIndexerGetNonce` | `useQuery` | Yes | Get nonce (`GET /users/:username/nonce`) |
| `useIndexerGetEntitlement` | `useQuery` | Yes | Entitlement check (`GET /wallets/:addr/entitlements/`) |
| `useIndexerGetPointsBalance` | `useQuery` | Yes | Points balance (`GET /wallets/:addr/points`) |
| `useWalletNames` | `useQuery` | Yes | ENS/SNS names (`GET /wallets/:addr/names`) |
| `useIndexerReferralCode` | - | Yes | Referral code (`POST /wallets/:addr/referral`) |
| `useIndexerReferralStats` | - | No | Referral stats (`POST /referrals/:code/stats`) |
| `useIndexerMailTemplates` | manual state | Yes | CRUD for mail templates |
| `useIndexerMailWebhooks` | manual state | Yes | CRUD for webhooks |

**Deprecated:**
- `useIndexerMail` -- legacy monolithic hook; use individual hooks above
- `useIndexerPoints` -- legacy combined points hook; use the three individual `useIndexerPoints*` hooks

**Testing helpers:**
- `IndexerMockData` -- static factory methods for all response types

### Business Layer (`business/`)

| Export | Description |
|---|---|
| `IndexerService` | Singleton service with 5-minute in-memory cache; public endpoints only (`getLeaderboard`, `getPublicStats`, `clearCache`) |

### Utility Helpers (`utils/`)

| Export | Description |
|---|---|
| `createAuthHeaders(auth, dev?, additionalHeaders?)` | Build auth headers with `x-signature`, `x-message`, `x-signer` |
| `createHeaders(dev?, additionalHeaders?)` | Build standard JSON headers |
| `buildUrl(endpoint, path)` | Concatenate base URL + path |
| `handleApiError(response, operation)` | Create descriptive Error from API response |
| `IndexerAdminHelper` | Admin API: campaigns, points awards, user flags, bulk codes, overview stats, flagged users |
| `IndexerGraphQLHelper` | GraphQL queries: mails, prepared mails, delegations, user/chain statistics, event logs |
| `IndexerWebhookHelper` | Webhook processing: email-sent, login, referral, Solana webhook |
| `createIndexerAdmin(config, networkClient)` | Factory for `IndexerAdminHelper` |
| `createIndexerGraphQL(config, networkClient)` | Factory for `IndexerGraphQLHelper` |
| `createIndexerWebhook(config, networkClient)` | Factory for `IndexerWebhookHelper` |
| `createIndexerHelpers(config, networkClient)` | Factory returning `{ admin, graphql, webhook }` |

### Local Types (`types.ts`)

| Export | Description |
|---|---|
| `IndexerUserAuth` | `{ message: string; signature: string; signer: string }` -- wallet-signed auth credentials |

## Development Commands

```bash
# Install dependencies
bun install

# Build the library (uses tsconfig.build.json which excludes tests)
bun run build

# Watch mode compilation
bun run build:watch

# Clean dist directory
bun run clean

# Type checking
bun run typecheck
bun run typecheck:watch

# Unit tests (Vitest with happy-dom, excludes __integration__)
bun run test           # Watch mode
bun run test:run       # Run once
bun run test:coverage  # Coverage report (v8 provider, 70% thresholds)
bun run test:watch     # Watch mode

# Integration tests (requires running indexer service, 30s timeout, serial execution)
bun run test:integration
bun run test:integration:watch

# Code quality
bun run lint           # ESLint (flat config, src/**/*.ts,tsx)
bun run lint:fix       # Auto-fix ESLint issues
bun run format         # Prettier write
bun run format:check   # Prettier check

# Full check (lint + typecheck + test:run)
bun run check-all

# Publish (runs clean + build automatically via prepublishOnly)
bun publish
```

## Architecture / Patterns

### Three-Layer Design

1. **Network Layer** (`IndexerClient`) -- thin HTTP client wrapping all REST endpoints; uses an injected `NetworkClient` interface for cross-platform compatibility (React Native, web, Node). Every method follows the same pattern: build headers, call `networkClient.get/post/put/delete`, check `response.ok`, throw via `handleApiError`.

2. **Business Layer** (`IndexerService`) -- singleton service that wraps `IndexerClient` for public-only endpoints with an in-memory TTL cache (5 minutes). Suitable for server-side or simple use cases.

3. **Hooks Layer** -- React hooks split into individual endpoint hooks. GET endpoints that should cache use `useQuery`; on-demand or non-cacheable calls use `useMutation`. All hooks accept `(networkClient, endpointUrl, dev, ...endpointParams)`.

### Authentication Model

- **Public endpoints**: No auth needed; use `createHeaders(dev)`.
- **Signature-protected endpoints**: Require `IndexerUserAuth` with wallet-signed `message` + `signature` + `signer` address; use `createAuthHeaders(auth, dev)` which sets `x-signature`, `x-message` (URI-encoded), `x-signer`.
- **Admin endpoints**: Require `x-admin-signature` header.
- **Dev mode**: When `dev=true`, adds `x-dev: true` header to bypass certain checks.

### Dependency Injection

The library never imports a concrete HTTP client. All network calls go through the `NetworkClient` interface from `@sudobility/types`, provided by the consuming application's DI container (typically `@sudobility/di`). This is what enables React Native + web support with the same code.

### TanStack React Query Conventions

- Query keys follow the pattern `['indexer', '<entity>', ...params]`.
- Stale times: 2 minutes for frequently-changing data (leaderboard, points info), 5 minutes for stable data (site stats, accounts, names).
- Signature-protected `useQuery` hooks set `enabled: !!walletAddress && !!auth.signature && !!auth.message`.
- Hooks using `useMutation` (e.g., `useIndexerValidateUsername`, `useIndexerGetSigningMessage`) are for on-demand calls where caching is undesirable.

### TypeScript Configuration

- `strict: true` with all additional strict flags enabled (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.)
- Target: ES2020, Module: ESNext, Module Resolution: bundler
- JSX: `"react"` (classic transform)
- Build produces `.js` + `.d.ts` + `.d.ts.map` + source maps into `dist/`
- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) are excluded from build via `tsconfig.build.json`

### GraphQL Pattern

`IndexerGraphQLHelper` posts raw GraphQL query strings to `{baseUrl}/graphql`. It supports filtering (`WhereInput`) and pagination (`PaginationInput` with `first`, `skip`, `orderBy`, `orderDirection`). Convenience methods like `getMailsFromAddress` and `getActiveDelegationsFromAddress` wrap the generic `getMails`/`getDelegations` with pre-configured filters.

### Testing Strategy

- **Unit tests**: Vitest + happy-dom, located in `__tests__/` directories alongside source.
- **Integration tests**: Located in `src/__integration__/`, run serially with 30s timeouts, require a live indexer service and `.env.test` config.
- **Coverage thresholds**: 70% for branches, functions, lines, and statements.
- **Mocking**: `IndexerMockData` provides static factory methods for all API response types. The consuming app provides `MockNetworkClient` from `@sudobility/di/mocks`.

## Common Tasks

### Adding a new API endpoint

1. Add the method to `src/network/IndexerClient.ts` following the existing pattern (build headers, call `networkClient`, check `response.ok`, throw `handleApiError`).
2. Add any new response/request types as interfaces in `IndexerClient.ts` or import from `@sudobility/mail_box_types`.
3. Export new types from `src/network/index.ts`.
4. Create a new hook file `src/hooks/useIndexer<Name>.ts`:
   - Use `useQuery` for cacheable GET endpoints; use `useMutation` for on-demand/POST endpoints.
   - Follow the `(networkClient, endpointUrl, dev, ...params)` signature pattern.
   - Set appropriate `staleTime` and `enabled` conditions.
5. Export the hook from `src/hooks/index.ts`.
6. The hook is automatically available via `src/index.ts` (which re-exports `./hooks`).
7. Add mock data factory to `src/hooks/mocks.ts` if needed.
8. Add tests in `src/hooks/__tests__/`.

### Adding a new GraphQL query

1. Add the method to `src/utils/indexer-graphql.ts` in the `IndexerGraphQLHelper` class.
2. Define the query string and return type interface.
3. Use `this.query<T>(queryString, variables)` for execution.
4. Export any new interfaces from `indexer-graphql.ts` (automatically re-exported via `utils/index.ts`).

### Adding admin functionality

1. Add the method to `src/utils/indexer-admin.ts` in the `IndexerAdminHelper` class.
2. Define request/response interfaces in the same file.
3. The factory in `indexer-factory.ts` (`createIndexerAdmin`) already creates the helper.

### Running integration tests

1. Create a `.env.test` file with `INDEXER_BACKEND_URL` pointing to a running indexer service.
2. Run `bun run test:integration`.
3. Integration tests run serially to avoid rate limiting.

## Peer / Key Dependencies

| Package | Role |
|---|---|
| `@sudobility/di` (^1.5.36) | Dependency injection interfaces; provides `NetworkClient` implementation |
| `@sudobility/mail_box_types` (^1.0.10) | Shared type definitions for indexer API responses/requests |
| `@sudobility/types` (^1.9.51) | Core types: `NetworkClient`, `AppConfig`, `ChainType`, `Optional` |
| `@sudobility/configs` (^0.0.63) | Application configuration |
| `@tanstack/react-query` (>=5.0.0) | Data fetching, caching, and state management for hooks |
| `react` (>=18.0.0) | React peer dependency |

**Dev-only notable dependencies**: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `happy-dom`, `typescript` (5.9+), `eslint` (9+, flat config), `prettier`, `dotenv`.

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.
