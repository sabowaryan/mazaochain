import { MazaoChainError } from './MazaoChainError';
import { ErrorCode, ErrorSeverity, ErrorContext } from './types';
import { logger } from './logger';

/**
 * Centralized error handling utilities
 * Provides consistent error processing across the application
 */

export interface ErrorHandlerOptions {
  logError?: boolean;
  notifyUser?: boolean;
  context?: ErrorContext;
  fallbackMessage?: string;
}

export class ErrorHandler {
  /**
   * Handle and process errors consistently
   */
  static handle(
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): MazaoChainError {
    const {
      logError = true,
      context,
      fallbackMessage = 'Une erreur inattendue s\'est produite'
    } = options;

    // Convert to MazaoChainError if needed
    const mazaoError = error instanceof MazaoChainError
      ? error
      : this.convertToMazaoError(error, context);

    // Log the error
    if (logError) {
      logger.error('Error handled by ErrorHandler', mazaoError, context);
    }

    return mazaoError;
  }

  /**
   * Convert unknown error to MazaoChainError
   */
  private static convertToMazaoError(error: unknown, context?: ErrorContext): MazaoChainError {
    if (error instanceof Error) {
      // Map common error types to specific codes
      const code = this.mapErrorToCode(error);
      
      return new MazaoChainError(code, error.message, {
        originalError: error,
        context,
        severity: this.getSeverityForCode(code),
        retryable: this.isRetryableError(code),
      });
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new MazaoChainError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error,
        { context, severity: ErrorSeverity.MEDIUM }
      );
    }

