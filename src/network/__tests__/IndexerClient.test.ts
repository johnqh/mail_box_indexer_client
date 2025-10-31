import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IndexerClient } from '../IndexerClient';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockAxios = vi.mocked(axios, true);

describe('IndexerClient', () => {
  let client: IndexerClient;
  const mockEndpointUrl = 'https://test-indexer.example.com';

  beforeEach(() => {
    client = new IndexerClient(mockEndpointUrl);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance with endpoint URL successfully', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(IndexerClient);
    });

    it('should create instance with dev mode', () => {
      const testClient = new IndexerClient(mockEndpointUrl, true);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(IndexerClient);
    });

    it('should create instance with custom timeout', () => {
      const testClient = new IndexerClient(mockEndpointUrl, false, 5000);
      expect(testClient).toBeDefined();
      expect(testClient).toBeInstanceOf(IndexerClient);
    });
  });

  describe('validateUsername', () => {
    it('should validate address successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {
          isValid: true,
          address: '0x123...',
          addressType: 'evm',
          normalizedAddress: '0x123...',
          timestamp: new Date().toISOString(),
        },
      };
      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.validateUsername('0x123...');
      expect(result.ok).toBe(true);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/users/0x123.../validate'),
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      mockAxios.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Invalid address format' },
        headers: {},
      });

      await expect(
        client.validateUsername('invalid-address')
      ).rejects.toThrow('Failed to validate username');

      expect(mockAxios).toHaveBeenCalled();
    });
  });

  describe('getMessage', () => {
    it('should get signing message', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Sign in with Ethereum to the app.',
          walletAddress: '0x123...',
          chainType: 'evm',
          chainId: 1,
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getMessage(
        1,
        '0x123...',
        'example.com',
        'https://example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.message).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/wallets/0x123.../message?'),
          method: 'GET',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockAxios.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.validateUsername('0x123...')).rejects.toThrow(
        'Indexer API request failed'
      );
    });

    it('should handle timeout errors', async () => {
      const timeoutClient = new IndexerClient(mockEndpointUrl, false, 1);
      mockAxios.mockRejectedValueOnce(new Error('timeout of 1ms exceeded'));

      await expect(timeoutClient.validateUsername('0x123...')).rejects.toThrow();
    });
  });

  describe('points endpoints', () => {
    it('should get points leaderboard', async () => {
      const mockResponse = {
        success: true,
        data: {
          leaderboard: [
            {
              walletAddress: '0x123...',
              chainType: 'evm',
              pointsEarned: '100',
              lastActivityDate: '2025-09-28T18:58:15.155Z',
            },
          ],
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getPointsLeaderboard(10);
      expect(result.success).toBe(true);
      expect(result.data?.leaderboard).toBeDefined();
    });

    it('should get site stats', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalPoints: '1000',
          totalUsers: 50,
          lastUpdated: '2025-09-28T18:58:15.155Z',
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getPointsSiteStats();
      expect(result.success).toBe(true);
      expect(result.data?.totalPoints).toBeDefined();
    });
  });

  describe('OAuth endpoints', () => {
    it('should create auth challenge', async () => {
      const mockResponse = {
        challenge: 'auth.0xmail.box wants you to sign in...',
        session_id: 'session-123',
        expires_in: 600,
        display_name: '0x123...',
        chain_type: 'evm',
        wallet_address: '0x123...',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.createAuthChallenge(
        '0x123...',
        'client-123',
        'http://localhost:3000/callback'
      );

      expect(result.session_id).toBe('session-123');
      expect(result.challenge).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/auth/challenge'),
          method: 'POST',
          data: expect.objectContaining({
            wallet_identifier: '0x123...',
            client_id: 'client-123',
          }),
        })
      );
    });

    it('should verify auth signature', async () => {
      const mockResponse = {
        success: true,
        session_id: 'session-123',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.verifyAuthSignature(
        'session-123',
        '0xsignature...',
        'evm',
        '0x123...'
      );

      expect(result.success).toBe(true);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/auth/verify'),
          method: 'POST',
          data: expect.objectContaining({
            session_id: 'session-123',
            signature: '0xsignature...',
          }),
        })
      );
    });

    it('should authorize OAuth', async () => {
      const mockResponse = {
        success: true,
        redirect_url: 'http://localhost:3000/callback?code=auth-code&state=state-123',
        code: 'auth-code',
        state: 'state-123',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

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
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/oauth/authorize'),
          method: 'GET',
          headers: expect.objectContaining({
            'X-Session-Id': 'session-123',
          }),
        })
      );
    });

    it('should exchange OAuth token', async () => {
      const mockResponse = {
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'openid email',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.exchangeOAuthToken(
        'authorization_code',
        'client-123',
        'auth-code',
        'http://localhost:3000/callback'
      );

      expect(result.access_token).toBeDefined();
      expect(result.token_type).toBe('Bearer');
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/oauth/token'),
          method: 'POST',
          data: expect.objectContaining({
            grant_type: 'authorization_code',
            code: 'auth-code',
          }),
        })
      );
    });

    it('should get OAuth user info', async () => {
      const mockResponse = {
        sub: '0x123...',
        email: '0x123...@0xmail.box',
        email_verified: true,
        wallet_address: '0x123...',
        chain_type: 'evm',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getOAuthUserInfo('access-token');

      expect(result.sub).toBeDefined();
      expect(result.email).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/oauth/userinfo'),
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });

    it('should revoke OAuth token', async () => {
      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: '',
        headers: {},
      });

      await client.revokeOAuthToken('refresh-token');

      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/oauth/revoke'),
          method: 'POST',
          data: expect.objectContaining({
            token: 'refresh-token',
          }),
        })
      );
    });

    it('should get OAuth client info', async () => {
      const mockResponse = {
        client_id: 'client-123',
        client_name: 'Test Client',
        client_uri: 'http://localhost:3000',
        scope: 'openid email profile',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getOAuthClientInfo('client-123');

      expect(result.client_id).toBe('client-123');
      expect(result.client_name).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/oauth/clients/client-123'),
          method: 'GET',
        })
      );
    });

    it('should handle OAuth errors', async () => {
      mockAxios.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'invalid_client' },
        headers: {},
      });

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
      const mockResponse = {
        success: true,
        data: {
          applicationId: 'app-123',
          sumsubAccessToken: 'sumsub-token',
          status: 'INITIATED',
          verificationLevel: 'basic',
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.initiateKYC('0x123...', mockAuth, 'basic');

      expect(result.success).toBe(true);
      expect(result.data?.applicationId).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/kyc/initiate/0x123...'),
          method: 'POST',
          data: { verificationLevel: 'basic' },
          headers: expect.objectContaining({
            'x-signature': '0xsignature...',
            'x-signer': '0x123...',
          }),
        })
      );
    });

    it('should get KYC status', async () => {
      const mockResponse = {
        success: true,
        data: {
          applicationId: 'app-123',
          walletAddress: '0x123...',
          verificationLevel: 'basic',
          status: 'PENDING',
          results: {},
          canRetry: true,
          retriesRemaining: 3,
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getKYCStatus('0x123...', mockAuth);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/kyc/status/0x123...'),
          method: 'GET',
          headers: expect.objectContaining({
            'x-signature': '0xsignature...',
            'x-signer': '0x123...',
          }),
        })
      );
    });

    it('should handle KYC errors', async () => {
      mockAxios.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Invalid verification level' },
        headers: {},
      });

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
      const mockResponse = {
        success: true,
        data: {
          authenticated: true,
          datetime: '2025-09-28T18:58:15.155Z',
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.checkAuthenticated('0x123...', mockAuth);

      expect(result.success).toBe(true);
      expect(result.data?.authenticated).toBe(true);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/wallets/0x123.../authenticated'),
          method: 'GET',
          headers: expect.objectContaining({
            'x-signature': '0xsignature...',
            'x-signer': '0x123...',
          }),
        })
      );
    });

    it('should get block status', async () => {
      const mockResponse = {
        success: true,
        data: {
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
        },
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getBlockStatus();

      expect(result.success).toBe(true);
      expect(result.data?.chains).toBeDefined();
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/blocks'),
          method: 'GET',
        })
      );
    });

    it('should get contract permissions', async () => {
      const mockResponse = {
        success: true,
        contractAddress: '0xabc...',
        chainId: 1,
        testNet: false,
        wallets: ['0x123...', '0x456...'],
        count: 2,
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getContractPermissions('0xabc...', 1, false);

      expect(result.success).toBe(true);
      expect(result.wallets).toBeDefined();
      expect(result.count).toBe(2);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/permissions/contract/0xabc...'),
          method: 'GET',
        })
      );
    });

    it('should get wallet permissions', async () => {
      const mockResponse = {
        success: true,
        walletAddress: '0x123...',
        chainId: 1,
        testNet: false,
        contracts: ['0xabc...', '0xdef...'],
        count: 2,
        timestamp: '2025-09-28T18:58:15.155Z',
      };

      mockAxios.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockResponse,
        headers: {},
      });

      const result = await client.getWalletPermissions('0x123...', 1, false);

      expect(result.success).toBe(true);
      expect(result.contracts).toBeDefined();
      expect(result.count).toBe(2);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/permissions/wallet/0x123...'),
          method: 'GET',
        })
      );
    });

    it('should handle mail endpoint errors', async () => {
      mockAxios.mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Server error' },
        headers: {},
      });

      await expect(client.getBlockStatus()).rejects.toThrow(
        'Failed to get block status'
      );
    });
  });
});
