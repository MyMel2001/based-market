// Custom error classes for ActivityPub service

export enum ActivityPubErrorType {
  CACHE_MISS = 'CACHE_MISS',
  SQLITE_ERROR = 'SQLITE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ACTOR_NOT_FOUND = 'ACTOR_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export class ActivityPubError extends Error {
  constructor(
    public type: ActivityPubErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(`[${type}] ${message}`);
    this.name = 'ActivityPubError';
  }
}

export class SQLiteError extends ActivityPubError {
  constructor(message: string, originalError?: Error) {
    super(ActivityPubErrorType.SQLITE_ERROR, message, originalError);
  }
}

export class CacheMissError extends ActivityPubError {
  constructor(message: string, originalError?: Error) {
    super(ActivityPubErrorType.CACHE_MISS, message, originalError);
  }
}

// Example usage:
// throw new ActivityPubError(
//   ActivityPubErrorType.SQLITE_ERROR,
//   'Failed to query SQLite',
//   error
// );