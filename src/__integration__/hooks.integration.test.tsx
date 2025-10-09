/**
 * Integration tests for React hooks
 * These tests run against a real indexer endpoint with React components
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIndexerPoints } from '../hooks/useIndexerPoints';

describe('Hooks Integration Tests', () => {
  const indexerUrl = process.env.INTEGRATION_TEST_INDEXER_URL;

  beforeAll(() => {
    if (!indexerUrl) {
      throw new Error(
        'INTEGRATION_TEST_INDEXER_URL environment variable is not set. ' +
        'Please set it in .env.test file.'
      );
    }
  });

  describe('useIndexerPoints', () => {
    it('should fetch real leaderboard data', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      // Initially should not be loading
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Fetch leaderboard
      const leaderboard = await result.current.getPointsLeaderboard(10);

      // Should have successful response
      expect(leaderboard).toBeDefined();
      expect(leaderboard.success).toBe(true);
      expect(leaderboard.data?.leaderboard).toBeDefined();

      // Loading state should be updated
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }, 15000);

    it('should fetch real site stats', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      const stats = await result.current.getPointsSiteStats();

      expect(stats).toBeDefined();
      expect(stats.success).toBe(true);
      expect(stats.data?.totalPoints).toBeDefined();
      expect(stats.data?.totalUsers).toBeDefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }, 15000);

    it('should handle consecutive requests', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      // Make multiple requests in sequence
      const leaderboard1 = await result.current.getPointsLeaderboard(5);
      expect(leaderboard1.success).toBe(true);

      const stats = await result.current.getPointsSiteStats();
      expect(stats.success).toBe(true);

      const leaderboard2 = await result.current.getPointsLeaderboard(10);
      expect(leaderboard2.success).toBe(true);

      // Should maintain stable state
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    }, 20000);

    it('should handle errors and clear them', async () => {
      // Use invalid URL to force error
      const { result } = renderHook(() =>
        useIndexerPoints('https://invalid-endpoint-xyz.com', false)
      );

      try {
        await result.current.getPointsLeaderboard(10);
        // Should throw an error
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Error should be set
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Clear error
      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    }, 15000);

    it('should work in dev mode', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, true) // dev enabled
      );

      const leaderboard = await result.current.getPointsLeaderboard(10);

      // Should get data from API
      expect(leaderboard).toBeDefined();
      expect(leaderboard.success).toBe(true);
      expect(leaderboard.data?.leaderboard).toBeDefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }, 15000);
  });

  describe('Real-world Usage Patterns', () => {
    it('should handle rapid successive calls', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      // Simulate rapid user interactions
      const promises = [
        result.current.getPointsLeaderboard(5),
        result.current.getPointsLeaderboard(10),
        result.current.getPointsSiteStats(),
      ];

      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach((response) => {
        expect(response.success).toBe(true);
      });
    }, 20000);

    it('should maintain stable client instance', async () => {
      const { result, rerender } = renderHook(
        ({ url }) => useIndexerPoints(url, false),
        {
          initialProps: { url: indexerUrl! },
        }
      );

      const stats1 = await result.current.getPointsSiteStats();
      expect(stats1.success).toBe(true);

      // Rerender with same URL - should reuse client
      rerender({ url: indexerUrl! });

      const stats2 = await result.current.getPointsSiteStats();
      expect(stats2.success).toBe(true);
    }, 15000);

    it('should handle different counts for leaderboard', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      const counts = [5, 10, 20, 50];
      const results = [];

      for (const count of counts) {
        const leaderboard = await result.current.getPointsLeaderboard(count);
        results.push(leaderboard);
      }

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Loading should be false after all complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }, 25000);
  });

  describe('Data Validation', () => {
    it('should return properly formatted leaderboard data', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      const leaderboard = await result.current.getPointsLeaderboard(10);

      expect(leaderboard.success).toBe(true);
      expect(leaderboard.timestamp).toBeDefined();
      expect(leaderboard.data).toBeDefined();

      // Validate leaderboard structure
      if (leaderboard.data?.leaderboard && leaderboard.data.leaderboard.length > 0) {
        const entry = leaderboard.data.leaderboard[0];
        if (entry) {
          expect(entry).toHaveProperty('walletAddress');
          expect(entry).toHaveProperty('chainType');
          expect(entry).toHaveProperty('pointsEarned');
          expect(typeof entry.walletAddress).toBe('string');
          expect(['evm', 'solana']).toContain(entry.chainType);
          expect(typeof entry.pointsEarned).toBe('string');
        }
      }
    }, 15000);

    it('should return properly formatted site stats', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints(indexerUrl!, false)
      );

      const stats = await result.current.getPointsSiteStats();

      expect(stats.success).toBe(true);
      expect(stats.timestamp).toBeDefined();
      expect(stats.data).toBeDefined();

      if (stats.data) {
        expect(stats.data).toHaveProperty('totalPoints');
        expect(stats.data).toHaveProperty('totalUsers');
        expect(typeof stats.data.totalPoints).toBe('string');
        expect(typeof stats.data.totalUsers).toBe('number');
        expect(stats.data.totalUsers).toBeGreaterThanOrEqual(0);
      }
    }, 15000);
  });
});
