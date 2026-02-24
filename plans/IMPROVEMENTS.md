# Improvement Plans for @sudobility/indexer_client

## Priority 1 - High Impact

### 1. Complete Deprecation of Legacy Hooks -- DONE
- `useIndexerMail` and `useIndexerPoints` are marked as deprecated in favor of individual hooks, but they are still exported and available. Consumers may still be using them. Add deprecation warnings at runtime (e.g., `console.warn` on first call), add `@deprecated` JSDoc tags, and create a migration guide documenting the mapping from legacy hook methods to individual hooks. Track usage across consuming projects and set a removal target date.
- **Status:** Completed. Both legacy hooks now emit a one-time `console.warn` on first call. Enhanced `@deprecated` JSDoc tags include a full migration table mapping legacy methods to replacement hooks, and a removal target of "next major version".

### 2. Increase Test Coverage for Individual Hooks -- DONE
- The hooks directory has test files for `useIndexerMail`, `useIndexerPoints`, `useIndexerMailTemplates`, and `useIndexerMailWebhooks`, but the 14+ individual hooks (e.g., `useIndexerGetWalletAccounts`, `useIndexerGetDelegatedTo`, `useIndexerGetEntitlement`, `useIndexerNameService`, `useIndexerReferralCode`) appear to lack dedicated test files. Each hook should have tests covering enabled/disabled states, error responses, cache invalidation, and re-fetch behavior.
- **Status:** Completed. Added `useIndexerIndividualHooks.test.tsx` with 43 tests covering all individual hooks: useQuery hooks (enabled/disabled states, success, error), useMutation hooks (success, error, clearError), and custom state hooks (referralCode, referralStats -- success, error, clearError, reset).

### 3. Add Error Type Hierarchy -- DONE
- The `handleApiError` utility in `indexer-helpers.ts` creates generic `Error` objects from API responses. Consumers need to distinguish between authentication errors (expired signature), network errors (server unreachable), validation errors (bad input), and rate limit errors (429). Adding a typed error hierarchy (e.g., `IndexerAuthError`, `IndexerNetworkError`, `IndexerValidationError`) would enable better error handling in consuming applications.
- **Status:** Completed. Created `src/errors.ts` with `IndexerError` (base), `IndexerAuthError` (401/403), `IndexerNetworkError` (unreachable), `IndexerValidationError` (400/422), `IndexerRateLimitError` (429, with retryAfter), and `IndexerServerError` (500+). Updated `handleApiError` to return typed errors based on HTTP status code. Added 19 dedicated tests in `src/__tests__/errors.test.ts`. All error classes are exported from the package root.

## Priority 2 - Medium Impact

### 4. Add JSDoc to IndexerClient Methods -- DONE
- The `IndexerClient` class is approximately 1270 lines with all REST endpoint methods. While the hook layer provides some documentation, the underlying client methods should have JSDoc comments describing the endpoint called, parameters required, authentication requirements, and possible error responses. This is especially important for auth-required endpoints where the `IndexerUserAuth` object must be correctly formed.
- **Status:** Completed. All 30+ methods in `IndexerClient` now have comprehensive JSDoc with: endpoint description, HTTP method and path, authentication requirements (public vs signature-protected), `@param` tags for all parameters, `@returns` tag describing the response shape, `@throws` tags listing applicable error types (`IndexerAuthError`, `IndexerValidationError`, `IndexerError`).

### 5. Add Retry Logic to NetworkClient Calls
- The `IndexerClient` delegates all HTTP calls to an injected `NetworkClient` interface. If the network call fails due to a transient error, the client throws immediately. Adding configurable retry logic (at least for GET requests) with exponential backoff would improve reliability, especially for mobile clients with intermittent connectivity.
- **Status:** Deferred. This requires architectural changes to the NetworkClient injection pattern and would affect all consumers.

## Priority 3 - Nice to Have

### 6. Add GraphQL Type Safety
- The `IndexerGraphQLHelper` posts raw GraphQL query strings and manually types the responses. Using a code generator (e.g., `graphql-codegen`) to generate typed query functions from the indexer's GraphQL schema would eliminate the risk of query/type mismatches and provide compile-time validation.
- **Status:** Deferred. Requires external graphql-codegen infrastructure setup.

### 7. Improve IndexerService Cache Configuration
- The `IndexerService` singleton uses a fixed 5-minute TTL cache for public endpoints. This TTL is hardcoded and may not be appropriate for all use cases. Making the cache TTL configurable per method and adding cache statistics (hit rate, miss rate) would help consumers tune performance.
- **Status:** Deferred. Nice-to-have enhancement.

### 8. Add Request Deduplication
- Multiple components may simultaneously request the same endpoint (e.g., wallet accounts on app startup). While TanStack Query handles this in the hooks layer, the `IndexerClient` class does not deduplicate concurrent identical requests. Adding request deduplication at the client level would benefit non-hook consumers (e.g., `IndexerService`, background tasks).
- **Status:** Deferred. Architectural change at the client level.

## Additional Improvements Completed

### 9. Added `verify` Script -- DONE
- Added `bun run verify` script to `package.json` that runs lint, typecheck, tests, and build in sequence. Aligns with the ecosystem convention used across other @sudobility projects.
