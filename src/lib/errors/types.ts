/**
 * Comprehensive error types for MazaoChain platform
 * Covers all error scenarios from requirements 2.5, 4.5, 9.1, 9.2
 */

export enum ErrorCode {
  // Authentication & Authorization Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Wallet & Blockchain Errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Business Logic Errors
  INSUFFICIENT_COLLATERAL = 'INSUFFICIENT_COLLATERAL',
  EVALUATION_PENDING = 'EVALUATION_PENDING',
  LOAN_NOT_ELIGIBLE = 'LOAN_NOT_ELIGIBLE',
  INVALID_LOAN_AMOUNT = 'INVALID_LOAN_AMOUNT',
  REPAYMENT_FAILED = 'REPAYMENT_FAILED',
  
  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // File & Upload Errors
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  transactionId?: string;
  loanId?: string;
  evaluationId?: string;
  walletAddress?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface MazaoChainError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  originalError?: Error;
  retryable: boolean;
  userMessage: string; // User-friendly message in appropriate language
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}