# Contributing to @0xmail/indexer_client

Thank you for your interest in contributing to the 0xMail Indexer Client! This document provides guidelines and best practices for contributing.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Documentation](#documentation)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- TypeScript knowledge
- Familiarity with React and React Query

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnqh/mail_box_indexer_client.git
   cd mail_box_indexer_client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/oauth-implementation` - New features
- `fix/points-calculation-bug` - Bug fixes
- `docs/api-examples` - Documentation updates
- `refactor/client-structure` - Code refactoring
- `test/hook-coverage` - Test additions

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(oauth): implement OAuth 2.0 authorization flow

- Add challenge generation endpoint
- Add signature verification
- Add token exchange logic

Closes #123
```

```
fix(points): correct points calculation for referrals

The referral bonus was being applied twice due to a race condition
in the points helper.
```

### Development Commands

```bash
# Development
npm test                  # Run tests in watch mode
npm run typecheck:watch   # Type check in watch mode
npm run build:watch       # Build in watch mode

# Quality Checks
npm run check-all        # Run all checks (lint + typecheck + test)
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run typecheck        # Type check without building

# Testing
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report

# Building
npm run build            # Production build
npm run clean            # Clean build artifacts
```

## Code Standards

### TypeScript

1. **Use strict type checking**
   ```typescript
   // ✅ Good
   function processData(data: UserData): Promise<Result> {
     // ...
   }

   // ❌ Bad
   function processData(data: any): any {
     // ...
   }
   ```

2. **Import types from @sudobility/types**
   ```typescript
   // ✅ Good
   import type { PointsResponse, ReferralCodeResponse } from '@sudobility/types';

   // ❌ Bad
   interface PointsResponse {
     // Defining types that already exist in @sudobility/types
   }
   ```

3. **Use Optional<T> for optional fields**
   ```typescript
   import type { Optional } from '@sudobility/types';

   interface MyData {
     required: string;
     optional: Optional<number>;
   }
   ```

### Code Style

We use ESLint and Prettier for code formatting. Run `npm run lint:fix` before committing.

**Key conventions:**
- Use 2 spaces for indentation
- Use single quotes for strings
- Trailing commas in objects and arrays
- No semicolons (Prettier default)
- Arrow functions preferred over function expressions

### File Organization

```typescript
// 1. External imports
import { useQuery } from '@tanstack/react-query';
import type { PointsResponse } from '@sudobility/types';

// 2. Internal imports
import { IndexerClient } from '../network/IndexerClient';

// 3. Constants
const STALE_TIME = 5 * 60 * 1000;

// 4. Types/Interfaces
interface HookOptions {
  // ...
}

// 5. Main implementation
export function useMyFeature() {
  // ...
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `indexer-client.ts`)
- **Classes**: PascalCase (e.g., `IndexerClient`)
- **Functions/Variables**: camelCase (e.g., `getPointsBalance`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `STALE_TIME`)
- **Types/Interfaces**: PascalCase (e.g., `PointsResponse`)
- **React Hooks**: camelCase starting with `use` (e.g., `useIndexerPoints`)

## Testing Requirements

### Test Coverage

All new features must include tests. We aim for 80%+ coverage.

### Writing Tests

1. **Unit Tests for Client Methods**
   ```typescript
   describe('IndexerClient', () => {
     let client: IndexerClient;

     beforeEach(() => {
       client = new IndexerClient('https://test.example.com', false);
     });

     describe('newMethod', () => {
       it('should return success response', async () => {
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

2. **Hook Tests**
   ```typescript
   import { renderHook, waitFor } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

   describe('useNewFeature', () => {
     const wrapper = ({ children }) => {
       const queryClient = new QueryClient({
         defaultOptions: { queries: { retry: false } }
       });
       return (
         <QueryClientProvider client={queryClient}>
           {children}
         </QueryClientProvider>
       );
     };

     it('should fetch data successfully', async () => {
       const { result } = renderHook(
         () => useNewFeature('https://test.com', false, 'param'),
         { wrapper }
       );

       await waitFor(() => expect(result.current.isSuccess).toBe(true));
       expect(result.current.data).toBeDefined();
     });
   });
   ```

3. **Test File Location**
   - Place tests in `__tests__` directory alongside source files
   - Name test files: `*.test.ts` or `*.test.tsx`

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/network/__tests__/IndexerClient.test.ts

# Run with coverage
npm run test:coverage
```

## Pull Request Process

### Before Submitting

1. **Run all checks**
   ```bash
   npm run check-all
   ```

2. **Update documentation**
   - Update `API.md` if adding endpoints
   - Update `COVERAGE.md` if changing implementation status
   - Update `EXAMPLES.md` if adding new features
   - Update `README.md` if changing public API

3. **Add tests**
   - Unit tests for new methods
   - Integration tests for new features
   - Update existing tests if behavior changed

4. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Added
   - OAuth 2.0 authorization flow (#123)

   ### Fixed
   - Points calculation for referrals (#124)
   ```

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added OAuth 2.0 challenge endpoint
- Updated IndexerClient with new method
- Added tests for OAuth flow

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] API.md updated
- [ ] COVERAGE.md updated
- [ ] Examples added to EXAMPLES.md
- [ ] JSDoc comments added

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No console.log or debugging code
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Documentation updated
```

### Review Process

1. Maintainer reviews code
2. Automated checks must pass (tests, linting, type checking)
3. At least one approval required
4. Address reviewer feedback
5. Squash commits before merge (if requested)

## Adding New Features

### Adding a New API Endpoint

1. **Add method to IndexerClient**
   ```typescript
   // src/network/IndexerClient.ts
   async getNewEndpoint(param: string): Promise<NewResponse> {
     return this.request<NewResponse>({
       method: 'GET',
       url: `/api/new-endpoint/${param}`,
       requiresAuth: false
     });
   }
   ```

2. **Add React Hook (if user-facing)**
   ```typescript
   // src/hooks/useNewFeature.ts
   import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
   import type { NewResponse } from '@sudobility/types';
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
       staleTime: 5 * 60 * 1000,
       enabled: !!param,
       ...options,
     });
   };
   ```

3. **Export from hooks/index.ts**
   ```typescript
   export * from './useNewFeature';
   ```

4. **Export from main index.ts**
   ```typescript
   export { useNewFeature } from './hooks';
   ```

5. **Add tests**
   ```typescript
   // src/hooks/__tests__/useNewFeature.test.ts
   ```

6. **Update documentation**
   - `API.md` - Add endpoint documentation
   - `COVERAGE.md` - Update implementation status
   - `EXAMPLES.md` - Add usage example

### Adding Mock Data

For development mode, add mock data:

```typescript
// src/hooks/mocks.ts
export const IndexerMockData = {
  // ... existing mocks
  newFeature: {
    success: true,
    data: {
      // Mock data matching NewResponse type
    },
    timestamp: new Date().toISOString()
  }
};
```

## Documentation

### JSDoc Comments

Add JSDoc comments to all public methods:

```typescript
/**
 * Get user points balance
 *
 * @param walletAddress - Wallet address to query
 * @param signature - Wallet signature for authentication
 * @param message - Signed message
 * @returns Promise resolving to PointsResponse
 *
 * @example
 * ```typescript
 * const points = await client.getPointsBalance(
 *   '0x742d35Cc...',
 *   signature,
 *   message
 * );
 * console.log('Points:', points.data.pointsEarned);
 * ```
 */
async getPointsBalance(
  walletAddress: string,
  signature: string,
  message: string
): Promise<PointsResponse> {
  // Implementation
}
```

### Documentation Files

Update these files as appropriate:

- **API.md** - API endpoint reference
- **EXAMPLES.md** - Code examples
- **COVERAGE.md** - Implementation status
- **README.md** - Public API and features
- **AI_DEVELOPMENT_GUIDE.md** - AI assistant guidance

## Backend Integration

### Checking Backend Implementation

Before implementing a client feature:

1. Check backend route exists in `../mail_box_indexer/api/`
2. Review backend implementation in `../mail_box_indexer/src/lib/`
3. Verify request/response types in `@sudobility/types`
4. Test against actual backend (not just mocks)

### Type Synchronization

Keep `@sudobility/types` version aligned with backend:

- Backend: Check `../mail_box_indexer/package.json`
- Client: Update `package.json` to match
- Document any version-specific behavior

## Questions?

- Check existing issues and PRs
- Review documentation (API.md, EXAMPLES.md, AI_DEVELOPMENT_GUIDE.md)
- Ask in GitHub discussions
- Contact maintainers

## Code of Conduct

- Be respectful and professional
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

Thank you for contributing to @0xmail/indexer_client!
