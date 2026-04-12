/**
 * Tests for the IndexerError type hierarchy and handleApiError mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  IndexerError,
  IndexerAuthError,
  IndexerNetworkError,
  IndexerValidationError,
  IndexerRateLimitError,
  IndexerServerError,
} from '../errors';
import { handleApiError } from '../utils/indexer-helpers';

describe('IndexerError classes', () => {
  it('IndexerError should extend Error', () => {
    const err = new IndexerError('test', 'op', 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(IndexerError);
    expect(err.name).toBe('IndexerError');
    expect(err.message).toBe('test');
    expect(err.operation).toBe('op');
    expect(err.statusCode).toBe(500);
  });

  it('IndexerAuthError should extend IndexerError', () => {
    const err = new IndexerAuthError('auth failed', 'get accounts', 401);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).toBeInstanceOf(IndexerAuthError);
    expect(err.name).toBe('IndexerAuthError');
    expect(err.statusCode).toBe(401);
  });

  it('IndexerNetworkError should extend IndexerError', () => {
    const err = new IndexerNetworkError(
      'connection refused',
      'get leaderboard'
    );
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).toBeInstanceOf(IndexerNetworkError);
    expect(err.name).toBe('IndexerNetworkError');
    expect(err.statusCode).toBeUndefined();
  });

  it('IndexerValidationError should extend IndexerError', () => {
    const err = new IndexerValidationError(
      'bad input',
      'validate username',
      400
    );
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).toBeInstanceOf(IndexerValidationError);
    expect(err.name).toBe('IndexerValidationError');
    expect(err.statusCode).toBe(400);
  });

  it('IndexerRateLimitError should extend IndexerError with retryAfter', () => {
    const err = new IndexerRateLimitError(
      'too many requests',
      'get leaderboard',
      30
    );
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).toBeInstanceOf(IndexerRateLimitError);
    expect(err.name).toBe('IndexerRateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);
  });

  it('IndexerRateLimitError without retryAfter', () => {
    const err = new IndexerRateLimitError('too many requests', 'op');
    expect(err.retryAfter).toBeUndefined();
    expect(err.statusCode).toBe(429);
  });

  it('IndexerServerError should extend IndexerError', () => {
    const err = new IndexerServerError('internal error', 'get stats', 503);
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).toBeInstanceOf(IndexerServerError);
    expect(err.name).toBe('IndexerServerError');
    expect(err.statusCode).toBe(503);
  });
});

describe('handleApiError', () => {
  it('should return IndexerAuthError for 401', () => {
    const err = handleApiError(
      { status: 401, data: { error: 'Signature expired' } },
      'get accounts'
    );
    expect(err).toBeInstanceOf(IndexerAuthError);
    expect(err.message).toContain('Failed to get accounts');
    expect(err.message).toContain('Signature expired');
    expect(err.statusCode).toBe(401);
  });

  it('should return IndexerAuthError for 403', () => {
    const err = handleApiError(
      { status: 403, data: { error: 'Forbidden' } },
      'get delegation'
    );
    expect(err).toBeInstanceOf(IndexerAuthError);
    expect(err.statusCode).toBe(403);
  });

  it('should return IndexerValidationError for 400', () => {
    const err = handleApiError(
      { status: 400, data: { error: 'Invalid address format' } },
      'validate username'
    );
    expect(err).toBeInstanceOf(IndexerValidationError);
    expect(err.statusCode).toBe(400);
  });

  it('should return IndexerValidationError for 422', () => {
    const err = handleApiError(
      { status: 422, data: { error: 'Missing required field' } },
      'create template'
    );
    expect(err).toBeInstanceOf(IndexerValidationError);
    expect(err.statusCode).toBe(422);
  });

  it('should return IndexerRateLimitError for 429', () => {
    const err = handleApiError(
      {
        status: 429,
        data: { error: 'Rate limited' },
        headers: { 'retry-after': '60' },
      },
      'get leaderboard'
    );
    expect(err).toBeInstanceOf(IndexerRateLimitError);
    expect(err.statusCode).toBe(429);
    expect((err as IndexerRateLimitError).retryAfter).toBe(60);
  });

  it('should return IndexerRateLimitError without retryAfter when header missing', () => {
    const err = handleApiError(
      { status: 429, data: { error: 'Rate limited' } },
      'get leaderboard'
    );
    expect(err).toBeInstanceOf(IndexerRateLimitError);
    expect((err as IndexerRateLimitError).retryAfter).toBeUndefined();
  });

  it('should return IndexerServerError for 500', () => {
    const err = handleApiError(
      { status: 500, data: { error: 'Internal server error' } },
      'get stats'
    );
    expect(err).toBeInstanceOf(IndexerServerError);
    expect(err.statusCode).toBe(500);
  });

  it('should return IndexerServerError for 503', () => {
    const err = handleApiError(
      { status: 503, data: { message: 'Service unavailable' } },
      'get stats'
    );
    expect(err).toBeInstanceOf(IndexerServerError);
    expect(err.statusCode).toBe(503);
  });

  it('should return generic IndexerError for unknown status codes', () => {
    const err = handleApiError(
      { status: 304, data: { error: 'Not modified' } },
      'get data'
    );
    expect(err).toBeInstanceOf(IndexerError);
    expect(err).not.toBeInstanceOf(IndexerAuthError);
    expect(err).not.toBeInstanceOf(IndexerValidationError);
    expect(err).not.toBeInstanceOf(IndexerServerError);
  });

  it('should return generic IndexerError when no status code', () => {
    const err = handleApiError({ data: { error: 'Unknown' } }, 'do something');
    expect(err).toBeInstanceOf(IndexerError);
    expect(err.statusCode).toBeUndefined();
  });

  it('should use data.message fallback when data.error is missing', () => {
    const err = handleApiError(
      { status: 400, data: { message: 'Bad request detail' } },
      'validate'
    );
    expect(err.message).toContain('Bad request detail');
  });

  it('should use "Unknown error" when no error/message in data', () => {
    const err = handleApiError({ status: 500, data: {} }, 'get data');
    expect(err.message).toContain('Unknown error');
  });
});
