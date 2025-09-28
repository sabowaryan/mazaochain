import { ErrorCode, RetryConfig } from './types';
import { MazaoChainError } from './MazaoChainError';
import { logger } from './logger';

/**
 * Retry mechanism for blockchain operations and external service calls
 * Implements exponential backoff with jitter
 */

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TRANSACTION_TIMEOUT,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.DATABASE_ERROR,
  ]
};

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = customConfig ? { ...this.config, ...customConfig } : this.config;
    let lastError: MazaoChainError | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        logger.debug(`Executing ${operationName} - Attempt ${attempt}/${config.maxAttempts}`);
        
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        const mazaoError = error instanceof MazaoChainError 
          ? error 
          : MazaoChainError.fromUnknown(error);

        lastError = mazaoError;

        logger.warn(
          `${operationName} failed on attempt ${attempt}/${config.maxAttempts}`,
          { error: mazaoError.code, message: mazaoError.message }
        );

        // Check if error is retryable
        if (!this.isRetryable(mazaoError, config)) {
          logger.error(`${operationName} failed with non-retryable error`, mazaoError);
          throw mazaoError;
        }

        // Don't wait after the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        logger.debug(`Waiting ${delay}ms before retry`);
        
        await this.sleep(delay);
      }
    }

    // All attempts failed
    logger.error(`${operationName} failed after ${config.maxAttempts} attempts`, lastError);
    throw lastError || new MazaoChainError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Operation failed after ${config.maxAttempts} attempts`
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: MazaoChainError, config: RetryConfig): boolean {
    return error.retryable || config.retryableErrors.includes(error.code);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter (±25% randomization)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    
    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Decorator for automatic retry
 */
export function withRetry<T extends any[], R>(
  config?: Partial<RetryConfig>
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const method = descriptor.value!;
    const retryManager = new RetryManager(config);

    descriptor.value = async function (...args: T): Promise<R> {
      return retryManager.execute(
        () => method.apply(this, args),
        `${target.constructor.name}.${propertyName}`
      );
    };
  };
}

/**
 * Utility functions for common retry scenarios
 */
export const retryUtils = {
  /**
   * Retry for blockchain transactions
   */
  forBlockchain: new RetryManager({
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    retryableErrors: [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TRANSACTION_TIMEOUT,
      ErrorCode.TRANSACTION_FAILED,
    ]
  }),

  /**
   * Retry for database operations
   */
  forDatabase: new RetryManager({
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    retryableErrors: [
      ErrorCode.DATABASE_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
    ]
  }),

  /**
   * Retry for external API calls
   */
  forExternalAPI: new RetryManager({
    maxAttempts: 4,
    baseDelay: 1000,
    maxDelay: 15000,
    retryableErrors: [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
    ]
  }),

  /**
   * Retry for file operations
   */
  forFileOperations: new RetryManager({
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    retryableErrors: [
      ErrorCode.FILE_UPLOAD_FAILED,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
    ]
  })
};