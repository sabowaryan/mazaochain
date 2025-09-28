import { MazaoChainError } from '../errors/MazaoChainError';
import { ErrorCode, ErrorSeverity } from '../errors/types';
import { ErrorHandler } from '../errors/handler';
import { retryUtils } from '../errors/retry';
import { logger } from '../errors/logger';

/**
 * Specialized error handling for blockchain operations
 * Implements retry mechanisms and specific error mapping for Hedera transactions
 */

export interface BlockchainOperationResult<T> {
  success: boolean;
  data?: T;
  error?: MazaoChainError;
  transactionId?: string;
  retryCount?: number;
}

export class BlockchainErrorHandler {
  /**
   * Execute blockchain operation with comprehensive error handling and retry
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: {
      walletAddress?: string;
      transactionType?: string;
      amount?: number;
    }
  ): Promise<BlockchainOperationResult<T>> {
    const startTime = Date.now();
    
    logger.info(`Starting blockchain operation: ${operationName}`, {
      context,
      timestamp: new Date()
    });

    try {
      const result = await retryUtils.forBlockchain.execute(
        operation,
        operationName
      );

      const duration = Date.now() - startTime;
      logger.info(`Blockchain operation completed: ${operationName}`, {
        duration,
        context
      });

      return {
        success: true,
        data: result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const mazaoError = this.handleBlockchainError(error, operationName, context);
      
      logger.error(`Blockchain operation failed: ${operationName}`, mazaoError, {
        timestamp: new Date(),
        additionalData: {
          ...context,
          duration
        }
      });

      return {
        success: false,
        error: mazaoError
      };
    }
  }

  /**
   * Handle specific blockchain errors
   */
  private static handleBlockchainError(
    error: unknown,
    operationName: string,
    context?: {
      walletAddress?: string;
      transactionType?: string;
      amount?: number;
    }
  ): MazaoChainError {
    const errorContext = ErrorHandler.createContext({
      walletAddress: context?.walletAddress,
      additionalData: {
        operationName,
        transactionType: context?.transactionType,
        amount: context?.amount,
        errorType: 'blockchain_operation'
      }
    });

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Insufficient balance errors
      if (message.includes('insufficient') || message.includes('balance')) {
        return new MazaoChainError(
          ErrorCode.INSUFFICIENT_BALANCE,
          'Insufficient balance for transaction',
          {
            context: errorContext,
            severity: ErrorSeverity.MEDIUM,
            retryable: false,
            userMessage: 'Solde insuffisant pour cette transaction',
            originalError: error
          }
        );
      }

      // Network connectivity errors
      if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
        return new MazaoChainError(
          ErrorCode.NETWORK_ERROR,
          'Network error during blockchain operation',
          {
            context: errorContext,
            severity: ErrorSeverity.MEDIUM,
            retryable: true,
            userMessage: 'Erreur de réseau. Vérifiez votre connexion et réessayez.',
            originalError: error
          }
        );
      }

      // Transaction timeout errors
      if (message.includes('timeout') || message.includes('timed out')) {
        return new MazaoChainError(
          ErrorCode.TRANSACTION_TIMEOUT,
          'Transaction timed out',
          {
            context: errorContext,
            severity: ErrorSeverity.MEDIUM,
            retryable: true,
            userMessage: 'La transaction a pris trop de temps. Veuillez réessayer.',
            originalError: error
          }
        );
      }

      // Wallet connection errors
      if (message.includes('wallet') || message.includes('hashpack') || message.includes('not connected')) {
        return new MazaoChainError(
          ErrorCode.WALLET_NOT_CONNECTED,
          'Wallet not connected',
          {
            context: errorContext,
            severity: ErrorSeverity.HIGH,
            retryable: false,
            userMessage: 'Veuillez connecter votre portefeuille HashPack.',
            originalError: error
          }
        );
      }

      // Invalid transaction errors
      if (message.includes('invalid') || message.includes('malformed')) {
        return new MazaoChainError(
          ErrorCode.INVALID_TRANSACTION,
          'Invalid transaction',
          {
            context: errorContext,
            severity: ErrorSeverity.HIGH,
            retryable: false,
            userMessage: 'Transaction invalide. Veuillez vérifier les paramètres.',
            originalError: error
          }
        );
      }

