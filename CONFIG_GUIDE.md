# Configuration Guide

This guide explains how to configure the indexer base URL for your application.

## Recommended Approach: IndexerConfigProvider

The recommended way to configure the indexer base URL is using the `IndexerConfigProvider` at your app root. This allows you to set the configuration once and all hooks will automatically use it.

### Setup

Wrap your app with the `IndexerConfigProvider`:

```typescript
import { IndexerConfigProvider } from '@johnqh/indexer_client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IndexerConfigProvider
        config={{
          baseUrl: 'https://indexer.0xmail.box',
          devMode: false // Optional: enable mock data fallback
        }}
      >
        <YourApp />
      </IndexerConfigProvider>
    </QueryClientProvider>
  );
}
```

### Using Hooks (No URL needed)

Once configured, all hooks can be used without passing the URL:

```typescript
import { useIndexerPoints } from '@johnqh/indexer_client';

function MyComponent() {
  // No URL parameter needed!
  const { getPointsLeaderboard, isLoading } = useIndexerPoints();

  const handleClick = async () => {
    const leaderboard = await getPointsLeaderboard(10);
    console.log(leaderboard);
  };

  return <button onClick={handleClick}>Get Leaderboard</button>;
}
```

### Environment-Based Configuration

You can easily switch configurations based on environment:

```typescript
const config = {
  baseUrl: process.env.REACT_APP_INDEXER_URL || 'https://indexer.0xmail.box',
  devMode: process.env.NODE_ENV === 'development'
};

<IndexerConfigProvider config={config}>
  <App />
</IndexerConfigProvider>
```

## Backward Compatible Approach: Direct URL

For backward compatibility, you can still pass the URL directly to hooks:

```typescript
import { useIndexerPoints } from '@johnqh/indexer_client';

function MyComponent() {
  // Pass URL directly (old approach)
  const { getPointsLeaderboard } = useIndexerPoints(
    'https://indexer.0xmail.box',
    false, // dev mode
    false  // devMode (mock data fallback)
  );

  // ...
}
```

**Note:** Direct URL takes precedence over context configuration.

## Using with Direct Client

For non-React usage or when you need direct control:

```typescript
import { IndexerClient } from '@johnqh/indexer_client';

const client = new IndexerClient('https://indexer.0xmail.box', false);

async function getData() {
  const leaderboard = await client.getPointsLeaderboard(10);
  console.log(leaderboard);
}
```

## Using with Business Services

The factory functions still require configuration:

```typescript
import { createIndexerHelpers } from '@johnqh/indexer_client';

const config = {
  indexerBackendUrl: 'https://indexer.0xmail.box'
};

const { admin, graphql, webhook } = createIndexerHelpers(config);
```

Or use with `@johnqh/di`:

```typescript
import { provide } from '@johnqh/di';
import type { AppConfig } from '@johnqh/types';

// Register configuration
provide<AppConfig>('AppConfig', {
  indexerBackendUrl: 'https://indexer.0xmail.box'
});

// Later, in your components
import { inject } from '@johnqh/di';
import { createIndexerHelpers } from '@johnqh/indexer_client';

const config = inject<AppConfig>('AppConfig');
const helpers = createIndexerHelpers(config);
```

## Multiple Environments

### Development, Staging, Production

```typescript
const getIndexerUrl = () => {
  switch (process.env.REACT_APP_ENV) {
    case 'production':
      return 'https://indexer.0xmail.box';
    case 'staging':
      return 'https://staging-indexer.0xmail.box';
    case 'development':
    default:
      return 'http://localhost:42069';
  }
};

<IndexerConfigProvider config={{ baseUrl: getIndexerUrl() }}>
  <App />
</IndexerConfigProvider>
```

### Testing

For testing, you can provide a mock URL:

```typescript
import { render } from '@testing-library/react';
import { IndexerConfigProvider } from '@johnqh/indexer_client';

function renderWithConfig(component) {
  return render(
    <IndexerConfigProvider config={{ baseUrl: 'http://localhost:3000', devMode: true }}>
      {component}
    </IndexerConfigProvider>
  );
}

test('my component', () => {
  const { getByText } = renderWithConfig(<MyComponent />);
  // ...
});
```

## React Native

The same approach works for React Native:

```typescript
import { IndexerConfigProvider } from '@johnqh/indexer_client';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <IndexerConfigProvider config={{ baseUrl: 'https://indexer.0xmail.box' }}>
      <NavigationContainer>
        {/* Your navigation */}
      </NavigationContainer>
    </IndexerConfigProvider>
  );
}
```

## Error Handling

If you forget to provide configuration:

```typescript
// ❌ This will throw an error
function MyComponent() {
  // Error: useIndexerConfig must be used within IndexerConfigProvider
  const { getPointsLeaderboard } = useIndexerPoints();
}
```

**Solution:** Either wrap with `IndexerConfigProvider` or pass URL directly:

```typescript
// ✅ Option 1: Use provider
<IndexerConfigProvider config={{ baseUrl: '...' }}>
  <MyComponent />
</IndexerConfigProvider>

// ✅ Option 2: Pass URL directly
const { getPointsLeaderboard } = useIndexerPoints('https://indexer.0xmail.box');
```

## Best Practices

1. **Use IndexerConfigProvider** for consistent configuration across your app
2. **Set baseUrl from environment variables** for easy switching between environments
3. **Enable devMode in development** to fall back to mock data when backend is unavailable
4. **Use direct URL approach** only for special cases or testing
5. **Don't hardcode URLs** in multiple places - configure once at the root

## Configuration Options

```typescript
interface IndexerConfig {
  /**
   * Base URL for the indexer API
   * @example 'https://indexer.0xmail.box'
   */
  baseUrl: string;

  /**
   * Development mode flag
   * When true, returns mock data on errors
   * @default false
   */
  devMode?: boolean;
}
```

## Migration from Old Approach

### Before (Old Approach)
```typescript
function MyComponent() {
  const { getPointsLeaderboard } = useIndexerPoints(
    'https://indexer.0xmail.box',
    false,
    false
  );
}
```

### After (New Approach)
```typescript
// In App.tsx
<IndexerConfigProvider config={{ baseUrl: 'https://indexer.0xmail.box' }}>
  <MyComponent />
</IndexerConfigProvider>

// In MyComponent.tsx
function MyComponent() {
  const { getPointsLeaderboard } = useIndexerPoints();
  // Much cleaner!
}
```

## Accessing Config in Components

You can access the configuration in any component:

```typescript
import { useIndexerConfig } from '@johnqh/indexer_client';

function DebugPanel() {
  const config = useIndexerConfig();

  return (
    <div>
      <p>Base URL: {config.baseUrl}</p>
      <p>Dev Mode: {config.devMode ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

Or optionally (returns undefined if not configured):

```typescript
import { useIndexerConfigOptional } from '@johnqh/indexer_client';

function OptionalComponent() {
  const config = useIndexerConfigOptional();

  if (!config) {
    return <p>Not configured</p>;
  }

  return <p>Configured: {config.baseUrl}</p>;
}
```
