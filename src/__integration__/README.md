# Integration Tests

This directory contains integration tests that run against a real indexer API endpoint.

## Setup

1. **Configure Environment Variable**

   Copy `.env.example` to `.env.test`:
   ```bash
   cp .env.example .env.test
   ```

2. **Set Indexer URL**

   Edit `.env.test` and set your indexer endpoint:
   ```bash
   INTEGRATION_TEST_INDEXER_URL=https://indexer.0xmail.box
   ```

   Or for local development:
   ```bash
   INTEGRATION_TEST_INDEXER_URL=http://localhost:42069
   ```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch
```

## Test Coverage

The integration tests cover the following areas:

### IndexerClient Tests (`IndexerClient.integration.test.ts`)

1. **Health Check**
   - Verify connectivity to indexer endpoint

2. **Points API**
   - Get points leaderboard with various counts
   - Get site statistics
   - Validate response structure

3. **User Validation**
   - Validate EVM addresses
   - Handle invalid address formats

4. **SIWE Message Generation**
   - Generate Sign-In with Ethereum messages
   - Validate message format and nonce

5. **Name Service**
   - Resolve ENS names to addresses
   - Get wallet names for addresses

6. **Referral System**
   - Get referral codes for wallets
   - Get referral statistics

7. **Error Handling**
   - Handle network timeouts
   - Handle invalid endpoints
   - Validate error messages

8. **Response Format**
   - Verify consistent response structure
   - Validate error details

### Hook Tests (`hooks.integration.test.tsx`)

1. **useIndexerPoints Hook**
   - Fetch real leaderboard data
   - Fetch real site stats
   - Handle consecutive requests
   - Error handling and clearing
   - DevMode fallback behavior

2. **Real-world Usage Patterns**
   - Rapid successive calls
   - Stable client instance
   - Different leaderboard counts

3. **Data Validation**
   - Properly formatted leaderboard data
   - Properly formatted site stats
   - Type validation

## Test Configuration

- **Timeout**: 30 seconds per test (configurable in `vitest.integration.config.ts`)
- **Execution**: Tests run serially to avoid rate limiting
- **Environment**: Uses happy-dom for React rendering

## Notes

- Integration tests require a live indexer endpoint
- Some tests may be skipped if the endpoint doesn't have certain data
- Tests use `console.log` to indicate skipped tests (e.g., ENS resolution may fail if service is unavailable)
- The `.env.test` file is gitignored to keep your configuration private

## Troubleshooting

### Error: INTEGRATION_TEST_INDEXER_URL not set

Make sure you have created `.env.test` with the required environment variable:
```bash
echo "INTEGRATION_TEST_INDEXER_URL=https://indexer.0xmail.box" > .env.test
```

### Network timeouts

If tests are timing out, you may need to:
1. Check your network connection
2. Verify the indexer endpoint is accessible
3. Increase timeout in `vitest.integration.config.ts`

### Rate limiting

If you see rate limiting errors, tests run serially by default. You can add delays between tests if needed.

## CI/CD Integration

For CI/CD pipelines, set the environment variable in your pipeline configuration:

**GitHub Actions:**
```yaml
- name: Run Integration Tests
  env:
    INTEGRATION_TEST_INDEXER_URL: ${{ secrets.INDEXER_URL }}
  run: npm run test:integration
```

**GitLab CI:**
```yaml
integration-tests:
  script:
    - npm run test:integration
  variables:
    INTEGRATION_TEST_INDEXER_URL: $INDEXER_URL
```
