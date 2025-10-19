/**
 * Wallet Types for HashPack Wallet v2 Integration
 * 
 * This file contains all TypeScript interfaces and types for the HashPack Wallet v2 migration.
 * These types support both Hedera native and EVM namespaces.
 */

/**
 * Wallet connection state
 * Updated for v2 with namespace and chainId support
 */
export interface WalletConnection {
  accountId: string;
  network: 'mainnet' | 'testnet';
  isConnected: boolean;
  namespace: 'hedera' | 'eip155';
  chainId: string;
}

/**
 * Wallet session structure for v2
 * Represents an active WalletConnect session
 */
export interface WalletSession {
  topic: string;
  expiry: number;
  namespaces: {
    hedera?: {
      accounts: string[];
      methods: string[];
      events: string[];
    };
    eip155?: {
      accounts: string[];
      methods: string[];
      events: string[];
    };
  };
}

/**
 * Transaction request structure for v2
 * Used for both native Hedera and EVM transactions
 */
export interface TransactionRequest {
  namespace: 'hedera' | 'eip155';
  method: string;
  params: {
    transactionBytes?: string;
    signerAccountId?: string;
    [key: string]: unknown;
  };
}

/**
 * Standardized wallet error codes
 * Provides consistent error handling across the application
 */
export enum WalletErrorCode {
  // Connection errors
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REJECTED = 'CONNECTION_REJECTED',
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Session errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_SESSION = 'INVALID_SESSION',
  
  // Transaction errors
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // General errors
  NOT_CONNECTED = 'NOT_CONNECTED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Session event types for v2
 */
export interface SessionEvent {
  id: number;
  topic: string;
  params: {
    event: {
      name: string;
      data: unknown;
    };
    chainId: string;
  };
}

export interface SessionUpdate {
  topic: string;
  params: {
    namespaces: {
      hedera?: {
        accounts: string[];
        methods: string[];
        events: string[];
      };
      eip155?: {
        accounts: string[];
        methods: string[];
        events: string[];
      };
    };
  };
}

export interface SessionDelete {
  topic: string;
  id: number;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
  symbol: string;
  name: string;
}

/**
 * Wallet balances including HBAR and tokens
 */
export interface WalletBalances {
  hbar: string;
  tokens: TokenBalance[];
}

/**
 * Wallet error class with standardized error codes
 */
export class WalletError extends Error {
  code: WalletErrorCode;
  originalError?: unknown;

  constructor(code: WalletErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.originalError = originalError;
  }
}
