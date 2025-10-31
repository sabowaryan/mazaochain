/**
 * API Error Response Utilities
 * Provides standardized error responses for API routes
 * Requirement 9.2: Structured error responses with codes
 */

import { NextResponse } from 'next/server';
import { ErrorCode, ErrorSeverity } from './types';
import { MazaoChainError } from './MazaoChainError';
import { logger } from './logger';

export interface APIErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    severity: ErrorSeverity;
    timestamp: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

export interface APISuccessResponse<T = unknown> {
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  requestId?: string
): NextResponse<APIErrorResponse> {
  // Convert to MazaoChainError if needed
  const mazaoError = error instanceof MazaoChainError
    ? error
    : MazaoChainError.fromUnknown(error);
  
  // Log the error
  logger.error('API Error', mazaoError, {
    timestamp: new Date(),
    additionalData: { statusCode, requestId }
  });
  
  const response: APIErrorResponse = {
    error: {
      code: mazaoError.code,
      message: mazaoError.message,
      userMessage: mazaoError.userMessage,
      severity: mazaoError.severity,
      timestamp: new Date().toISOString(),
      requestId,
      // Only include details in development
      details: process.env.NODE_ENV === 'development' ? {
        stack: mazaoError.stack,
        originalError: mazaoError.originalError?.message,
      } : undefined,
    },
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<APISuccessResponse<T>> {
  const response: APISuccessResponse<T> = {
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Map HTTP status codes to error codes
 */
export function getErrorCodeFromStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.VALIDATION_ERROR;
    case 408:
      return ErrorCode.TRANSACTION_TIMEOUT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 502:
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case 504:
      return ErrorCode.TRANSACTION_TIMEOUT;
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Map error codes to HTTP status codes
 */
export function getStatusCodeFromError(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_TOKEN:
    case ErrorCode.SESSION_EXPIRED:
      return 401;
    
    case ErrorCode.FORBIDDEN:
      return 403;
    
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_FORMAT:
    case ErrorCode.INVALID_LOAN_AMOUNT:
      return 400;
    
    case ErrorCode.INSUFFICIENT_COLLATERAL:
    case ErrorCode.LOAN_NOT_ELIGIBLE:
      return 422;
    
    case ErrorCode.TRANSACTION_TIMEOUT:
      return 408;
    
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 503;
    
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    default:
      return 500;
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>,
  requestId?: string
): NextResponse<APIErrorResponse> {
  const mazaoError = new MazaoChainError(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    {
      severity: ErrorSeverity.LOW,
      userMessage: 'Veuillez corriger les erreurs dans le formulaire',
      context: {
        timestamp: new Date(),
        additionalData: { validationErrors: errors }
      }
    }
  );
  
  return createErrorResponse(mazaoError, 400, requestId);
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(
  message: string = 'Authentication required',
  requestId?: string
): NextResponse<APIErrorResponse> {
  const mazaoError = new MazaoChainError(
    ErrorCode.UNAUTHORIZED,
    message,
    {
      severity: ErrorSeverity.HIGH,
      userMessage: 'Vous devez vous connecter pour accéder à cette fonctionnalité',
    }
  );
  
  return createErrorResponse(mazaoError, 401, requestId);
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(
  message: string = 'Access denied',
  requestId?: string
): NextResponse<APIErrorResponse> {
  const mazaoError = new MazaoChainError(
    ErrorCode.FORBIDDEN,
    message,
    {
      severity: ErrorSeverity.HIGH,
      userMessage: 'Vous n\'avez pas les permissions nécessaires pour cette action',
    }
  );
  
  return createErrorResponse(mazaoError, 403, requestId);
}

/**
 * Create database error response
 */
export function createDatabaseErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<APIErrorResponse> {
  // Log the actual error for debugging
  console.error('Database error details:', error);
  
  const errorMessage = error instanceof Error ? error.message : 'Database operation failed';
  const mazaoError = new MazaoChainError(
    ErrorCode.DATABASE_ERROR,
    errorMessage,
    {
      severity: ErrorSeverity.CRITICAL,
      userMessage: 'Erreur de base de données. Veuillez réessayer',
      originalError: error instanceof Error ? error : undefined,
      retryable: true,
    }
  );
  
  return createErrorResponse(mazaoError, 500, requestId);
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling<T = unknown>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | APIErrorResponse>> {
  return handler().catch((error) => {
    return createErrorResponse(error);
  });
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
