import type { IndexerUserAuth } from '../types';
import {
  IndexerAuthError,
  IndexerError,
  IndexerRateLimitError,
  IndexerServerError,
  IndexerValidationError,
} from '../errors';

/**
 * Helper method to create authentication headers for signature-protected endpoints.
 * Encodes the message using `encodeURIComponent` for safe HTTP header transmission.
 *
 * @param auth - Wallet-signed authentication credentials
 * @param dev - When `true`, adds `x-dev: true` header to bypass certain server checks
 * @param additionalHeaders - Extra headers to merge (e.g., `x-referral`)
 * @returns Record of HTTP headers including `x-signature`, `x-message`, and `x-signer`
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
 * Helper method to create standard request headers for public endpoints.
 *
 * @param dev - When `true`, adds `x-dev: true` header to bypass certain server checks
 * @param additionalHeaders - Extra headers to merge
 * @returns Record of HTTP headers with `Content-Type` and `Accept` set to `application/json`
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
 * Helper method to build a full URL by concatenating the base endpoint and a path.
 *
 * @param endpoint - Base URL of the indexer API (e.g., `https://indexer.example.com`)
 * @param path - API path (e.g., `/points/leaderboard/10`)
 * @returns The concatenated URL string
 */
export function buildUrl(endpoint: string, path: string): string {
  return `${endpoint}${path}`;
}

/**
 * Creates a typed error from an API response.
 *
 * Maps HTTP status codes to the appropriate error subclass:
 * - 401, 403 -> {@link IndexerAuthError}
 * - 400, 422 -> {@link IndexerValidationError}
 * - 429 -> {@link IndexerRateLimitError}
 * - 500+ -> {@link IndexerServerError}
 * - Other / unknown -> {@link IndexerError}
 *
 * @param response - The raw network response object (with `status`, `data`, etc.)
 * @param operation - A human-readable description of the failed operation (e.g., `'validate username'`)
 * @returns A typed `IndexerError` subclass instance
 */
export function handleApiError(response: any, operation: string): IndexerError {
  const errorMessage =
    response?.data?.error || response?.data?.message || 'Unknown error';
  const statusCode: number | undefined = response?.status as number | undefined;
  const fullMessage = `Failed to ${operation}: ${errorMessage}`;

  if (statusCode === 401 || statusCode === 403) {
    return new IndexerAuthError(fullMessage, operation, statusCode);
  }

  if (statusCode === 400 || statusCode === 422) {
    return new IndexerValidationError(fullMessage, operation, statusCode);
  }

  if (statusCode === 429) {
    const retryAfter =
      typeof response?.headers?.['retry-after'] === 'string'
        ? parseInt(response.headers['retry-after'], 10)
        : undefined;
    return new IndexerRateLimitError(
      fullMessage,
      operation,
      Number.isNaN(retryAfter) ? undefined : retryAfter
    );
  }

  if (statusCode !== undefined && statusCode >= 500) {
    return new IndexerServerError(fullMessage, operation, statusCode);
  }

  return new IndexerError(fullMessage, operation, statusCode);
}
