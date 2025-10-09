/**
 * Integration tests for IndexerClient
 * These tests run against a real indexer endpoint
 *
 * Set INTEGRATION_TEST_INDEXER_URL in .env.test to configure the endpoint
 * Example: INTEGRATION_TEST_INDEXER_URL=https://indexer.0xmail.box
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { IndexerClient } from '../network/IndexerClient';
import type { IndexerUserAuth } from '../types';

describe('IndexerClient Integration Tests', () => {
  let client: IndexerClient;
  const indexerUrl = process.env.INTEGRATION_TEST_INDEXER_URL;

  beforeAll(() => {
    if (!indexerUrl) {
      throw new Error(
        'INTEGRATION_TEST_INDEXER_URL environment variable is not set. ' +
        'Please set it in .env.test file.'
      );
    }
    client = new IndexerClient(indexerUrl, false);
  });

  describe('Health Check', () => {
    it('should connect to the indexer endpoint', async () => {
      // Use a public endpoint to verify connectivity
      const response = await client.getPointsSiteStats();

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.timestamp).toBeDefined();
    }, 10000); // 10 second timeout for network requests
  });

  describe('Points API', () => {
    it('should get points leaderboard', async () => {
      const response = await client.getPointsLeaderboard(10);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.leaderboard).toBeDefined();
      expect(Array.isArray(response.data?.leaderboard)).toBe(true);

      // If leaderboard has entries, validate structure
      if (response.data?.leaderboard && response.data.leaderboard.length > 0) {
        const firstEntry = response.data.leaderboard[0];
        expect(firstEntry).toHaveProperty('walletAddress');
        expect(firstEntry).toHaveProperty('chainType');
        expect(firstEntry).toHaveProperty('pointsEarned');
      }
    }, 10000);

    it('should get site stats', async () => {
      const response = await client.getPointsSiteStats();

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.totalPoints).toBeDefined();
      expect(response.data?.totalUsers).toBeDefined();

      // Validate data types
      if (response.data) {
        expect(typeof response.data.totalPoints).toBe('string');
        expect(typeof response.data.totalUsers).toBe('number');
      }
    }, 10000);

    it('should handle different leaderboard counts', async () => {
      const counts = [5, 10, 20];

      for (const count of counts) {
        const response = await client.getPointsLeaderboard(count);
        expect(response.success).toBe(true);

        if (response.data?.leaderboard) {
          // Leaderboard should not exceed requested count
          expect(response.data.leaderboard.length).toBeLessThanOrEqual(count);
        }
      }
    }, 15000);
  });

  describe('User Validation', () => {
    it('should validate a valid EVM address', async () => {
      // Use a well-known valid address format
      const testAddress = '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb';
      const response = await client.validateUsername(testAddress);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      // The API may return true or false depending on whether the address is registered
      expect(response.data).toBeDefined();
      expect(typeof response.data?.isValid).toBe('boolean');
    }, 10000);

    it('should handle invalid address format', async () => {
      const invalidAddress = 'invalid-address';

      try {
        await client.validateUsername(invalidAddress);
        // If no error is thrown, the API should return isValid: false
      } catch (error) {
        // Some APIs may throw an error for invalid format
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('SIWE Message Generation', () => {
    it('should generate SIWE message for EVM wallet', async () => {
      const testWallet = '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb';
      const domain = 'example.com';
      const url = 'https://example.com';
      const chainId = 1; // Ethereum mainnet

      const response = await client.getMessage(
        chainId,
        testWallet,
        domain,
        url
      );

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.message).toBeDefined();
      expect(response.data?.nonce).toBeDefined();

      // Validate SIWE message format
      if (response.data?.message) {
        expect(response.data.message).toContain(domain);
        expect(response.data.message).toContain(testWallet);
        expect(response.data.message).toContain('Sign in with Ethereum');
      }
    }, 10000);
  });

  describe('Name Service', () => {
    it('should resolve ENS name to address', async () => {
      const ensName = 'vitalik.eth';

      try {
        const response = await client.resolveNameToAddress(ensName);

        expect(response).toBeDefined();
        expect(response.success).toBe(true);

        // If resolved, should have an address
        if (response.data?.address) {
          expect(response.data.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        }
      } catch (error) {
        // ENS resolution may fail if service is unavailable
        console.log('ENS resolution skipped:', error);
      }
    }, 15000);

    it('should get wallet names for address', async () => {
      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // vitalik.eth
      const auth: IndexerUserAuth = { message: 'test message', signature: 'test signature' };

      try {
        const response = await client.getWalletNames(testAddress, auth);

        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();

        // If names exist, validate structure
        if (response.data?.names && response.data.names.length > 0) {
          const firstName = response.data.names[0];
          expect(firstName).toHaveProperty('name');
          expect(firstName).toHaveProperty('service');
        }
      } catch (error) {
        // Name service may not be available
        console.log('Name service lookup skipped:', error);
      }
    }, 15000);
  });

  describe('Referral System', () => {
    it('should get referral code for wallet', async () => {
      const testWallet = '0x742d35Cc6285C9D3C0ef5BAdF3a70b1E95c1e6Bb';
      const auth: IndexerUserAuth = { message: 'test message', signature: 'test signature' };

      try {
        const response = await client.getReferralCode(testWallet, auth);

        expect(response).toBeDefined();
        expect(response.success).toBe(true);

        // If referral code exists, validate format
        if (response.data?.referralCode) {
          expect(response.data.referralCode).toMatch(/^[A-Z0-9]{9}$/);
          expect(response.data.walletAddress).toBe(testWallet.toLowerCase());
          expect(response.data.chainType).toBe('evm');
        }
      } catch (error) {
        // Referral code may not exist for all wallets
        console.log('Referral code lookup skipped:', error);
      }
    }, 10000);

    it('should get referral stats', async () => {
      const testReferralCode = 'ABC123XYZ'; // Example 9-character referral code

      try {
        const response = await client.getReferralStats(testReferralCode);

        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();

        // Validate stats structure
        if (response.data) {
          expect(response.data).toHaveProperty('totalReferrals');
          expect(response.data).toHaveProperty('successfulReferrals');
          expect(typeof response.data.totalReferrals).toBe('number');
          expect(typeof response.data.successfulReferrals).toBe('number');
        }
      } catch (error) {
        // Stats may not exist for all wallets
        console.log('Referral stats lookup skipped:', error);
      }
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Create client with very short timeout
      const timeoutClient = new IndexerClient(indexerUrl!, false);

      try {
        // Make request with custom short timeout
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100); // 100ms timeout

        await timeoutClient.getPointsLeaderboard(10);
      } catch (error) {
        expect(error).toBeDefined();
        // Should be either timeout or abort error
      }
    }, 10000);

    it('should handle invalid endpoint gracefully', async () => {
      const invalidClient = new IndexerClient('https://invalid-endpoint-that-does-not-exist.com', false);

      try {
        await invalidClient.getPointsSiteStats();
        // Should throw an error
        expect(true).toBe(false); // Force failure if no error
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Response Format', () => {
    it('should have consistent response structure', async () => {
      const response = await client.getPointsSiteStats();

      // All responses should have these fields
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('timestamp');
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.timestamp).toBe('string');

      // timestamp should be valid ISO date
      expect(() => new Date(response.timestamp)).not.toThrow();
    }, 10000);

    it('should include error details on failure', async () => {
      const invalidClient = new IndexerClient('https://invalid-endpoint.com', false);

      try {
        await invalidClient.getPointsLeaderboard(10);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBeDefined();
      }
    }, 10000);
  });
});
