/**
 * Comprehensive error handling system for MazaoChain
 * Exports all error handling utilities, types, and components
 */

// Core error types and classes
export * from './types';
export { MazaoChainError } from './MazaoChainError';

// Error handling utilities
export { ErrorHandler, errorUtils } from './handler';
export { logger, Logger, LogLevel } from './logger';

// Retry mechanisms
export { RetryManager, withRetry, retryUtils } from './retry';

// Validation system
export * from '../validation/validators';

// Blockchain-specific error handling
export { BlockchainErrorHandler } from '../blockchain/error-handler';

// Import for internal use
import { errorUtils } from './handler';

// Utility functions for common error scenarios
export const createError = {
  validation: (message: string, field?: string) => errorUtils.validation(message, field),
  unauthorized: (message?: string) => errorUtils.unauthorized(message),
  wallet: (message: string) => errorUtils.wallet(message),
  insufficientCollateral: (required: number, available: number) => 
    errorUtils.insufficientCollateral(required, available),
};

// Error handling hooks and utilities
export { useErrorHandler } from '../../components/errors/ErrorBoundary';