    // Handle unknown error types
    return new MazaoChainError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Unknown error occurred',
      { 
        context, 
        severity: ErrorSeverity.HIGH,
        originalError: new Error(String(error))
      }
    );
  }

  /**
   * Map common error types to specific error codes
   */
  private static mapErrorToCode(error: Error): ErrorCode {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ErrorCode.UNAUTHORIZED;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }

    // Database errors
    if (message.includes('database') || message.includes('sql')) {
      return ErrorCode.DATABASE_ERROR;
    }

    // Wallet errors
    if (message.includes('wallet') || message.includes('hashpack')) {
      return ErrorCode.WALLET_CONNECTION_FAILED;
    }

    // Transaction errors
    if (message.includes('transaction') || message.includes('hedera')) {
      return ErrorCode.TRANSACTION_FAILED;
    }

    // File errors
    if (message.includes('file') || message.includes('upload')) {
      return ErrorCode.FILE_UPLOAD_FAILED;
    }

    // Default to internal server error
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get severity for error code
   */
  private static getSeverityForCode(code: ErrorCode): ErrorSeverity {
    const criticalErrors = [
      ErrorCode.DATABASE_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
    ];

    const highErrors = [
      ErrorCode.TRANSACTION_FAILED,
      ErrorCode.WALLET_CONNECTION_FAILED,
      ErrorCode.UNAUTHORIZED,
    ];

    const mediumErrors = [
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.INSUFFICIENT_COLLATERAL,
      ErrorCode.NETWORK_ERROR,
    ];

    if (criticalErrors.includes(code)) return ErrorSeverity.CRITICAL;
    if (highErrors.includes(code)) return ErrorSeverity.HIGH;
    if (mediumErrors.includes(code)) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(code: ErrorCode): boolean {
    const retryableErrors = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TRANSACTION_TIMEOUT,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.DATABASE_ERROR,
    ];

    return retryableErrors.includes(code);
  }

  /**
   * Handle async operations with error catching
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<{ success: true; data: T } | { success: false; error: MazaoChainError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const mazaoError = this.handle(error, options);
      return { success: false, error: mazaoError };
    }
  }

  /**
   * Handle sync operations with error catching
   */
  static handleSync<T>(
    operation: () => T,
    options: ErrorHandlerOptions = {}
  ): { success: true; data: T } | { success: false; error: MazaoChainError } {
    try {
      const data = operation();
      return { success: true, data };
    } catch (error) {
      const mazaoError = this.handle(error, options);
      return { success: false, error: mazaoError };
    }
  }

  /**
   * Create error context from request/environment
   */
  static createContext(options: {
    userId?: string;
    transactionId?: string;
    loanId?: string;
    evaluationId?: string;
    walletAddress?: string;
    url?: string;
    userAgent?: string;
    additionalData?: Record<string, any>;
  }): ErrorContext {
    return {
      ...options,
      timestamp: new Date(),
    };
  }

  /**
   * Handle form validation errors
   */
  static handleValidationErrors(errors: unknown[]): MazaoChainError {
    const messages = errors.map((error: unknown) => error.message).join(', ');
    
    return new MazaoChainError(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed: ${messages}`,
      {
        severity: ErrorSeverity.LOW,
        userMessage: 'Veuillez corriger les erreurs dans le formulaire',
      }
    );
  }

  /**
   * Handle blockchain transaction errors
   */
  static handleTransactionError(
    error: unknown,
    transactionId?: string,
    walletAddress?: string
  ): MazaoChainError {
    const context = this.createContext({
      transactionId,
      walletAddress,
      additionalData: { errorType: 'blockchain_transaction' }
    });

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('insufficient')) {
        return new MazaoChainError(
          ErrorCode.INSUFFICIENT_BALANCE,
          'Insufficient balance for transaction',
          {
            context,
            severity: ErrorSeverity.MEDIUM,
            retryable: false,
            userMessage: 'Solde insuffisant pour cette transaction'
          }
        );
      }

      if (message.includes('timeout')) {
        return new MazaoChainError(
          ErrorCode.TRANSACTION_TIMEOUT,
          'Transaction timed out',
          {
            context,
            severity: ErrorSeverity.MEDIUM,
            retryable: true,
            userMessage: 'La transaction a pris trop de temps. Veuillez réessayer.'
          }
        );
      }
    }

    return new MazaoChainError(
      ErrorCode.TRANSACTION_FAILED,
      'Transaction failed',
      {
        context,
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: 'La transaction a échoué. Veuillez réessayer.',
        originalError: error instanceof Error ? error : new Error(String(error))
      }
    );
  }

  /**
   * Handle API errors
   */
  static handleAPIError(
    error: unknown,
    endpoint: string,
    method: string = 'GET'
  ): MazaoChainError {
    const context = this.createContext({
      url: endpoint,
      additionalData: { method, errorType: 'api_call' }
    });

    if (error instanceof Error && error.message.includes('fetch')) {
      return new MazaoChainError(
        ErrorCode.NETWORK_ERROR,
        `Network error calling ${endpoint}`,
        {
          context,
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          userMessage: 'Erreur de réseau. Vérifiez votre connexion.',
          originalError: error
        }
      );
    }

    return this.handle(error, { context });
  }
}

/**
 * Utility functions for common error scenarios
 */
export const errorUtils = {
  /**
   * Create validation error
   */
  validation: (message: string, field?: string): MazaoChainError => {
    return new MazaoChainError(ErrorCode.VALIDATION_ERROR, message, {
      severity: ErrorSeverity.LOW,
      userMessage: message,
      context: field ? { timestamp: new Date(), additionalData: { field } } : undefined
    });
  },

  /**
   * Create unauthorized error
   */
  unauthorized: (message: string = 'Unauthorized access'): MazaoChainError => {
    return new MazaoChainError(ErrorCode.UNAUTHORIZED, message, {
      severity: ErrorSeverity.HIGH,
      userMessage: 'Vous devez vous connecter pour accéder à cette fonctionnalité.'
    });
  },

  /**
   * Create wallet error
   */
  wallet: (message: string): MazaoChainError => {
    return new MazaoChainError(ErrorCode.WALLET_NOT_CONNECTED, message, {
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Veuillez connecter votre portefeuille HashPack.'
    });
  },

  /**
   * Create insufficient collateral error
   */
  insufficientCollateral: (required: number, available: number): MazaoChainError => {
    return new MazaoChainError(
      ErrorCode.INSUFFICIENT_COLLATERAL,
      `Insufficient collateral: required ${required}, available ${available}`,
      {
        severity: ErrorSeverity.MEDIUM,
        userMessage: `Garantie insuffisante. Requis: ${required}, Disponible: ${available}`,
        context: {
          timestamp: new Date(),
          additionalData: { required, available }
        }
      }
    );
  }
};