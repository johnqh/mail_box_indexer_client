import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIndexerPoints } from '../useIndexerPoints';

// Mock IndexerClient
const mockGetPointsLeaderboard = vi.fn();
const mockGetPointsSiteStats = vi.fn();

vi.mock('../../network/IndexerClient', () => {
  return {
    IndexerClient: vi.fn().mockImplementation(() => ({
      getPointsLeaderboard: mockGetPointsLeaderboard,
      getPointsSiteStats: mockGetPointsSiteStats,
    })),
  };
});

// Mock data
vi.mock('../mocks', () => ({
  IndexerMockData: {
    getLeaderboard: vi.fn().mockReturnValue({
      success: true,
      data: {
        leaderboard: [
          {
            walletAddress: '0x123...',
            chainType: 'evm',
            pointsEarned: '1000',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    }),
    getSiteStats: vi.fn().mockReturnValue({
      success: true,
      data: {
        totalPoints: '100000',
        totalUsers: 500,
      },
      timestamp: new Date().toISOString(),
    }),
  },
}));

describe('useIndexerPoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPointsLeaderboard.mockResolvedValue({
      success: true,
      data: {
        leaderboard: [
          {
            walletAddress: '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb',
            chainType: 'evm',
            pointsEarned: '5000',
            lastActivityDate: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    });

    mockGetPointsSiteStats.mockResolvedValue({
      success: true,
      data: {
        totalPoints: '1000000',
        totalUsers: 5000,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      },
      timestamp: new Date().toISOString(),
    });
  });

  describe('getPointsLeaderboard', () => {
    it('should fetch leaderboard successfully', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      const leaderboard = await result.current.getPointsLeaderboard(10);

      expect(leaderboard).toBeDefined();
      expect(leaderboard.success).toBe(true);
      expect(leaderboard.data?.leaderboard).toHaveLength(1);
      expect(mockGetPointsLeaderboard).toHaveBeenCalledWith(10);
    });

    it('should use default count of 10', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      await result.current.getPointsLeaderboard();

      expect(mockGetPointsLeaderboard).toHaveBeenCalledWith(10);
    });

    it('should handle errors in normal mode', async () => {
      mockGetPointsLeaderboard.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      await expect(result.current.getPointsLeaderboard()).rejects.toThrow(
        'Network error'
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should fall back to mock data in dev mode on error', async () => {
      mockGetPointsLeaderboard.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, true)
      );

      const leaderboard = await result.current.getPointsLeaderboard(10);

      expect(leaderboard).toBeDefined();
      expect(leaderboard.success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      const promise = result.current.getPointsLeaderboard();

      // Note: In real async scenarios, you might check isLoading here
      await promise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getPointsSiteStats', () => {
    it('should fetch site stats successfully', async () => {
      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      const stats = await result.current.getPointsSiteStats();

      expect(stats).toBeDefined();
      expect(stats.success).toBe(true);
      expect(stats.data?.totalPoints).toBe('1000000');
      expect(stats.data?.totalUsers).toBe(5000);
      expect(mockGetPointsSiteStats).toHaveBeenCalled();
    });

    it('should handle errors in normal mode', async () => {
      mockGetPointsSiteStats.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      await expect(result.current.getPointsSiteStats()).rejects.toThrow(
        'Service unavailable'
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Service unavailable');
      });
    });

    it('should fall back to mock data in dev mode on error', async () => {
      mockGetPointsSiteStats.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, true)
      );

      const stats = await result.current.getPointsSiteStats();

      expect(stats).toBeDefined();
      expect(stats.success).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should clear error', async () => {
      mockGetPointsLeaderboard.mockRejectedValueOnce(
        new Error('Test error')
      );

      const { result } = renderHook(() =>
        useIndexerPoints('https://test-indexer.example.com', false, false)
      );

      try {
        await result.current.getPointsLeaderboard();
      } catch (error) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      result.current.clearError();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
