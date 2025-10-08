/**
 * React Context for Indexer configuration
 * Allows consumers to configure the indexer base URL once at the app root
 */

import React, { createContext, ReactNode, useContext } from 'react';

export interface IndexerConfig {
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

const IndexerConfigContext = createContext<IndexerConfig | undefined>(
  undefined
);

export interface IndexerConfigProviderProps {
  children: ReactNode;
  config: IndexerConfig;
}

/**
 * Provider component for Indexer configuration
 * Wrap your app with this provider to configure the indexer base URL
 *
 * @example
 * ```tsx
 * import { IndexerConfigProvider } from '@johnqh/indexer_client';
 *
 * function App() {
 *   return (
 *     <IndexerConfigProvider config={{ baseUrl: 'https://indexer.0xmail.box' }}>
 *       <YourApp />
 *     </IndexerConfigProvider>
 *   );
 * }
 * ```
 */
export function IndexerConfigProvider({
  children,
  config,
}: IndexerConfigProviderProps) {
  return (
    <IndexerConfigContext.Provider value={config}>
      {children}
    </IndexerConfigContext.Provider>
  );
}

/**
 * Hook to access Indexer configuration
 * Must be used within IndexerConfigProvider
 *
 * @throws Error if used outside IndexerConfigProvider
 */
export function useIndexerConfig(): IndexerConfig {
  const config = useContext(IndexerConfigContext);

  if (!config) {
    throw new Error(
      'useIndexerConfig must be used within IndexerConfigProvider. ' +
        'Wrap your app with <IndexerConfigProvider config={{ baseUrl: "..." }}>'
    );
  }

  return config;
}

/**
 * Hook to optionally access Indexer configuration
 * Returns undefined if used outside IndexerConfigProvider
 * Useful for backward compatibility
 */
export function useIndexerConfigOptional(): IndexerConfig | undefined {
  return useContext(IndexerConfigContext);
}
