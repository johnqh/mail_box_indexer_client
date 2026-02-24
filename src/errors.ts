/**
 * Error type hierarchy for the indexer client library.
 *
 * Provides typed error classes so consumers can distinguish between different
 * failure modes and handle them appropriately (e.g., retry on network errors,
 * re-authenticate on auth errors, show validation messages on validation errors).
 */

/**
 * Base error class for all indexer client errors.
 * Extends the native `Error` with an `operation` field indicating which API call failed
 * and an optional `statusCode` from the HTTP response.
 *
 * @example
 * ```typescript
 * try {
 *   await client.getPointsLeaderboard();
 * } catch (err) {
 *   if (err instanceof IndexerError) {
 *     console.log(err.operation); // 'get points leaderboard'
 *     console.log(err.statusCode); // 500
 *   }
 * }
 * ```
 */
export class IndexerError extends Error {
  /** The API operation that failed (e.g., 'validate username', 'get wallet accounts') */
  public readonly operation: string;
  /** HTTP status code from the response, if available */
  public readonly statusCode: number | undefined;

  constructor(message: string, operation: string, statusCode?: number) {
    super(message);
    this.name = 'IndexerError';
    this.operation = operation;
    this.statusCode = statusCode;
  }
}

/**
 * Thrown when authentication fails -- expired signature, invalid signer, or missing auth headers.
 * HTTP status codes: 401, 403.
 *
 * Consumers should prompt the user to re-sign and retry.
 *
 * @example
 * ```typescript
 * try {
 *   await client.getWalletAccounts(walletAddress, auth);
 * } catch (err) {
 *   if (err instanceof IndexerAuthError) {
 *     // Prompt user to re-sign
 *     await requestNewSignature();
 *   }
 * }
 * ```
 */
export class IndexerAuthError extends IndexerError {
  constructor(message: string, operation: string, statusCode?: number) {
    super(message, operation, statusCode);
    this.name = 'IndexerAuthError';
  }
}

/**
 * Thrown when a network-level error occurs -- server unreachable, timeout, connection refused.
 * No HTTP status code is available because the request never reached the server.
 *
 * Consumers may retry with exponential backoff.
 *
 * @example
 * ```typescript
 * try {
 *   await client.getPointsLeaderboard();
 * } catch (err) {
 *   if (err instanceof IndexerNetworkError) {
 *     // Show offline banner, queue for retry
 *   }
 * }
 * ```
 */
export class IndexerNetworkError extends IndexerError {
  constructor(message: string, operation: string) {
    super(message, operation);
    this.name = 'IndexerNetworkError';
  }
}

/**
 * Thrown when the server rejects the request due to invalid input -- bad parameters,
 * malformed request body, or constraint violations.
 * HTTP status codes: 400, 422.
 *
 * Consumers should display validation feedback to the user.
 *
 * @example
 * ```typescript
 * try {
 *   await client.validateUsername('');
 * } catch (err) {
 *   if (err instanceof IndexerValidationError) {
 *     // Show form validation error
 *     setFieldError('username', err.message);
 *   }
 * }
 * ```
 */
export class IndexerValidationError extends IndexerError {
  constructor(message: string, operation: string, statusCode?: number) {
    super(message, operation, statusCode);
    this.name = 'IndexerValidationError';
  }
}

/**
 * Thrown when the server returns a rate limit response (HTTP 429).
 * Includes a `retryAfter` hint (in seconds) when the server provides one.
 *
 * Consumers should back off and retry after the suggested delay.
 *
 * @example
 * ```typescript
 * try {
 *   await client.getPointsLeaderboard();
 * } catch (err) {
 *   if (err instanceof IndexerRateLimitError) {
 *     // Wait and retry
 *     await delay((err.retryAfter ?? 60) * 1000);
 *     await client.getPointsLeaderboard();
 *   }
 * }
 * ```
 */
export class IndexerRateLimitError extends IndexerError {
  /** Suggested retry delay in seconds, from the `Retry-After` header or response body */
  public readonly retryAfter: number | undefined;

  constructor(message: string, operation: string, retryAfter?: number) {
    super(message, operation, 429);
    this.name = 'IndexerRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when the server returns an unexpected error (HTTP 500, 502, 503, etc.).
 *
 * @example
 * ```typescript
 * try {
 *   await client.getPointsLeaderboard();
 * } catch (err) {
 *   if (err instanceof IndexerServerError) {
 *     // Log for monitoring, show generic error to user
 *   }
 * }
 * ```
 */
export class IndexerServerError extends IndexerError {
  constructor(message: string, operation: string, statusCode?: number) {
    super(message, operation, statusCode);
    this.name = 'IndexerServerError';
  }
}
