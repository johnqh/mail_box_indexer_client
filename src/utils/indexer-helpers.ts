import type { IndexerUserAuth } from '../types';

/**
 * Helper method to create authentication headers for signature-protected endpoints
 * Encodes the message using encodeURIComponent for HTTP header transmission
 */
export function createAuthHeaders(
  auth: IndexerUserAuth,
  dev: boolean = false,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-signature': auth.signature.replace(/[\r\n]/g, ''), // Remove any newlines from signature
    'x-message': encodeURIComponent(auth.message), // Encode message for HTTP header
    'x-signer': auth.signer, // Wallet address that signed the message
    ...(dev && { 'x-dev': 'true' }),
    ...additionalHeaders,
  };
}

/**
 * Helper method to create standard request headers
 */
export function createHeaders(
  dev: boolean = false,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(dev && { 'x-dev': 'true' }),
    ...additionalHeaders,
  };
}

/**
 * Helper method to build full URL from endpoint and path
 */
export function buildUrl(endpoint: string, path: string): string {
  return `${endpoint}${path}`;
}

/**
 * Helper method to handle API errors
 */
export function handleApiError(response: any, operation: string): Error {
  const errorMessage =
    response?.data?.error || response?.data?.message || 'Unknown error';
  console.error(`[IndexerAPI] ${operation} failed:`, errorMessage);
  return new Error(`Failed to ${operation}: ${errorMessage}`);
}
