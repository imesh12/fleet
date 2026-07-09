export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(options: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: unknown) {
    super({ message, code: 'AUTHENTICATION_FAILED', statusCode: 401, details });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details?: unknown) {
    super({ message, code: 'FORBIDDEN', statusCode: 403, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super({ message, code: 'NOT_FOUND', statusCode: 404, details });
  }
}

export class ValidationAppError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super({ message, code: 'VALIDATION_FAILED', statusCode: 400, details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super({ message, code: 'CONFLICT', statusCode: 409, details });
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super({ message, code: 'BAD_REQUEST', statusCode: 400, details });
  }
}
