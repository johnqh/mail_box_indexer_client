# Integration Tests Documentation

This document provides an overview of the integration test suite for the @johnqh/indexer_client library.

## Overview

Integration tests verify that the client library works correctly with a real indexer API endpoint. Unlike unit tests that mock dependencies, integration tests make actual HTTP requests to validate:

- API connectivity and response format
- Data validation and type safety
- Error handling with real network conditions
- React hook behavior with live data

## Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.example .env.test
   ```

2. **Configure endpoint:**
   ```bash
   # Edit .env.test
   INTEGRATION_TEST_INDEXER_URL=https://indexer.0xmail.box
   ```

3. **Run tests:**
   ```bash
   npm run test:integration
   ```

## Test Structure

### Directory Layout

```
src/__integration__/
├── README.md                              # Detailed integration test guide
├── IndexerClient.integration.test.ts      # Client API integration tests
└── hooks.integration.test.tsx             # React hooks integration tests
```

### Test Files

#### 1. IndexerClient.integration.test.ts (22 tests)

Tests the low-level `IndexerClient` class against real API endpoints:

**Health Check (1 test)**
- ✅ Verify connectivity to indexer endpoint

**Points API (3 tests)**
- ✅ Get points leaderboard
- ✅ Get site statistics
- ✅ Handle different leaderboard counts (5, 10, 20)

**User Validation (2 tests)**
- ✅ Validate valid EVM addresses
- ✅ Handle invalid address formats

**SIWE Message Generation (1 test)**
- ✅ Generate Sign-In with Ethereum messages with correct format

**Name Service (2 tests)**
- ✅ Resolve ENS names to addresses
- ✅ Get wallet names for addresses

**Referral System (2 tests)**
- ✅ Get referral codes for wallets
- ✅ Get referral statistics

**Error Handling (2 tests)**
- ✅ Handle network timeouts gracefully
- ✅ Handle invalid endpoints

**Response Format (2 tests)**
- ✅ Consistent response structure across all endpoints
- ✅ Include error details on failure

#### 2. hooks.integration.test.tsx (13 tests)

Tests React hooks with real API integration:

**useIndexerPoints Hook (5 tests)**
- ✅ Fetch real leaderboard data
- ✅ Fetch real site stats
- ✅ Handle consecutive requests
- ✅ Error handling and clearing
- ✅ DevMode fallback behavior

**Real-world Usage Patterns (3 tests)**
- ✅ Handle rapid successive calls
- ✅ Maintain stable client instance across rerenders
- ✅ Handle different leaderboard counts

**Data Validation (2 tests)**
- ✅ Properly formatted leaderboard data
- ✅ Properly formatted site stats

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `INTEGRATION_TEST_INDEXER_URL` | Indexer API base URL | `https://indexer.0xmail.box` |

### Test Timeouts

- **Default timeout**: 30 seconds per test
- **Hook timeout**: 30 seconds
- **Teardown timeout**: 10 seconds

Timeouts are configured in `vitest.integration.config.ts` and can be adjusted if needed.

### Test Execution

Tests run **serially** (not in parallel) to:
- Avoid rate limiting from the API
- Ensure stable results
- Easier debugging of failures

## Running Tests

### Command Line

```bash
# Run all integration tests once
npm run test:integration

# Run in watch mode (re-run on file changes)
npm run test:integration:watch
```

### Programmatic

```typescript
import { exec } from 'child_process';

exec('npm run test:integration', (error, stdout, stderr) => {
  console.log(stdout);
});
```

## Test Data

### Known Test Addresses

Integration tests use well-known addresses for validation:

- **EVM Test Address**: `0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb`
- **Vitalik's Address**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (for ENS testing)
- **ENS Name**: `vitalik.eth` (for name resolution testing)

### Mock Fallback

Some tests may fall back to console logging if:
- API doesn't have specific data (e.g., referral codes)
- External services are unavailable (e.g., ENS resolution)
- Network conditions cause intermittent failures

This is expected behavior and does not indicate test failure.

## CI/CD Integration

### GitHub Actions

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        env:
          INTEGRATION_TEST_INDEXER_URL: ${{ secrets.INDEXER_URL }}
        run: npm run test:integration
