/**
 * Blockchain Error Translation Utility
 * Translates blockchain/wallet errors to user-friendly messages in French and Lingala
 * Requirement 9.1: Error messages in Lingala/Français
 */

import { ErrorCode } from './types';
import { MazaoChainError } from './MazaoChainError';

export type SupportedLanguage = 'fr' | 'ln' | 'en';

interface BlockchainErrorMessages {
  fr: string;
  ln: string;
  en: string;
}

/**
 * Blockchain error code mappings
 */
export enum BlockchainErrorCode {
  // Wallet Connection Errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_LOCKED = 'WALLET_LOCKED',
  USER_REJECTED_CONNECTION = 'USER_REJECTED_CONNECTION',
  WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',
  
  // Transaction Errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  USER_REJECTED_TRANSACTION = 'USER_REJECTED_TRANSACTION',
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  CHAIN_MISMATCH = 'CHAIN_MISMATCH',
  
  // Contract Errors
  CONTRACT_EXECUTION_FAILED = 'CONTRACT_EXECUTION_FAILED',
  INVALID_CONTRACT_ADDRESS = 'INVALID_CONTRACT_ADDRESS',
  CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
  
  // Hedera-Specific Errors
  HEDERA_ACCOUNT_NOT_FOUND = 'HEDERA_ACCOUNT_NOT_FOUND',
  HEDERA_INSUFFICIENT_BALANCE = 'HEDERA_INSUFFICIENT_BALANCE',
  HEDERA_INVALID_SIGNATURE = 'HEDERA_INVALID_SIGNATURE',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error message translations
 */
const errorMessages: Record<BlockchainErrorCode, BlockchainErrorMessages> = {
  // Wallet Connection Errors
  [BlockchainErrorCode.WALLET_NOT_FOUND]: {
    fr: 'Portefeuille HashPack non trouvé. Veuillez installer l\'extension HashPack.',
    ln: 'Bozwi te portefeuille HashPack. Tyá extension HashPack.',
    en: 'HashPack wallet not found. Please install the HashPack extension.',
  },
  [BlockchainErrorCode.WALLET_LOCKED]: {
    fr: 'Votre portefeuille est verrouillé. Veuillez le déverrouiller.',
    ln: 'Portefeuille na yo ekangami. Fungola yango.',
    en: 'Your wallet is locked. Please unlock it.',
  },
  [BlockchainErrorCode.USER_REJECTED_CONNECTION]: {
    fr: 'Connexion au portefeuille refusée. Veuillez accepter la demande de connexion.',
    ln: 'Oboyaki connexion na portefeuille. Ndima demande ya connexion.',
    en: 'Wallet connection rejected. Please accept the connection request.',
  },
  [BlockchainErrorCode.WALLET_DISCONNECTED]: {
    fr: 'Portefeuille déconnecté. Veuillez reconnecter votre portefeuille.',
    ln: 'Portefeuille ekabwani. Zongisa connexion na portefeuille na yo.',
    en: 'Wallet disconnected. Please reconnect your wallet.',
  },
  
  // Transaction Errors
  [BlockchainErrorCode.INSUFFICIENT_FUNDS]: {
    fr: 'Fonds insuffisants pour effectuer cette transaction.',
    ln: 'Mbongo ekoki te mpo na transaction oyo.',
    en: 'Insufficient funds for this transaction.',
  },
  [BlockchainErrorCode.INSUFFICIENT_GAS]: {
    fr: 'Frais de transaction insuffisants. Veuillez augmenter les frais.',
    ln: 'Mbongo ya frais ekoki te. Matisa frais.',
    en: 'Insufficient gas fees. Please increase the fees.',
  },
  [BlockchainErrorCode.USER_REJECTED_TRANSACTION]: {
    fr: 'Transaction annulée. Vous avez refusé la transaction.',
    ln: 'Otikaki transaction. Oboyaki transaction.',
    en: 'Transaction cancelled. You rejected the transaction.',
  },
  [BlockchainErrorCode.TRANSACTION_REVERTED]: {
    fr: 'Transaction échouée. Le contrat a rejeté la transaction.',
    ln: 'Transaction ekweaki. Contrat eboyaki transaction.',
    en: 'Transaction failed. The contract rejected the transaction.',
  },
  [BlockchainErrorCode.TRANSACTION_TIMEOUT]: {
    fr: 'La transaction a pris trop de temps. Veuillez réessayer.',
    ln: 'Transaction ezwaki ntango mingi. Meka lisusu.',
    en: 'Transaction timed out. Please try again.',
  },
  [BlockchainErrorCode.INVALID_TRANSACTION]: {
    fr: 'Transaction invalide. Vérifiez les paramètres de la transaction.',
    ln: 'Transaction ezali malamu te. Tala ba paramètres ya transaction.',
    en: 'Invalid transaction. Check the transaction parameters.',
  },
  
  // Network Errors
  [BlockchainErrorCode.NETWORK_ERROR]: {
    fr: 'Erreur de réseau blockchain. Vérifiez votre connexion internet.',
    ln: 'Libunga ya réseau blockchain. Tala connexion internet na yo.',
    en: 'Blockchain network error. Check your internet connection.',
  },
  [BlockchainErrorCode.RPC_ERROR]: {
    fr: 'Erreur de communication avec le réseau. Veuillez réessayer.',
    ln: 'Libunga ya communication na réseau. Meka lisusu.',
    en: 'RPC communication error. Please try again.',
  },
  [BlockchainErrorCode.CHAIN_MISMATCH]: {
    fr: 'Mauvais réseau blockchain. Veuillez vous connecter au réseau Hedera.',
    ln: 'Réseau blockchain ezali malamu te. Kanga na réseau Hedera.',
    en: 'Wrong blockchain network. Please connect to Hedera network.',
  },
  
  // Contract Errors
  [BlockchainErrorCode.CONTRACT_EXECUTION_FAILED]: {
    fr: 'Échec de l\'exécution du contrat intelligent. Veuillez réessayer.',
    ln: 'Contrat intelligent ekweaki. Meka lisusu.',
    en: 'Smart contract execution failed. Please try again.',
  },
  [BlockchainErrorCode.INVALID_CONTRACT_ADDRESS]: {
    fr: 'Adresse de contrat invalide. Contactez le support.',
    ln: 'Adresse ya contrat ezali malamu te. Benga support.',
    en: 'Invalid contract address. Contact support.',
  },
  [BlockchainErrorCode.CONTRACT_NOT_DEPLOYED]: {
    fr: 'Contrat non déployé. Contactez le support.',
    ln: 'Contrat etyami te. Benga support.',
    en: 'Contract not deployed. Contact support.',
  },
  
  // Hedera-Specific Errors
  [BlockchainErrorCode.HEDERA_ACCOUNT_NOT_FOUND]: {
    fr: 'Compte Hedera non trouvé. Vérifiez votre compte.',
    ln: 'Compte Hedera ezwani te. Tala compte na yo.',
    en: 'Hedera account not found. Check your account.',
  },
  [BlockchainErrorCode.HEDERA_INSUFFICIENT_BALANCE]: {
    fr: 'Solde HBAR insuffisant pour les frais de transaction.',
    ln: 'HBAR ekoki te mpo na frais ya transaction.',
    en: 'Insufficient HBAR balance for transaction fees.',
  },
  [BlockchainErrorCode.HEDERA_INVALID_SIGNATURE]: {
    fr: 'Signature invalide. Veuillez réessayer la transaction.',
    ln: 'Signature ezali malamu te. Meka transaction lisusu.',
    en: 'Invalid signature. Please retry the transaction.',
  },
  
  // Generic
  [BlockchainErrorCode.UNKNOWN_ERROR]: {
    fr: 'Erreur blockchain inconnue. Veuillez réessayer ou contacter le support.',
    ln: 'Libunga ya blockchain eyebani te. Meka lisusu to benga support.',
    en: 'Unknown blockchain error. Please try again or contact support.',
  },
};

/**
 * Detect blockchain error code from error message
 */
export function detectBlockchainErrorCode(error: unknown): BlockchainErrorCode {
  if (!error) return BlockchainErrorCode.UNKNOWN_ERROR;
  
  const errorMessage = typeof error === 'string' 
    ? error.toLowerCase() 
    : (error as Error).message?.toLowerCase() || '';
  
  // Wallet errors
  if (errorMessage.includes('hashpack') && errorMessage.includes('not found')) {
    return BlockchainErrorCode.WALLET_NOT_FOUND;
  }
  if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
    return BlockchainErrorCode.WALLET_LOCKED;
  }
  if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    if (errorMessage.includes('connection')) {
      return BlockchainErrorCode.USER_REJECTED_CONNECTION;
    }
    return BlockchainErrorCode.USER_REJECTED_TRANSACTION;
  }
  if (errorMessage.includes('disconnected')) {
    return BlockchainErrorCode.WALLET_DISCONNECTED;
  }
  
  // Transaction errors
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return BlockchainErrorCode.INSUFFICIENT_FUNDS;
  }
  if (errorMessage.includes('insufficient gas') || errorMessage.includes('out of gas')) {
    return BlockchainErrorCode.INSUFFICIENT_GAS;
  }
  if (errorMessage.includes('reverted') || errorMessage.includes('execution reverted')) {
    return BlockchainErrorCode.TRANSACTION_REVERTED;
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return BlockchainErrorCode.TRANSACTION_TIMEOUT;
  }
  if (errorMessage.includes('invalid transaction')) {
    return BlockchainErrorCode.INVALID_TRANSACTION;
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return BlockchainErrorCode.NETWORK_ERROR;
  }
  if (errorMessage.includes('rpc')) {
    return BlockchainErrorCode.RPC_ERROR;
  }
  if (errorMessage.includes('chain') && errorMessage.includes('mismatch')) {
    return BlockchainErrorCode.CHAIN_MISMATCH;
  }
  
  // Contract errors
  if (errorMessage.includes('contract') && errorMessage.includes('failed')) {
    return BlockchainErrorCode.CONTRACT_EXECUTION_FAILED;
  }
  if (errorMessage.includes('invalid address')) {
    return BlockchainErrorCode.INVALID_CONTRACT_ADDRESS;
  }
  if (errorMessage.includes('not deployed')) {
    return BlockchainErrorCode.CONTRACT_NOT_DEPLOYED;
  }
  
  // Hedera-specific
  if (errorMessage.includes('hedera') && errorMessage.includes('account')) {
    return BlockchainErrorCode.HEDERA_ACCOUNT_NOT_FOUND;
  }
  if (errorMessage.includes('hbar') && errorMessage.includes('insufficient')) {
    return BlockchainErrorCode.HEDERA_INSUFFICIENT_BALANCE;
  }
  if (errorMessage.includes('signature') && errorMessage.includes('invalid')) {
    return BlockchainErrorCode.HEDERA_INVALID_SIGNATURE;
  }
  
  return BlockchainErrorCode.UNKNOWN_ERROR;
}

