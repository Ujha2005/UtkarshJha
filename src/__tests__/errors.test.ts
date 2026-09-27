import { describe, it, expect } from 'vitest';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  NetworkError,
} from '@/services/api/errors';

describe('CAREGRAPH API Error Architecture', () => {
  it('creates an ApiError with standard status and errorCode', () => {
    const err = new ApiError(400, 'VALIDATION_FAILED', 'Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('VALIDATION_FAILED');
    expect(err.message).toBe('Invalid input');
    expect(err.timestamp).toBeDefined();
    expect(err.toJSON()).toHaveProperty('timestamp');
  });

  it('instantiates UnauthorizedError (401)', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('UNAUTHORIZED');
    expect(err.name).toBe('UnauthorizedError');
  });

  it('instantiates ForbiddenError (403)', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe('FORBIDDEN');
    expect(err.name).toBe('ForbiddenError');
  });

  it('instantiates NotFoundError (404) with resource details', () => {
    const err = new NotFoundError('Patient', 'p999');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toContain('p999');
  });

  it('instantiates ConflictError (409)', () => {
    const err = new ConflictError('Concurrent medication conflict');
    expect(err.statusCode).toBe(409);
    expect(err.errorCode).toBe('CONFLICT');
  });

  it('instantiates ValidationError (422) with field details', () => {
    const err = new ValidationError('Payload invalid', [{ field: 'dose', message: 'Required' }]);
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe('VALIDATION_FAILED');
    expect(err.details).toHaveLength(1);
    expect(err.details?.[0].field).toBe('dose');
  });

  it('instantiates RateLimitError (429)', () => {
    const err = new RateLimitError(30);
    expect(err.statusCode).toBe(429);
    expect(err.errorCode).toBe('RATE_LIMITED');
    expect(err.message).toContain('30 seconds');
  });

  it('instantiates InternalServerError (500)', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.errorCode).toBe('INTERNAL_SERVER_ERROR');
  });

  it('instantiates NetworkError (0)', () => {
    const err = new NetworkError();
    expect(err.statusCode).toBe(0);
    expect(err.errorCode).toBe('NETWORK_ERROR');
  });
});
