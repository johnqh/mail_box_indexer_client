# Improvement Plans for @sudobility/indexer_client

## Priority 1 - High Impact

### 1. Complete Deprecation of Legacy Hooks
- `useIndexerMail` and `useIndexerPoints` are marked as deprecated in favor of individual hooks, but they are still exported and available. Consumers may still be using them. Add deprecation warnings at runtime (e.g., `console.warn` on first call), add `@deprecated` JSDoc tags, and create a migration guide documenting the mapping from legacy hook methods to individual hooks. Track usage across consuming projects and set a removal target date.

### 2. Increase Test Coverage for Individual Hooks
- The hooks directory has test files for `useIndexerMail`, `useIndexerPoints`, `useIndexerMailTemplates`, and `useIndexerMailWebhooks`, but the 14+ individual hooks (e.g., `useIndexerGetWalletAccounts`, `useIndexerGetDelegatedTo`, `useIndexerGetEntitlement`, `useIndexerNameService`, `useIndexerReferralCode`) appear to lack dedicated test files. Each hook should have tests covering enabled/disabled states, error responses, cache invalidation, and re-fetch behavior.

### 3. Add Error Type Hierarchy
- The `handleApiError` utility in `indexer-helpers.ts` creates generic `Error` objects from API responses. Consumers need to distinguish between authentication errors (expired signature), network errors (server unreachable), validation errors (bad input), and rate limit errors (429). Adding a typed error hierarchy (e.g., `IndexerAuthError`, `IndexerNetworkError`, `IndexerValidationError`) would enable better error handling in consuming applications.

## Priority 2 - Medium Impact

### 4. Add JSDoc to IndexerClient Methods
- The `IndexerClient` class is approximately 1270 lines with all REST endpoint methods. While the hook layer provides some documentation, the underlying client methods should have JSDoc comments describing the endpoint called, parameters required, authentication requirements, and possible error responses. This is especially important for auth-required endpoints where the `IndexerUserAuth` object must be correctly formed.

### 5. Add Retry Logic to NetworkClient Calls
- The `IndexerClient` delegates all HTTP calls to an injected `NetworkClient` interface. If the network call fails due to a transient error, the client throws immediately. Adding configurable retry logic (at least for GET requests) with exponential backoff would improve reliability, especially for mobile clients with intermittent connectivity.

## Priority 3 - Nice to Have

### 6. Add GraphQL Type Safety
- The `IndexerGraphQLHelper` posts raw GraphQL query strings and manually types the responses. Using a code generator (e.g., `graphql-codegen`) to generate typed query functions from the indexer's GraphQL schema would eliminate the risk of query/type mismatches and provide compile-time validation.

### 7. Improve IndexerService Cache Configuration
- The `IndexerService` singleton uses a fixed 5-minute TTL cache for public endpoints. This TTL is hardcoded and may not be appropriate for all use cases. Making the cache TTL configurable per method and adding cache statistics (hit rate, miss rate) would help consumers tune performance.

### 8. Add Request Deduplication
- Multiple components may simultaneously request the same endpoint (e.g., wallet accounts on app startup). While TanStack Query handles this in the hooks layer, the `IndexerClient` class does not deduplicate concurrent identical requests. Adding request deduplication at the client level would benefit non-hook consumers (e.g., `IndexerService`, background tasks).
