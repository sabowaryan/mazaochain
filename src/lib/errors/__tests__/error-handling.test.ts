import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MazaoChainError } from '../MazaoChainError';
import { ErrorCode, ErrorSeverity } from '../types';
import { ErrorHandler } from '../handler';
import { RetryManager } from '../retry';
import { Logger } from '../logger';
import { ValidationSchemas } from '../../validation/validators';

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MazaoChainError', () => {
    it('should create error with default values', () => {
      const error = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Test error message'
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toBe('Les données saisies ne sont pas valides.');
    });

    it('should create error with custom options', () => {
      const context = {
        userId: 'test-user',
        timestamp: new Date(),
      };

      const error = new MazaoChainError(
        ErrorCode.TRANSACTION_FAILED,
        'Transaction failed',
        {
          severity: ErrorSeverity.HIGH,
          context,
          retryable: true,
          userMessage: 'Custom user message'
        }
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toBe(context);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toBe('Custom user message');
    });

    it('should convert to JSON correctly', () => {
      const error = new MazaoChainError(
        ErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );

      const json = error.toJSON();

      expect(json.name).toBe('MazaoChainError');
      expect(json.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);
      expect(json.message).toBe('Wallet not connected');
      expect(json.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should create from unknown error', () => {
      const originalError = new Error('Original error');
      const mazaoError = MazaoChainError.fromUnknown(originalError);

      expect(mazaoError).toBeInstanceOf(MazaoChainError);
      expect(mazaoError.originalError).toBe(originalError);
      expect(mazaoError.message).toBe('Original error');
    });
  });

  describe('ErrorHandler', () => {
    it('should handle MazaoChainError', () => {
      const originalError = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed'
      );

      const handled = ErrorHandler.handle(originalError);

      expect(handled).toBe(originalError);
    });

    it('should convert regular Error to MazaoChainError', () => {
      const originalError = new Error('Regular error');
      const handled = ErrorHandler.handle(originalError);

      expect(handled).toBeInstanceOf(MazaoChainError);
      expect(handled.originalError).toBe(originalError);
      expect(handled.message).toBe('Regular error');
    });

    it('should handle string errors', () => {
      const handled = ErrorHandler.handle('String error');

      expect(handled).toBeInstanceOf(MazaoChainError);
      expect(handled.message).toBe('String error');
    });

    it('should handle async operations', async () => {
      const successOperation = async () => 'success';
      const result = await ErrorHandler.handleAsync(successOperation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should handle async operation failures', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      const result = await ErrorHandler.handleAsync(failingOperation);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(MazaoChainError);
    });

    it('should handle transaction errors', () => {
      const error = new Error('insufficient balance');
      const handled = ErrorHandler.handleTransactionError(
        error,
        'tx123',
        '0.0.123456'
      );

      expect(handled.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(handled.context?.transactionId).toBe('tx123');
      expect(handled.context?.walletAddress).toBe('0.0.123456');
    });
  });

  describe('RetryManager', () => {
    it('should succeed on first attempt', async () => {
      const retryManager = new RetryManager();
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryManager.execute(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryManager = new RetryManager({
        maxAttempts: 3,
        baseDelay: 10, // Short delay for testing
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new MazaoChainError(ErrorCode.NETWORK_ERROR, 'Network error', { retryable: true }))
        .mockRejectedValueOnce(new MazaoChainError(ErrorCode.NETWORK_ERROR, 'Network error', { retryable: true }))
        .mockResolvedValue('success');

      const result = await retryManager.execute(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const retryManager = new RetryManager();
      const operation = vi.fn()
        .mockRejectedValue(new MazaoChainError(ErrorCode.VALIDATION_ERROR, 'Validation error', { retryable: false }));

      await expect(retryManager.execute(operation, 'test-operation')).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const retryManager = new RetryManager({
        maxAttempts: 2,
        baseDelay: 10,
      });

      const operation = vi.fn()
        .mockRejectedValue(new MazaoChainError(ErrorCode.NETWORK_ERROR, 'Network error', { retryable: true }));

      await expect(retryManager.execute(operation, 'test-operation')).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.getInstance();
      logger.clearLogs();
    });

    it('should log messages with different levels', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(4);
      expect(logs[0].level).toBe('debug');
      expect(logs[1].level).toBe('info');
      expect(logs[2].level).toBe('warn');
      expect(logs[3].level).toBe('error');
    });

    it('should filter logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.error('Error message');

      const errorLogs = logger.getLogsByLevel('error' as any);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    it('should limit log storage', () => {
      // Create more logs than the limit
      for (let i = 0; i < 1100; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = logger.getRecentLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Validation System', () => {
    it('should validate user registration', () => {
      const schema = ValidationSchemas.userRegistration();
      
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'agriculteur'
      };

      const result = schema.validate(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid user registration', () => {
      const schema = ValidationSchemas.userRegistration();
      
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        role: 'invalid-role'
      };

      const result = schema.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate crop evaluation', () => {
      const schema = ValidationSchemas.cropEvaluation();
      
      const validData = {
        cropType: 'manioc',
        superficie: 5.5,
        rendementHistorique: 15000
      };

      const result = schema.validate(validData);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid crop evaluation', () => {
      const schema = ValidationSchemas.cropEvaluation();
      
      const invalidData = {
        cropType: 'invalid-crop',
        superficie: -1, // Negative
        rendementHistorique: 0 // Zero
      };

      const result = schema.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate loan request', () => {
      const schema = ValidationSchemas.loanRequest();
      
      const validData = {
        amount: 1000,
        purpose: 'Achat de semences et d\'engrais pour la prochaine saison'
      };

      const result = schema.validate(validData);
      expect(result.isValid).toBe(true);
    });

    it('should validate wallet address', () => {
      const schema = ValidationSchemas.walletAddress();
      
      const validData = {
        walletAddress: '0.0.123456'
      };

      const result = schema.validate(validData);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid wallet address', () => {
      const schema = ValidationSchemas.walletAddress();
      
      const invalidData = {
        walletAddress: 'invalid-address'
      };

      const result = schema.validate(invalidData);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error flow', async () => {
      const logger = Logger.getInstance();
      logger.clearLogs();

      // Simulate a failing operation
      const failingOperation = async () => {
        throw new Error('Database connection failed');
      };

      const result = await ErrorHandler.handleAsync(failingOperation, {
        context: ErrorHandler.createContext({
          userId: 'test-user',
          additionalData: { operation: 'test' }
        })
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(MazaoChainError);

      // Check that error was logged
      const errorLogs = logger.getLogsByLevel('error' as unknown);
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should validate and handle form submission', () => {
      const schema = ValidationSchemas.userRegistration();
      
      const formData = {
        email: 'invalid-email',
        password: '123',
        role: 'invalid'
      };

      const validationResult = schema.validate(formData);
      
      if (!validationResult.isValid) {
        const error = ErrorHandler.handleValidationErrors(validationResult.errors);
        expect(error).toBeInstanceOf(MazaoChainError);
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });
  });
});