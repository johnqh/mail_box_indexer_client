import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load integration test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/__integration__/**/*.integration.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
    ],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    teardownTimeout: 10000,
    // Run integration tests serially to avoid rate limiting
    threads: false,
    isolate: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