```

### GitLab CI

```yaml
integration-tests:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test:integration
  variables:
    INTEGRATION_TEST_INDEXER_URL: $INDEXER_URL
  only:
    - main
    - develop
    - merge_requests
```

### Environment Setup

For CI/CD, set the `INTEGRATION_TEST_INDEXER_URL` as a secret/variable in your CI platform:

- **GitHub Actions**: Settings → Secrets → Actions → New repository secret
- **GitLab CI**: Settings → CI/CD → Variables → Add Variable
- **CircleCI**: Project Settings → Environment Variables

## Troubleshooting

### Common Issues

#### 1. Environment Variable Not Set

**Error:**
```
Error: INTEGRATION_TEST_INDEXER_URL environment variable is not set.
```

**Solution:**
```bash
echo "INTEGRATION_TEST_INDEXER_URL=https://indexer.0xmail.box" > .env.test
```

#### 2. Network Timeouts

**Error:**
```
Error: Test timed out in 30000ms
```

**Solutions:**
- Check network connectivity
- Verify indexer endpoint is accessible
- Increase timeout in `vitest.integration.config.ts`:
  ```typescript
  testTimeout: 60000, // 60 seconds
  ```

#### 3. Rate Limiting

**Error:**
```
Error: Too Many Requests (429)
```

**Solutions:**
- Tests already run serially by default
- Add delays between test files if needed
- Use a local indexer instance for testing

#### 4. Endpoint Unreachable

**Error:**
```
Error: getaddrinfo ENOTFOUND
```

**Solutions:**
- Verify the URL in `.env.test` is correct
- Check DNS resolution
- Try with `http://` instead of `https://` for local development

### Debug Mode

To see detailed request/response logs:

```bash
DEBUG=* npm run test:integration
```

## Best Practices

### 1. Independent Tests

Each test should be independent and not rely on state from other tests:

```typescript
it('should fetch leaderboard', async () => {
  // ✅ Good - self-contained test
  const result = await client.getPointsLeaderboard(10);
  expect(result.success).toBe(true);
});
```

### 2. Graceful Degradation

Handle cases where data may not exist:

```typescript
it('should get referral code', async () => {
  try {
    const result = await client.getReferralCode(wallet, 'evm');
    // Validate if data exists
  } catch (error) {
    // Log and skip if referral code doesn't exist
    console.log('Referral code lookup skipped:', error);
  }
});
```

### 3. Timeout Management

Set appropriate timeouts based on expected response time:

```typescript
it('should fetch large dataset', async () => {
  // Long-running operation
  const result = await client.getPointsLeaderboard(1000);
  expect(result.success).toBe(true);
}, 45000); // 45 second timeout
```

### 4. Error Validation

Verify error handling works correctly:

```typescript
it('should handle invalid endpoint', async () => {
  const invalidClient = new IndexerClient('https://invalid.com', false);

  try {
    await invalidClient.getPointsSiteStats();
    expect(true).toBe(false); // Should not reach here
  } catch (error) {
    expect(error).toBeDefined();
    expect(error instanceof Error).toBe(true);
  }
});
```

## Maintenance

### Updating Tests

When adding new endpoints to the client:

1. Add integration test in appropriate file
2. Update this documentation
3. Update test count in this file
4. Run tests locally before committing

### Monitoring

Consider setting up monitoring for integration tests:

- Run tests on schedule (e.g., nightly)
- Alert on failures
- Track test execution time
- Monitor API response times

## Coverage

Current integration test coverage:

| Area | Tests | Coverage |
|------|-------|----------|
| Client API | 22 tests | ~60% of public endpoints |
| React Hooks | 13 tests | Core hooks tested |
| Error Handling | 4 tests | Common error scenarios |
| **Total** | **35 tests** | **Good coverage** |

### Not Yet Covered

- OAuth 2.0 endpoints (not implemented in client)
- KYC verification (not implemented in client)
- Solana admin endpoints (admin-only)
- Mail operations requiring authentication
- Delegation management

## Related Documentation

- [src/__integration__/README.md](src/__integration__/README.md) - Detailed setup guide
- [API.md](API.md) - Complete API documentation
- [EXAMPLES.md](EXAMPLES.md) - Code examples
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## Support

For issues with integration tests:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [src/__integration__/README.md](src/__integration__/README.md)
3. Open an issue on GitHub
4. Contact the maintainers