/**
 * Translate blockchain error to user-friendly message
 */
export function translateBlockchainError(
  error: unknown,
  language: SupportedLanguage = 'fr'
): string {
  const errorCode = detectBlockchainErrorCode(error);
  const messages = errorMessages[errorCode];
  
  return messages[language] || messages.fr;
}

/**
 * Create MazaoChainError from blockchain error
 */
export function createBlockchainError(
  error: unknown,
  language: SupportedLanguage = 'fr',
  context?: {
    transactionId?: string;
    walletAddress?: string;
    contractAddress?: string;
  }
): MazaoChainError {
  const blockchainErrorCode = detectBlockchainErrorCode(error);
  const userMessage = translateBlockchainError(error, language);
  
  // Map blockchain error codes to MazaoChain error codes
  const errorCodeMap: Record<BlockchainErrorCode, ErrorCode> = {
    [BlockchainErrorCode.WALLET_NOT_FOUND]: ErrorCode.WALLET_CONNECTION_FAILED,
    [BlockchainErrorCode.WALLET_LOCKED]: ErrorCode.WALLET_CONNECTION_FAILED,
    [BlockchainErrorCode.USER_REJECTED_CONNECTION]: ErrorCode.WALLET_CONNECTION_FAILED,
    [BlockchainErrorCode.WALLET_DISCONNECTED]: ErrorCode.WALLET_NOT_CONNECTED,
    [BlockchainErrorCode.INSUFFICIENT_FUNDS]: ErrorCode.INSUFFICIENT_BALANCE,
    [BlockchainErrorCode.INSUFFICIENT_GAS]: ErrorCode.INSUFFICIENT_BALANCE,
    [BlockchainErrorCode.USER_REJECTED_TRANSACTION]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.TRANSACTION_REVERTED]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.TRANSACTION_TIMEOUT]: ErrorCode.TRANSACTION_TIMEOUT,
    [BlockchainErrorCode.INVALID_TRANSACTION]: ErrorCode.INVALID_TRANSACTION,
    [BlockchainErrorCode.NETWORK_ERROR]: ErrorCode.NETWORK_ERROR,
    [BlockchainErrorCode.RPC_ERROR]: ErrorCode.NETWORK_ERROR,
    [BlockchainErrorCode.CHAIN_MISMATCH]: ErrorCode.NETWORK_ERROR,
    [BlockchainErrorCode.CONTRACT_EXECUTION_FAILED]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.INVALID_CONTRACT_ADDRESS]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.CONTRACT_NOT_DEPLOYED]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.HEDERA_ACCOUNT_NOT_FOUND]: ErrorCode.WALLET_CONNECTION_FAILED,
    [BlockchainErrorCode.HEDERA_INSUFFICIENT_BALANCE]: ErrorCode.INSUFFICIENT_BALANCE,
    [BlockchainErrorCode.HEDERA_INVALID_SIGNATURE]: ErrorCode.TRANSACTION_FAILED,
    [BlockchainErrorCode.UNKNOWN_ERROR]: ErrorCode.TRANSACTION_FAILED,
  };
  
  const mazaoErrorCode = errorCodeMap[blockchainErrorCode];
  
  // Determine if error is retryable
  const retryableErrors = [
    BlockchainErrorCode.TRANSACTION_TIMEOUT,
    BlockchainErrorCode.NETWORK_ERROR,
    BlockchainErrorCode.RPC_ERROR,
    BlockchainErrorCode.CONTRACT_EXECUTION_FAILED,
  ];
  
  return new MazaoChainError(
    mazaoErrorCode,
    typeof error === 'string' ? error : (error as Error).message || 'Blockchain error',
    {
      userMessage,
      retryable: retryableErrors.includes(blockchainErrorCode),
      originalError: error instanceof Error ? error : undefined,
      context: context ? {
        timestamp: new Date(),
        transactionId: context.transactionId,
        walletAddress: context.walletAddress,
        additionalData: {
          blockchainErrorCode,
          contractAddress: context.contractAddress,
        }
      } : undefined,
    }
  );
}

/**
 * Check if error is a blockchain error
 */
export function isBlockchainError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error.toLowerCase() 
    : (error as Error).message?.toLowerCase() || '';
  
  const blockchainKeywords = [
    'wallet',
    'hashpack',
    'transaction',
    'blockchain',
    'hedera',
    'contract',
    'gas',
    'hbar',
    'signature',
    'chain',
    'rpc',
  ];
  
  return blockchainKeywords.some(keyword => errorMessage.includes(keyword));
}
