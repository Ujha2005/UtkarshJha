// Typed API Error Model for CAREGRAPH Backend Boundary
// Provides structured, consistent error objects without leaking server-side stack traces or secrets.

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'BREAK_GLASS_UNAUTHORIZED';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ApiErrorCode;
  public readonly details?: ApiErrorDetail[];
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    errorCode: ApiErrorCode,
    message: string,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public toJSON() {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required. Valid credentials or session token missing.') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied. You do not have permission to access this resource or patient record.') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', id?: string) {
    const msg = id ? `${resource} with ID "${id}" was not found.` : `${resource} was not found.`;
    super(404, 'NOT_FOUND', msg);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'A conflict occurred with existing clinical data or document state.') {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed for the submitted medical record payload.', details?: ApiErrorDetail[]) {
    super(422, 'VALIDATION_FAILED', message, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfterSeconds = 60) {
    super(429, 'RATE_LIMITED', `Too many requests. Please wait ${retryAfterSeconds} seconds before retrying.`, [
      { field: 'Retry-After', message: `${retryAfterSeconds}s` },
    ]);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'An unexpected server error occurred. Please contact system support.') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
    this.name = 'InternalServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Failed to communicate with healthcare backend. Please check network connectivity.') {
    super(0, 'NETWORK_ERROR', message);
    this.name = 'NetworkError';
  }
}