      // Gas/fee related errors
      if (message.includes('gas') || message.includes('fee')) {
        return new MazaoChainError(
          ErrorCode.TRANSACTION_FAILED,
          'Transaction fee error',
          {
            context: errorContext,
            severity: ErrorSeverity.MEDIUM,
            retryable: true,
            userMessage: 'Erreur de frais de transaction. Veuillez réessayer.',
            originalError: error
          }
        );
      }
    }

    // Default blockchain error
    return new MazaoChainError(
      ErrorCode.TRANSACTION_FAILED,
      `Blockchain operation failed: ${operationName}`,
      {
        context: errorContext,
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: 'Erreur lors de l\'opération blockchain. Veuillez réessayer.',
        originalError: error instanceof Error ? error : new Error(String(error))
      }
    );
  }

  /**
   * Handle token operation errors
   */
  static handleTokenError(
    error: unknown,
    operation: 'mint' | 'burn' | 'transfer' | 'associate',
    tokenId?: string,
    amount?: number,
    walletAddress?: string
  ): MazaoChainError {
    const context = ErrorHandler.createContext({
      walletAddress,
      additionalData: {
        operation,
        tokenId,
        amount,
        errorType: 'token_operation'
      }
    });

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Token not associated
      if (message.includes('not associated') || message.includes('association')) {
        return new MazaoChainError(
          ErrorCode.INVALID_TRANSACTION,
          'Token not associated with account',
          {
            context,
            severity: ErrorSeverity.MEDIUM,
            retryable: false,
            userMessage: 'Le token n\'est pas associé à votre compte. Veuillez l\'associer d\'abord.',
            originalError: error
          }
        );
      }

      // Insufficient token balance
      if (message.includes('insufficient') && (operation === 'burn' || operation === 'transfer')) {
        return new MazaoChainError(
          ErrorCode.INSUFFICIENT_BALANCE,
          'Insufficient token balance',
          {
            context,
            severity: ErrorSeverity.MEDIUM,
            retryable: false,
            userMessage: 'Solde de tokens insuffisant pour cette opération.',
            originalError: error
          }
        );
      }
    }

    return this.handleBlockchainError(error, `token_${operation}`, {
      walletAddress,
      transactionType: operation,
      amount
    });
  }

  /**
   * Handle smart contract errors
   */
  static handleContractError(
    error: unknown,
    contractFunction: string,
    contractId?: string,
    parameters?: Record<string, unknown>
  ): MazaoChainError {
    const context = ErrorHandler.createContext({
      additionalData: {
        contractFunction,
        contractId,
        parameters,
        errorType: 'smart_contract'
      }
    });

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Contract execution errors
      if (message.includes('contract execution') || message.includes('revert')) {
        return new MazaoChainError(
          ErrorCode.TRANSACTION_FAILED,
          'Smart contract execution failed',
          {
            context,
            severity: ErrorSeverity.HIGH,
            retryable: false,
            userMessage: 'Erreur lors de l\'exécution du contrat intelligent.',
            originalError: error
          }
        );
      }

      // Contract not found
      if (message.includes('not found') || message.includes('does not exist')) {
        return new MazaoChainError(
          ErrorCode.INVALID_TRANSACTION,
          'Smart contract not found',
          {
            context,
            severity: ErrorSeverity.CRITICAL,
            retryable: false,
            userMessage: 'Contrat intelligent introuvable. Veuillez contacter le support.',
            originalError: error
          }
        );
      }
    }

    return this.handleBlockchainError(error, `contract_${contractFunction}`, {
      transactionType: 'smart_contract'
    });
  }

  /**
   * Validate transaction parameters before execution
   */
  static validateTransactionParams(params: {
    amount?: number;
    walletAddress?: string;
    tokenId?: string;
    contractId?: string;
  }): MazaoChainError | null {
    const { amount, walletAddress, tokenId, contractId } = params;

    // Validate amount
    if (amount !== undefined) {
      if (amount <= 0) {
        return new MazaoChainError(
          ErrorCode.VALIDATION_ERROR,
          'Amount must be positive',
          {
            severity: ErrorSeverity.LOW,
            userMessage: 'Le montant doit être positif.'
          }
        );
      }

      if (amount > 1000000) { // Arbitrary large amount check
        return new MazaoChainError(
          ErrorCode.VALIDATION_ERROR,
          'Amount too large',
          {
            severity: ErrorSeverity.LOW,
            userMessage: 'Montant trop élevé.'
          }
        );
      }
    }

    // Validate wallet address format (Hedera format: 0.0.xxxxx)
    if (walletAddress && !/^0\.0\.\d+$/.test(walletAddress)) {
      return new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid wallet address format',
        {
          severity: ErrorSeverity.LOW,
          userMessage: 'Format d\'adresse de portefeuille invalide.'
        }
      );
    }

    // Validate token ID format
    if (tokenId && !/^0\.0\.\d+$/.test(tokenId)) {
      return new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid token ID format',
        {
          severity: ErrorSeverity.LOW,
          userMessage: 'Format d\'ID de token invalide.'
        }
      );
    }

    // Validate contract ID format
    if (contractId && !/^0\.0\.\d+$/.test(contractId)) {
      return new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid contract ID format',
        {
          severity: ErrorSeverity.LOW,
          userMessage: 'Format d\'ID de contrat invalide.'
        }
      );
    }

    return null; // No validation errors
  }
}