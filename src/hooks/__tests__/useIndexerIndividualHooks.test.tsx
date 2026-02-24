/**
 * Tests for individual indexer hooks that previously lacked dedicated test coverage.
 *
 * Covers: useIndexerGetWalletAccounts, useIndexerGetDelegatedTo, useIndexerGetDelegatedFrom,
 * useIndexerGetNonce, useIndexerCreateNonce, useIndexerGetEntitlement,
 * useIndexerGetPointsBalance, useIndexerGetWalletPermissions, useIndexerValidateUsername,
 * useIndexerGetSigningMessage, useIndexerPointsInfo, useIndexerPointsLeaderboard,
 * useIndexerPointsSiteStats, useWalletNames, useResolveNameToAddress,
 * useIndexerReferralCode, useIndexerReferralStats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { MockNetworkClient } from '@sudobility/di/mocks';
import type { IndexerUserAuth } from '../../types';

// ---- Mock setup ----

const mockValidateUsername = vi.fn();
const mockGetMessage = vi.fn();
const mockGetPointsInfo = vi.fn();
const mockGetPointsLeaderboard = vi.fn();
const mockGetPointsSiteStats = vi.fn();
const mockGetWalletAccounts = vi.fn();
const mockGetDelegatedTo = vi.fn();
const mockGetDelegatedFrom = vi.fn();
const mockCreateNonce = vi.fn();
const mockGetNonce = vi.fn();
const mockGetEntitlement = vi.fn();
const mockGetPointsBalance = vi.fn();
const mockGetWalletPermissions = vi.fn();
const mockGetWalletNames = vi.fn();
const mockResolveNameToAddress = vi.fn();
const mockGetReferralCode = vi.fn();
const mockGetReferralStats = vi.fn();

vi.mock('../../network/IndexerClient', () => {
  return {
    IndexerClient: class {
      validateUsername = mockValidateUsername;
      getMessage = mockGetMessage;
      getPointsInfo = mockGetPointsInfo;
      getPointsLeaderboard = mockGetPointsLeaderboard;
      getPointsSiteStats = mockGetPointsSiteStats;
      getWalletAccounts = mockGetWalletAccounts;
      getDelegatedTo = mockGetDelegatedTo;
      getDelegatedFrom = mockGetDelegatedFrom;
      createNonce = mockCreateNonce;
      getNonce = mockGetNonce;
      getEntitlement = mockGetEntitlement;
      getPointsBalance = mockGetPointsBalance;
      getWalletPermissions = mockGetWalletPermissions;
      getWalletNames = mockGetWalletNames;
      resolveNameToAddress = mockResolveNameToAddress;
      getReferralCode = mockGetReferralCode;
      getReferralStats = mockGetReferralStats;
    },
  };
});

// ---- Imports after mock ----

import { useIndexerGetWalletAccounts } from '../useIndexerGetWalletAccounts';
import { useIndexerGetDelegatedTo } from '../useIndexerGetDelegatedTo';
import { useIndexerGetDelegatedFrom } from '../useIndexerGetDelegatedFrom';
import { useIndexerCreateNonce } from '../useIndexerCreateNonce';
import { useIndexerGetNonce } from '../useIndexerGetNonce';
import { useIndexerGetEntitlement } from '../useIndexerGetEntitlement';
import { useIndexerGetPointsBalance } from '../useIndexerGetPointsBalance';
import { useIndexerGetWalletPermissions } from '../useIndexerGetWalletPermissions';
import { useIndexerValidateUsername } from '../useIndexerValidateUsername';
import { useIndexerGetSigningMessage } from '../useIndexerGetSigningMessage';
import {
  useIndexerPointsInfo,
  useIndexerPointsLeaderboard,
  useIndexerPointsSiteStats,
} from '../useIndexerPoints';
import { useWalletNames, useResolveNameToAddress } from '../useIndexerNameService';
import { useIndexerReferralCode } from '../useIndexerReferralCode';
import { useIndexerReferralStats } from '../useIndexerReferralStats';

// ---- Shared helpers ----

const networkClient = new MockNetworkClient();
const endpointUrl = 'https://test-indexer.example.com';
const mockAuth: IndexerUserAuth = {
  signature: 'mock-sig',
  message: 'mock-msg',
  signer: '0xWallet',
};
const emptyAuth: IndexerUserAuth = { signature: '', message: '', signer: '' };

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================
// useQuery-based hooks
// ==========================================

describe('useIndexerGetWalletAccounts', () => {
  it('should fetch wallet accounts when auth is provided', async () => {
    const mockData = { success: true, data: { accounts: [] }, timestamp: '' };
    mockGetWalletAccounts.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetWalletAccounts(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetWalletAccounts).toHaveBeenCalledWith('0xWallet', mockAuth, undefined);
  });

  it('should not fetch when auth is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetWalletAccounts(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          emptyAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetWalletAccounts).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    mockGetWalletAccounts.mockRejectedValue(new Error('Auth failed'));

    const { result } = renderHook(
      () =>
        useIndexerGetWalletAccounts(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Auth failed');
  });
});

describe('useIndexerGetDelegatedTo', () => {
  it('should fetch delegation data', async () => {
    const mockData = {
      success: true,
      data: { walletAddress: '0xDelegate', chainType: 'evm', chainId: null, txHash: null },
      timestamp: '',
    };
    mockGetDelegatedTo.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetDelegatedTo(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when auth is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetDelegatedTo(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          emptyAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should handle errors', async () => {
    mockGetDelegatedTo.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () =>
        useIndexerGetDelegatedTo(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useIndexerGetDelegatedFrom', () => {
  it('should fetch delegators data', async () => {
    const mockData = { success: true, data: { from: [] }, timestamp: '' };
    mockGetDelegatedFrom.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetDelegatedFrom(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when auth is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetDelegatedFrom(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          emptyAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useIndexerGetNonce', () => {
  it('should fetch nonce data', async () => {
    const mockData = { success: true, data: { nonce: 'abc123' }, timestamp: '' };
    mockGetNonce.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetNonce(
          networkClient,
          endpointUrl,
          false,
          'testuser',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.nonce).toBe('abc123');
  });

  it('should not fetch when username is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetNonce(
          networkClient,
          endpointUrl,
          false,
          '',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useIndexerGetEntitlement', () => {
  it('should fetch entitlement data', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainType: 'evm',
        entitlement: { type: 'nameservice', hasEntitlement: true, isActive: true, productIdentifier: null, store: null },
        message: 'has entitlement',
        verified: true,
      },
      timestamp: '',
    };
    mockGetEntitlement.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetEntitlement(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.entitlement?.hasEntitlement).toBe(true);
  });

  it('should not fetch when wallet is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetEntitlement(
          networkClient,
          endpointUrl,
          false,
          '',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useIndexerGetPointsBalance', () => {
  it('should fetch points balance', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainType: 'evm',
        pointsEarned: '1000',
        lastActivityDate: '2025-01-01',
        totalActivities: 50,
        leaderboardRank: 100,
        createdAt: null,
        updatedAt: null,
      },
      timestamp: '',
    };
    mockGetPointsBalance.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetPointsBalance(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.pointsEarned).toBe('1000');
  });

  it('should not fetch when auth is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetPointsBalance(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          emptyAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useIndexerGetWalletPermissions', () => {
  it('should fetch wallet permissions', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainId: 1,
        permissions: ['read', 'write'],
        timestamp: '',
      },
      timestamp: '',
    };
    mockGetWalletPermissions.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerGetWalletPermissions(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          1,
          false
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.permissions).toEqual(['read', 'write']);
  });

  it('should not fetch when wallet is empty', () => {
    const { result } = renderHook(
      () =>
        useIndexerGetWalletPermissions(
          networkClient,
          endpointUrl,
          false,
          '',
          1,
          false
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should handle errors', async () => {
    mockGetWalletPermissions.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useIndexerGetWalletPermissions(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          1,
          false
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useWalletNames', () => {
  it('should fetch wallet names', async () => {
    const mockData = {
      success: true,
      data: { names: ['vitalik.eth', 'example.sol'] },
      timestamp: '',
    };
    mockGetWalletNames.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useWalletNames(
          networkClient,
          endpointUrl,
          false,
          '0xWallet',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when wallet is empty', () => {
    const { result } = renderHook(
      () =>
        useWalletNames(
          networkClient,
          endpointUrl,
          false,
          '',
          mockAuth
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useResolveNameToAddress', () => {
  it('should resolve name to address', async () => {
    const mockData = {
      success: true,
      data: { address: '0xResolved', chainType: 'evm' },
      timestamp: '',
    };
    mockResolveNameToAddress.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useResolveNameToAddress(
          networkClient,
          endpointUrl,
          false,
          'vitalik.eth'
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should not fetch when name is empty', () => {
    const { result } = renderHook(
      () =>
        useResolveNameToAddress(
          networkClient,
          endpointUrl,
          false,
          ''
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should handle errors', async () => {
    mockResolveNameToAddress.mockRejectedValue(new Error('Name not found'));

    const { result } = renderHook(
      () =>
        useResolveNameToAddress(
          networkClient,
          endpointUrl,
          false,
          'nonexistent.eth'
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useIndexerPointsInfo', () => {
  it('should fetch points info', async () => {
    const mockData = {
      success: true,
      data: {
        siteStats: { totalPoints: '1000', totalUsers: 100, lastUpdated: '' },
        topUsers: [],
      },
      timestamp: '',
    };
    mockGetPointsInfo.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerPointsInfo(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.siteStats?.totalPoints).toBe('1000');
  });

  it('should handle errors', async () => {
    mockGetPointsInfo.mockRejectedValue(new Error('Service unavailable'));

    const { result } = renderHook(
      () =>
        useIndexerPointsInfo(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useIndexerPointsLeaderboard', () => {
  it('should fetch leaderboard with default count', async () => {
    const mockData = {
      success: true,
      data: { leaderboard: [{ walletAddress: '0x1', chainType: 'evm', pointsEarned: '500' }] },
      timestamp: '',
    };
    mockGetPointsLeaderboard.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerPointsLeaderboard(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetPointsLeaderboard).toHaveBeenCalledWith(10);
  });

  it('should fetch leaderboard with custom count', async () => {
    const mockData = {
      success: true,
      data: { leaderboard: [] },
      timestamp: '',
    };
    mockGetPointsLeaderboard.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerPointsLeaderboard(networkClient, endpointUrl, false, 25),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetPointsLeaderboard).toHaveBeenCalledWith(25);
  });
});

describe('useIndexerPointsSiteStats', () => {
  it('should fetch site stats', async () => {
    const mockData = {
      success: true,
      data: { totalPoints: '50000', totalUsers: 200, lastUpdated: '' },
      timestamp: '',
    };
    mockGetPointsSiteStats.mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useIndexerPointsSiteStats(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.totalUsers).toBe(200);
  });
});

// ==========================================
// useMutation-based hooks
// ==========================================

describe('useIndexerValidateUsername', () => {
  it('should validate username successfully', async () => {
    const mockData = {
      success: true,
      data: { walletAddress: 'testuser', chainType: 'evm', name: null },
      timestamp: '',
    };
    mockValidateUsername.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerValidateUsername(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.validateUsername('testuser');
    });

    expect(response).toEqual(mockData);
    expect(mockValidateUsername).toHaveBeenCalledWith('testuser');
    expect(result.current.error).toBeNull();
  });

  it('should handle validation errors', async () => {
    mockValidateUsername.mockRejectedValue(new Error('Invalid format'));

    const { result } = renderHook(
      () => useIndexerValidateUsername(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.validateUsername('bad!name');
    });

    expect(response).toBeUndefined();
    await waitFor(() => {
      expect(result.current.error).toBe('Invalid format');
    });
  });

  it('should clear error', async () => {
    mockValidateUsername.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(
      () => useIndexerValidateUsername(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.validateUsername('test');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useIndexerGetSigningMessage', () => {
  it('should get signing message successfully', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainType: 'evm',
        message: 'Sign this message...',
        chainId: 1,
      },
      timestamp: '',
    };
    mockGetMessage.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerGetSigningMessage(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.getSigningMessage(
        '0xWallet',
        1,
        'example.com',
        'https://example.com'
      );
    });

    expect(response).toEqual(mockData);
    expect(mockGetMessage).toHaveBeenCalledWith(1, '0xWallet', 'example.com', 'https://example.com');
  });

  it('should handle errors', async () => {
    mockGetMessage.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () => useIndexerGetSigningMessage(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.getSigningMessage(
        '0xWallet',
        1,
        'example.com',
        'https://example.com'
      );
    });

    expect(response).toBeUndefined();
    await waitFor(() => {
      expect(result.current.error).toBe('Server error');
    });
  });
});

describe('useIndexerCreateNonce', () => {
  it('should create nonce successfully', async () => {
    const mockData = { success: true, data: { nonce: 'new-nonce' }, timestamp: '' };
    mockCreateNonce.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerCreateNonce(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.createNonce('testuser', mockAuth);
    });

    expect(response).toEqual(mockData);
    expect(mockCreateNonce).toHaveBeenCalledWith('testuser', mockAuth);
  });

  it('should handle create nonce errors', async () => {
    mockCreateNonce.mockRejectedValue(new Error('Auth failed'));

    const { result } = renderHook(
      () => useIndexerCreateNonce(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    let response;
    await act(async () => {
      response = await result.current.createNonce('testuser', mockAuth);
    });

    expect(response).toBeUndefined();
    await waitFor(() => {
      expect(result.current.error).toBe('Auth failed');
    });
  });

  it('should clear error', async () => {
    mockCreateNonce.mockRejectedValue(new Error('Err'));

    const { result } = renderHook(
      () => useIndexerCreateNonce(networkClient, endpointUrl, false),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.createNonce('testuser', mockAuth);
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

// ==========================================
// Custom state hooks (referral code, stats)
// ==========================================

describe('useIndexerReferralCode', () => {
  it('should fetch referral code successfully', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainType: 'evm',
        referralCode: 'ABC123',
        totalRedemptions: 5,
        createdAt: '2025-01-01',
      },
      timestamp: '',
    };
    mockGetReferralCode.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerReferralCode(networkClient, endpointUrl, false)
    );

    let response;
    await act(async () => {
      response = await result.current.fetchReferralCode('0xWallet', mockAuth);
    });

    expect(response).toEqual(mockData);
    expect(result.current.referralCode).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    mockGetReferralCode.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(
      () => useIndexerReferralCode(networkClient, endpointUrl, false)
    );

    let response;
    await act(async () => {
      response = await result.current.fetchReferralCode('0xWallet', mockAuth);
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toBe('Failed');
  });

  it('should clear error', async () => {
    mockGetReferralCode.mockRejectedValue(new Error('Err'));

    const { result } = renderHook(
      () => useIndexerReferralCode(networkClient, endpointUrl, false)
    );

    await act(async () => {
      await result.current.fetchReferralCode('0xWallet', mockAuth);
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset state', async () => {
    const mockData = {
      success: true,
      data: { walletAddress: '0xWallet', chainType: 'evm', referralCode: 'X', totalRedemptions: 0, createdAt: '' },
      timestamp: '',
    };
    mockGetReferralCode.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerReferralCode(networkClient, endpointUrl, false)
    );

    await act(async () => {
      await result.current.fetchReferralCode('0xWallet', mockAuth);
    });

    expect(result.current.referralCode).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.referralCode).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useIndexerReferralStats', () => {
  it('should fetch referral stats successfully', async () => {
    const mockData = {
      success: true,
      data: {
        walletAddress: '0xWallet',
        chainType: 'evm',
        referralCode: 'ABC123',
        totalReferred: 3,
        referredWallets: [],
      },
      timestamp: '',
    };
    mockGetReferralStats.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerReferralStats(networkClient, endpointUrl, false)
    );

    let response;
    await act(async () => {
      response = await result.current.fetchStats('ABC123');
    });

    expect(response).toEqual(mockData);
    expect(result.current.stats).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    mockGetReferralStats.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(
      () => useIndexerReferralStats(networkClient, endpointUrl, false)
    );

    let response;
    await act(async () => {
      response = await result.current.fetchStats('BADCODE');
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toBe('Not found');
  });

  it('should clear error', async () => {
    mockGetReferralStats.mockRejectedValue(new Error('Err'));

    const { result } = renderHook(
      () => useIndexerReferralStats(networkClient, endpointUrl, false)
    );

    await act(async () => {
      await result.current.fetchStats('X');
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset state', async () => {
    const mockData = {
      success: true,
      data: { walletAddress: '', chainType: 'evm', referralCode: 'X', totalReferred: 0, referredWallets: [] },
      timestamp: '',
    };
    mockGetReferralStats.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useIndexerReferralStats(networkClient, endpointUrl, false)
    );

    await act(async () => {
      await result.current.fetchStats('X');
    });

    expect(result.current.stats).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
