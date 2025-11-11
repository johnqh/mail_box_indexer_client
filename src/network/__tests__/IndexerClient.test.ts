import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IndexerClient } from '../IndexerClient';
import type { NetworkClient, NetworkResponse, Optional } from '@sudobility/types';

// Mock NetworkClient
class MockNetworkClient implements NetworkClient {
  private mockResponses: Map<string, any> = new Map();

  setMockResponse(url: string, response: any) {
    this.mockResponses.set(url, response);
  }

  clearMocks() {
    this.mockResponses.clear();
  }

  async request<T = unknown>(
    url: string,
    options?: Optional<{
      method?: Optional<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
      headers?: Optional<Record<string, string>>;
      body?: Optional<string | FormData | Blob>;
      signal?: Optional<AbortSignal>;
      timeout?: Optional<number>;
    }>
  ): Promise<NetworkResponse<T>> {
    const response = this.mockResponses.get(url) || this.mockResponses.get('default');
    if (!response) {
      throw new Error(`No mock response configured for URL: ${url}`);
    }

    if (response instanceof Error) {
      throw response;
    }

    return response;
  }

  async get<T = unknown>(
    url: string,
    options?: Optional<any>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = unknown>(
    url: string,
    body?: Optional<unknown>,
    options?: Optional<any>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  async put<T = unknown>(
    url: string,
    body?: Optional<unknown>,
    options?: Optional<any>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  async delete<T = unknown>(
    url: string,
    options?: Optional<any>
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

describe('IndexerClient', () => {
  let client: IndexerClient;
  let mockNetworkClient: MockNetworkClient;
  const mockEndpointUrl = 'https://test-indexer.example.com';

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    client = new IndexerClient(mockEndpointUrl, mockNetworkClient, false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockNetworkClient.clearMocks();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance with endpoint URL successfully', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(IndexerClient);
    });

    it('should create instance with dev mode', () => {
      const testClient = new IndexerClient(mockEndpointUrl, mockNetworkClient, true);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(IndexerClient);
    });
  });

  describe('validateUsername', () => {
    it('should validate address successfully', async () => {
      const mockData = {
        isValid: true,
        address: '0x123...',
        addressType: 'evm',
        normalizedAddress: '0x123...',
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/users/0x123.../validate`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.validateUsername('0x123...');
      expect(result.isValid).toBe(true);
      expect(result.address).toBe('0x123...');
    });

    it('should handle validation errors', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/users/invalid-address/validate`,
        {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid address format' },
          headers: {},
          success: false,
          timestamp: new Date().toISOString(),
        }
      );

      await expect(
        client.validateUsername('invalid-address')
      ).rejects.toThrow('Failed to validate username');
    });
  });

  describe('getMessage', () => {
    it('should get signing message', async () => {
      const mockData = {
        message: 'Sign in with Ethereum to the app.',
        walletAddress: '0x123...',
        chainType: 'evm',
        chainId: 1,
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/wallets/0x123.../message?chainId=1&domain=example.com&url=https%3A%2F%2Fexample.com`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getMessage(
        1,
        '0x123...',
        'example.com',
        'https://example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.message).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/users/0x123.../validate`,
        new Error('Network error')
      );

      await expect(client.validateUsername('0x123...')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('points endpoints', () => {
    it('should get points leaderboard', async () => {
      const mockData = {
        leaderboard: [
          {
            walletAddress: '0x123...',
            chainType: 'evm',
            pointsEarned: '100',
            lastActivityDate: '2025-09-28T18:58:15.155Z',
          },
        ],
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/points/leaderboard/10`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getPointsLeaderboard(10);
      expect(result.success).toBe(true);
      expect(result.data?.leaderboard).toBeDefined();
    });

    it('should get site stats', async () => {
      const mockData = {
        totalPoints: '1000',
        totalUsers: 50,
        lastUpdated: '2025-09-28T18:58:15.155Z',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/points/site-stats`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getPointsSiteStats();
      expect(result.success).toBe(true);
      expect(result.data?.totalPoints).toBeDefined();
    });
  });

  describe('OAuth endpoints', () => {
    it('should create auth challenge', async () => {
      const mockData = {
        challenge: 'auth.0xmail.box wants you to sign in...',
        session_id: 'session-123',
        expires_in: 600,
        display_name: '0x123...',
        chain_type: 'evm',
        wallet_address: '0x123...',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/auth/challenge`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.createAuthChallenge(
        '0x123...',
        'client-123',
        'http://localhost:3000/callback'
      );

      expect(result.session_id).toBe('session-123');
      expect(result.challenge).toBeDefined();
    });

    it('should verify auth signature', async () => {
      const mockData = {
        success: true,
        session_id: 'session-123',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/auth/verify`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.verifyAuthSignature(
        'session-123',
        '0xsignature...',
        'evm',
        '0x123...'
      );

      expect(result.success).toBe(true);
    });

    it('should authorize OAuth', async () => {
      const mockData = {
        success: true,
        redirect_url: 'http://localhost:3000/callback?code=auth-code&state=state-123',
        code: 'auth-code',
        state: 'state-123',
      };

      // URLSearchParams will encode spaces as +, not %20
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/oauth/authorize?client_id=client-123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code&scope=openid+email&state=state-123`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.authorizeOAuth(
        'client-123',
        'http://localhost:3000/callback',
        'code',
        'openid email',
        'state-123',
        'session-123'
      );

      expect(result.success).toBe(true);
      expect(result.code).toBeDefined();
    });

    it('should exchange OAuth token', async () => {
      const mockData = {
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'openid email',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/oauth/token`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.exchangeOAuthToken(
        'authorization_code',
        'client-123',
        'auth-code',
        'http://localhost:3000/callback'
      );

      expect(result.access_token).toBeDefined();
      expect(result.token_type).toBe('Bearer');
    });

    it('should get OAuth user info', async () => {
      const mockData = {
        sub: '0x123...',
        email: '0x123...@0xmail.box',
        email_verified: true,
        wallet_address: '0x123...',
        chain_type: 'evm',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/oauth/userinfo`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getOAuthUserInfo('access-token');

      expect(result.sub).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should revoke OAuth token', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/oauth/revoke`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {},  // Empty object instead of empty string
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      await client.revokeOAuthToken('refresh-token');
      // Should not throw
    });

    it('should get OAuth client info', async () => {
      const mockData = {
        client_id: 'client-123',
        client_name: 'Test Client',
        client_uri: 'http://localhost:3000',
        scope: 'openid email profile',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/oauth/clients/client-123`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getOAuthClientInfo('client-123');

      expect(result.client_id).toBe('client-123');
      expect(result.client_name).toBeDefined();
    });

    it('should handle OAuth errors', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/auth/challenge`,
        {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'invalid_client' },
          headers: {},
          success: false,
          timestamp: new Date().toISOString(),
        }
      );

      await expect(
        client.createAuthChallenge('0x123...', 'invalid-client', 'http://localhost:3000/callback')
      ).rejects.toThrow('Failed to create auth challenge');
    });
  });

  describe('KYC endpoints', () => {
    const mockAuth = {
      signature: '0xsignature...',
      message: 'Sign in with Ethereum...',
      signer: '0x123...',
    };

    it('should initiate KYC', async () => {
      const mockData = {
        applicationId: 'app-123',
        sumsubAccessToken: 'sumsub-token',
        status: 'INITIATED',
        verificationLevel: 'basic',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/kyc/initiate/0x123...`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.initiateKYC('0x123...', mockAuth, 'basic');

      expect(result.success).toBe(true);
      expect(result.data?.applicationId).toBeDefined();
    });

    it('should get KYC status', async () => {
      const mockData = {
        applicationId: 'app-123',
        walletAddress: '0x123...',
        verificationLevel: 'basic',
        status: 'PENDING',
        results: {},
        canRetry: true,
        retriesRemaining: 3,
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/kyc/status/0x123...`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getKYCStatus('0x123...', mockAuth);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBeDefined();
    });

    it('should handle KYC errors', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/kyc/initiate/0x123...`,
        {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid verification level' },
          headers: {},
          success: false,
          timestamp: new Date().toISOString(),
        }
      );

      await expect(
        client.initiateKYC('0x123...', mockAuth, 'basic')
      ).rejects.toThrow('Failed to initiate KYC');
    });
  });

  describe('additional mail endpoints', () => {
    const mockAuth = {
      signature: '0xsignature...',
      message: 'Sign in with Ethereum...',
      signer: '0x123...',
    };

    it('should check authenticated status', async () => {
      const mockData = {
        authenticated: true,
        datetime: '2025-09-28T18:58:15.155Z',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/wallets/0x123.../authenticated`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.checkAuthenticated('0x123...', mockAuth);

      expect(result.success).toBe(true);
      expect(result.data?.authenticated).toBe(true);
    });

    it('should get block status', async () => {
      const mockData = {
        chains: [
          {
            chain: 'ethereum',
            chainId: 1,
            currentBlock: '18000000',
            indexedBlock: '17999000',
            percentage: '99.99%',
            blocksBehind: '1000',
            status: 'syncing',
          },
        ],
        totalChains: 1,
        syncedChains: 0,
        overallHealth: 'syncing',
        summary: {
          syncedCount: 0,
          syncingCount: 1,
          errorCount: 0,
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/blocks`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            data: mockData,
            timestamp: '2025-09-28T18:58:15.155Z',
          },
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getBlockStatus();

      expect(result.success).toBe(true);
      expect(result.data?.chains).toBeDefined();
    });

    it('should get contract permissions', async () => {
      const mockData = {
        success: true,
        contractAddress: '0xabc...',
        chainId: 1,
        testNet: false,
        wallets: ['0x123...', '0x456...'],
        count: 2,
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/permissions/contract/0xabc...?chainId=1&testNet=false`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getContractPermissions('0xabc...', 1, false);

      expect(result.success).toBe(true);
      expect(result.wallets).toBeDefined();
      expect(result.count).toBe(2);
    });

    it('should get wallet permissions', async () => {
      const mockData = {
        success: true,
        walletAddress: '0x123...',
        chainId: 1,
        testNet: false,
        contracts: ['0xabc...', '0xdef...'],
        count: 2,
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/permissions/wallet/0x123...?chainId=1&testNet=false`,
        {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: mockData,
          headers: {},
          success: true,
          timestamp: new Date().toISOString(),
        }
      );

      const result = await client.getWalletPermissions('0x123...', 1, false);

      expect(result.success).toBe(true);
      expect(result.contracts).toBeDefined();
      expect(result.count).toBe(2);
    });

    it('should handle mail endpoint errors', async () => {
      mockNetworkClient.setMockResponse(
        `${mockEndpointUrl}/blocks`,
        {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server error' },
          headers: {},
          success: false,
          timestamp: new Date().toISOString(),
        }
      );

      await expect(client.getBlockStatus()).rejects.toThrow(
        'Failed to get block status'
      );
    });
  });
});
