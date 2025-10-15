import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIndexerMailTemplates } from '../useIndexerMailTemplates';
import type { IndexerUserAuth } from '../../types';

// Create mock functions that will be shared across all instances
const mockCreateMailTemplate = vi.fn();
const mockGetMailTemplates = vi.fn();
const mockGetMailTemplate = vi.fn();
const mockUpdateMailTemplate = vi.fn();
const mockDeleteMailTemplate = vi.fn();

// Mock IndexerClient
vi.mock('../../network/IndexerClient', () => {
  return {
    IndexerClient: vi.fn().mockImplementation(() => ({
      createMailTemplate: mockCreateMailTemplate,
      getMailTemplates: mockGetMailTemplates,
      getMailTemplate: mockGetMailTemplate,
      updateMailTemplate: mockUpdateMailTemplate,
      deleteMailTemplate: mockDeleteMailTemplate,
    })),
  };
});

describe('useIndexerMailTemplates', () => {
  const mockEndpointUrl = 'https://test-indexer.example.com';
  const mockWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
  const mockAuth: IndexerUserAuth = {
    signature: 'mock-signature',
    message: 'mock-message',
    signer: mockWalletAddress,
  };
  const mockTemplateId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      expect(result.current.templates).toBeNull();
      expect(result.current.template).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all CRUD functions', () => {
      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      expect(typeof result.current.createTemplate).toBe('function');
      expect(typeof result.current.getTemplates).toBe('function');
      expect(typeof result.current.getTemplate).toBe('function');
      expect(typeof result.current.updateTemplate).toBe('function');
      expect(typeof result.current.deleteTemplate).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('createTemplate', () => {
    it('should create a template successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: mockWalletAddress.toLowerCase(),
        name: 'Test Template',
        subject: 'Test Subject',
        body: 'Test body content',
        isActive: true,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      const mockResponse = {
        success: true,
        data: {
          template: mockTemplate,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockCreateMailTemplate.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      const templateData = {
        name: 'Test Template',
        subject: 'Test Subject',
        body: 'Test body content',
      };

      let response;
      await act(async () => {
        response = await result.current.createTemplate(
          mockWalletAddress,
          mockAuth,
          templateData
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.template).toEqual(mockTemplate);
      expect(result.current.error).toBeNull();
      expect(mockCreateMailTemplate).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        templateData
      );
    });

    it('should handle create template errors', async () => {
      const errorMessage = 'Failed to create template';
      mockCreateMailTemplate.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      const templateData = {
        name: 'Test Template',
        subject: 'Test Subject',
        body: 'Test body',
      };

      await act(async () => {
        await expect(
          result.current.createTemplate(
            mockWalletAddress,
            mockAuth,
            templateData
          )
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.template).toBeNull();
    });
  });

  describe('getTemplates', () => {
    it('should get list of templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          userId: mockWalletAddress.toLowerCase(),
          name: 'Template 1',
          subject: 'Subject 1',
          body: 'Body 1',
          isActive: true,
          usageCount: 5,
          lastUsedAt: '2025-10-13T00:00:00.000Z',
          createdAt: '2025-10-13T00:00:00.000Z',
          updatedAt: '2025-10-13T00:00:00.000Z',
        },
        {
          id: 'template-2',
          userId: mockWalletAddress.toLowerCase(),
          name: 'Template 2',
          subject: 'Subject 2',
          body: 'Body 2',
          isActive: true,
          usageCount: 3,
          lastUsedAt: null,
          createdAt: '2025-10-13T00:00:00.000Z',
          updatedAt: '2025-10-13T00:00:00.000Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: {
          templates: mockTemplates,
          total: 2,
          hasMore: false,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetMailTemplates.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.getTemplates(
          mockWalletAddress,
          mockAuth,
          { active: true, limit: 10, offset: 0 }
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.templates).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockGetMailTemplates).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        { active: true, limit: 10, offset: 0 }
      );
    });

    it('should handle get templates errors', async () => {
      const errorMessage = 'Failed to get templates';
      mockGetMailTemplates.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getTemplates(mockWalletAddress, mockAuth)
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.templates).toBeNull();
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [],
          total: 100,
          hasMore: true,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetMailTemplates.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await result.current.getTemplates(mockWalletAddress, mockAuth, {
          active: true,
          limit: 50,
          offset: 50,
        });
      });

      expect(mockGetMailTemplates).toHaveBeenCalledWith(
        mockWalletAddress,
        mockAuth,
        { active: true, limit: 50, offset: 50 }
      );
    });
  });

  describe('getTemplate', () => {
    it('should get a single template successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: mockWalletAddress.toLowerCase(),
        name: 'Test Template',
        subject: 'Test Subject',
        body: 'Test body content',
        isActive: true,
        usageCount: 10,
        lastUsedAt: '2025-10-13T00:00:00.000Z',
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      const mockResponse = {
        success: true,
        data: {
          template: mockTemplate,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetMailTemplate.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.getTemplate(
          mockWalletAddress,
          mockTemplateId,
          mockAuth
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.template).toEqual(mockTemplate);
      expect(result.current.error).toBeNull();
      expect(mockGetMailTemplate).toHaveBeenCalledWith(
        mockWalletAddress,
        mockTemplateId,
        mockAuth
      );
    });

    it('should handle get template errors', async () => {
      const errorMessage = 'Failed to get template';
      mockGetMailTemplate.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getTemplate(
            mockWalletAddress,
            mockTemplateId,
            mockAuth
          )
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('updateTemplate', () => {
    it('should update template name successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        userId: mockWalletAddress.toLowerCase(),
        name: 'Updated Template',
        subject: 'Test Subject',
        body: 'Original body',
        isActive: true,
        usageCount: 10,
        lastUsedAt: '2025-10-13T00:00:00.000Z',
        createdAt: '2025-10-13T00:00:00.000Z',
        updatedAt: '2025-10-13T00:00:00.000Z',
      };

      const mockResponse = {
        success: true,
        data: {
          template: mockTemplate,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockUpdateMailTemplate.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      const updates = { name: 'Updated Template' };

      let response;
      await act(async () => {
        response = await result.current.updateTemplate(
          mockWalletAddress,
          mockTemplateId,
          mockAuth,
          updates
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.template).toEqual(mockTemplate);
      expect(result.current.error).toBeNull();
      expect(mockUpdateMailTemplate).toHaveBeenCalledWith(
        mockWalletAddress,
        mockTemplateId,
        mockAuth,
        updates
      );
    });

    it('should handle update template errors', async () => {
      const errorMessage = 'Failed to update template';
      mockUpdateMailTemplate.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.updateTemplate(
            mockWalletAddress,
            mockTemplateId,
            mockAuth,
            { name: 'Updated' }
          )
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Template deleted successfully',
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockDeleteMailTemplate.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      let response;
      await act(async () => {
        response = await result.current.deleteTemplate(
          mockWalletAddress,
          mockTemplateId,
          mockAuth
        );
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockDeleteMailTemplate).toHaveBeenCalledWith(
        mockWalletAddress,
        mockTemplateId,
        mockAuth
      );
    });

    it('should handle delete template errors', async () => {
      const errorMessage = 'Failed to delete template';
      mockDeleteMailTemplate.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.deleteTemplate(
            mockWalletAddress,
            mockTemplateId,
            mockAuth
          )
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('utility functions', () => {
    it('should clear error', async () => {
      mockGetMailTemplates.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      // Trigger an error
      await act(async () => {
        await expect(
          result.current.getTemplates(mockWalletAddress, mockAuth)
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
        data: {
          templates: [
            {
              id: 'template-1',
              userId: mockWalletAddress.toLowerCase(),
              name: 'Template 1',
              subject: 'Subject 1',
              body: 'Body 1',
              isActive: true,
              usageCount: 5,
              lastUsedAt: null,
              createdAt: '2025-10-13T00:00:00.000Z',
              updatedAt: '2025-10-13T00:00:00.000Z',
            },
          ],
          total: 1,
          hasMore: false,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetMailTemplates.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      // Populate state
      await act(async () => {
        await result.current.getTemplates(mockWalletAddress, mockAuth);
      });

      expect(result.current.templates).toEqual(mockResponse);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.templates).toBeNull();
      expect(result.current.template).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('authentication and authorization', () => {
    it('should include auth headers in all requests', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [],
          total: 0,
          hasMore: false,
          verified: true,
        },
        error: null,
        timestamp: '2025-10-13T00:00:00.000Z',
      };

      mockGetMailTemplates.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await result.current.getTemplates(mockWalletAddress, mockAuth);
      });

      expect(mockGetMailTemplates).toHaveBeenCalledWith(
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
      mockCreateMailTemplate.mockRejectedValueOnce('String error');

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.createTemplate(mockWalletAddress, mockAuth, {
            name: 'Test',
            subject: 'Test',
            body: 'Test',
          })
        ).rejects.toBe('String error');
      });

      expect(result.current.error).toBe('Failed to create template');
    });

    it('should handle network errors gracefully', async () => {
      mockGetMailTemplates.mockRejectedValueOnce(
        new Error('Network error: Connection refused')
      );

      const { result } = renderHook(() =>
        useIndexerMailTemplates(mockEndpointUrl, false)
      );

      await act(async () => {
        await expect(
          result.current.getTemplates(mockWalletAddress, mockAuth)
        ).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBe('Network error: Connection refused');
    });
  });
});
