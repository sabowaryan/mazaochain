/**
 * Error Handling System Tests
 * Verifies that error handling works correctly across the application
 */

import { describe, it, expect } from 'vitest';
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/types';
import { 
  translateBlockchainError, 
  createBlockchainError,
  isBlockchainError,
  detectBlockchainErrorCode,
  BlockchainErrorCode 
} from '@/lib/errors/blockchain-errors';
import { ErrorHandler } from '@/lib/errors/handler';

describe('Error Handling System', () => {
  describe('MazaoChainError', () => {
    it('should create error with user message', () => {
      const error = new MazaoChainError(
        ErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
      
      expect(error.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);
      expect(error.userMessage).toBe('Veuillez connecter votre portefeuille HashPack.');
    });

    it('should include context', () => {
      const error = new MazaoChainError(
        ErrorCode.TRANSACTION_FAILED,
        'Transaction failed',
        {
          context: {
            timestamp: new Date(),
            transactionId: 'tx123',
            walletAddress: '0x123'
          }
        }
      );
      
      expect(error.context?.transactionId).toBe('tx123');
      expect(error.context?.walletAddress).toBe('0x123');
    });
  });

  describe('Blockchain Error Translation', () => {
    it('should translate insufficient funds error to French', () => {
      const error = new Error('insufficient funds');
      const message = translateBlockchainError(error, 'fr');
      
      expect(message).toBe('Fonds insuffisants pour effectuer cette transaction.');
    });

    it('should translate insufficient funds error to Lingala', () => {
      const error = new Error('insufficient funds');
      const message = translateBlockchainError(error, 'ln');
      
      expect(message).toBe('Mbongo ekoki te mpo na transaction oyo.');
    });

    it('should detect wallet not found error', () => {
      const error = new Error('HashPack not found');
      const code = detectBlockchainErrorCode(error);
      
      expect(code).toBe(BlockchainErrorCode.WALLET_NOT_FOUND);
    });

    it('should detect user rejected transaction', () => {
      const error = new Error('user rejected transaction');
      const code = detectBlockchainErrorCode(error);
      
      expect(code).toBe(BlockchainErrorCode.USER_REJECTED_TRANSACTION);
    });

    it('should identify blockchain errors', () => {
      const walletError = new Error('wallet connection failed');
      const transactionError = new Error('transaction reverted');
      const genericError = new Error('something went wrong');
      
      expect(isBlockchainError(walletError)).toBe(true);
      expect(isBlockchainError(transactionError)).toBe(true);
      expect(isBlockchainError(genericError)).toBe(false);
    });

    it('should create MazaoChainError from blockchain error', () => {
      const error = new Error('insufficient gas');
      const mazaoError = createBlockchainError(error, 'fr', {
        transactionId: 'tx456',
        walletAddress: '0x456'
      });
      
      expect(mazaoError).toBeInstanceOf(MazaoChainError);
      expect(mazaoError.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(mazaoError.context?.transactionId).toBe('tx456');
    });
  });

  describe('Error Handler', () => {
    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const mazaoError = ErrorHandler.handle(error);
      
      expect(mazaoError).toBeInstanceOf(MazaoChainError);
      expect(mazaoError.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });

    it('should handle async operations', async () => {
      const result = await ErrorHandler.handleAsync(async () => {
        throw new Error('Async error');
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(MazaoChainError);
      }
    });

    it('should handle successful async operations', async () => {
      const result = await ErrorHandler.handleAsync(async () => {
        return { data: 'success' };
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ data: 'success' });
      }
    });
  });

  describe('Error Severity', () => {
    it('should assign correct severity to errors', () => {
      const criticalError = new MazaoChainError(
        ErrorCode.DATABASE_ERROR,
        'Database error',
        { severity: ErrorSeverity.CRITICAL }
      );
      
      const lowError = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Validation error',
        { severity: ErrorSeverity.LOW }
      );
      
      expect(criticalError.severity).toBe(ErrorSeverity.CRITICAL);
      expect(lowError.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('Retryable Errors', () => {
    it('should mark network errors as retryable', () => {
      const error = new MazaoChainError(
        ErrorCode.NETWORK_ERROR,
        'Network error',
        { retryable: true }
      );
      
      expect(error.retryable).toBe(true);
    });

    it('should not mark validation errors as retryable', () => {
      const error = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Validation error',
        { retryable: false }
      );
      
      expect(error.retryable).toBe(false);
    });
  });
});
