import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIndexerMailWebhooks } from '../useIndexerMailWebhooks';
import type { IndexerUserAuth } from '../../types';

// Create mock functions that will be shared across all instances
const mockCreateWebhook = vi.fn();
const mockGetWebhooks = vi.fn();
const mockGetWebhook = vi.fn();
const mockDeleteWebhook = vi.fn();

// Mock IndexerClient
vi.mock('../../network/IndexerClient', () => {
  return {
    IndexerClient: vi.fn().mockImplementation(() => ({
      createWebhook: mockCreateWebhook,
      getWebhooks: mockGetWebhooks,
      getWebhook: mockGetWebhook,
      deleteWebhook: mockDeleteWebhook,
    })),
  };
});

describe('useIndexerMailWebhooks', () => {
  const mockEndpointUrl = 'https://test-indexer.example.com';
  const mockWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  const mockAuth: IndexerUserAuth = {
    signature: 'mock-signature',
    message: 'mock-message',
    signer: mockWalletAddress,
  };
  const mockWebhookId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      expect(result.current.webhooks).toBeNull();
      expect(result.current.webhook).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all CRUD functions', () => {
      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      expect(typeof result.current.createWebhook).toBe('function');
      expect(typeof result.current.getWebhooks).toBe('function');
      expect(typeof result.current.getWebhook).toBe('function');
      expect(typeof result.current.deleteWebhook).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      const mockWebhook = {
        id: mockWebhookId,
        userId: mockWalletAddress.toLowerCase(),
        webhookUrl: 'https://example.com/webhook',
        isActive: true,
        triggerCount: 0,
        lastTriggeredAt: null,
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      const mockResponse = {
        success: true,
        webhook: mockWebhook,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockCreateWebhook.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      const webhookData = {
        webhookUrl: 'https://example.com/webhook',
      };

      let response;
      await act(async () => {
        response = await result.current.createWebhook(
          mockWalletAddress,
          mockAuth,
          webhookData
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.webhook).toEqual(mockWebhook);
      expect(result.current.error).toBeNull();
      expect(mockCreateWebhook).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        webhookData
      );
    });

    it('should handle create webhook errors', async () => {
      const errorMessage = 'Failed to create webhook';
      mockCreateWebhook.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      const webhookData = {
        webhookUrl: 'https://example.com/webhook',
      };

      await act(async () => {
        await expect(
          result.current.createWebhook(mockWalletAddress, mockAuth, webhookData)
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.webhook).toBeNull();
    });
  });

  describe('getWebhooks', () => {
    it('should get list of webhooks successfully', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          userId: mockWalletAddress.toLowerCase(),
          webhookUrl: 'https://example.com/webhook1',
          isActive: true,
          triggerCount: 5,
          lastTriggeredAt: '2025-10-13T00:00:00.000Z',
          createdAt: '2025-10-13T00:00:00.000Z',
          updatedAt: '2025-10-13T00:00:00.000Z',
        },
        {
          id: 'webhook-2',
          userId: mockWalletAddress.toLowerCase(),
          webhookUrl: 'https://example.com/webhook2',
          isActive: true,
          triggerCount: 3,
          lastTriggeredAt: null,
          createdAt: '2025-10-13T00:00:00.000Z',
          updatedAt: '2025-10-13T00:00:00.000Z',
        },
      ];

      const mockResponse = {
        success: true,
        webhooks: mockWebhooks,
        total: 2,
        hasMore: false,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetWebhooks.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.getWebhooks(
          mockWalletAddress,
          mockAuth,
          { active: true, limit: 10, offset: 0 }
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.webhooks).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockGetWebhooks).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        { active: true, limit: 10, offset: 0 }
      );
    });

    it('should handle get webhooks errors', async () => {
      const errorMessage = 'Failed to get webhooks';
      mockGetWebhooks.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getWebhooks(mockWalletAddress, mockAuth)
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.webhooks).toBeNull();
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        webhooks: [],
        total: 100,
        hasMore: true,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetWebhooks.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await result.current.getWebhooks(mockWalletAddress, mockAuth, {
          active: true,
          limit: 50,
          offset: 50,
        });
      });

      expect(mockGetWebhooks).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        { active: true, limit: 50, offset: 50 }
      );
    });
  });

  describe('getWebhook', () => {
    it('should get a single webhook successfully', async () => {
      const mockWebhook = {
        id: mockWebhookId,
        userId: mockWalletAddress.toLowerCase(),
        webhookUrl: 'https://example.com/webhook',
        isActive: true,
        triggerCount: 10,
        lastTriggeredAt: '2025-10-13T00:00:00.000Z',
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      const mockResponse = {
        success: true,
        webhook: mockWebhook,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetWebhook.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.getWebhook(
          mockWalletAddress,
          mockWebhookId,
          mockAuth
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.webhook).toEqual(mockWebhook);
      expect(result.current.error).toBeNull();
      expect(mockGetWebhook).toHaveBeenCalledWith(
        mockWalletAddress,
        mockWebhookId,
        mockAuth
      );
    });

    it('should handle get webhook errors', async () => {
      const errorMessage = 'Failed to get webhook';
      mockGetWebhook.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getWebhook(mockWalletAddress, mockWebhookId, mockAuth)
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Webhook deleted successfully',
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockDeleteWebhook.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.deleteWebhook(
          mockWalletAddress,
          mockWebhookId,
          mockAuth
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockDeleteWebhook).toHaveBeenCalledWith(
        mockWalletAddress,
        mockWebhookId,
        mockAuth
      );
    });

    it('should clear current webhook if it was deleted', async () => {
      const mockResponse = {
        success: true,
        message: 'Webhook deleted successfully',
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockDeleteWebhook.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      // First, set a webhook
      const initialWebhook = {
        id: mockWebhookId,
        userId: mockWalletAddress.toLowerCase(),
        webhookUrl: 'https://example.com/webhook',
        isActive: true,
        triggerCount: 0,
        lastTriggeredAt: null,
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      // Simulate getting a webhook first
      mockGetWebhook.mockResolvedValueOnce({
        success: true,
        webhook: initialWebhook,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      });

      await act(async () => {
        await result.current.getWebhook(
          mockWalletAddress,
          mockWebhookId,
          mockAuth
        );
      });

      expect(result.current.webhook).toEqual(initialWebhook);

      // Now delete it
      await act(async () => {
        await result.current.deleteWebhook(
          mockWalletAddress,
          mockWebhookId,
          mockAuth
        );
      });

      expect(result.current.webhook).toBeNull();
    });

    it('should handle delete webhook errors', async () => {
      const errorMessage = 'Failed to delete webhook';
      mockDeleteWebhook.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.deleteWebhook(
            mockWalletAddress,
            mockWebhookId,
            mockAuth
          )
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('utility functions', () => {
    it('should clear error', async () => {
      mockGetWebhooks.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      // Trigger an error
      await act(async () => {
        await expect(
          result.current.getWebhooks(mockWalletAddress, mockAuth)
        ).rejects.toThrow('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset all state', async () => {
      const mockResponse = {
        success: true,
        webhooks: [
          {
            id: 'webhook-1',
            userId: mockWalletAddress.toLowerCase(),
            webhookUrl: 'https://example.com/webhook',
            isActive: true,
            triggerCount: 5,
            lastTriggeredAt: null,
            createdAt: '2025-10-13T00:00:00.000Z',
            updatedAt: '2025-10-13T00:00:00.000Z',
          },
        ],
        total: 1,
        hasMore: false,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetWebhooks.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      // Populate state
      await act(async () => {
        await result.current.getWebhooks(mockWalletAddress, mockAuth);
      });

      expect(result.current.webhooks).toEqual(mockResponse);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.webhooks).toBeNull();
      expect(result.current.webhook).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('authentication and authorization', () => {
    it('should include auth headers in all requests', async () => {
      const mockResponse = {
        success: true,
        webhooks: [],
        total: 0,
        hasMore: false,
        verified: true,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetWebhooks.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await result.current.getWebhooks(mockWalletAddress, mockAuth);
      });

      expect(mockGetWebhooks).toHaveBeenCalledWith(
        mockWalletAddress,
        expect.objectContaining({
          signature: 'mock-signature',
          message: 'mock-message',
          signer: mockWalletAddress,
        }),
        undefined
      );
    });
  });

  describe('error handling', () => {
    it('should handle non-Error exceptions', async () => {
      mockCreateWebhook.mockRejectedValueOnce('String error');

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.createWebhook(mockWalletAddress, mockAuth, {
            webhookUrl: 'https://example.com/webhook',
          })
        ).rejects.toBe('String error');
      });

      expect(result.current.error).toBe('Failed to create webhook');
    });

    it('should handle network errors gracefully', async () => {
      mockGetWebhooks.mockRejectedValueOnce(
        new Error('Network error: Connection refused')
      );

      const { result } = renderHook(() =>
        useIndexerMailWebhooks(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getWebhooks(mockWalletAddress, mockAuth)
        ).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBe('Network error: Connection refused');
    });
  });
});
