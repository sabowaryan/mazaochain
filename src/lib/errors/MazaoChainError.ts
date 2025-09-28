import { ErrorCode, ErrorSeverity, ErrorContext, MazaoChainError as IMazaoChainError } from './types';

/**
 * Custom error class for MazaoChain platform
 * Provides structured error handling with context and user-friendly messages
 */
export class MazaoChainError extends Error implements IMazaoChainError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      originalError?: Error;
      retryable?: boolean;
      userMessage?: string;
    } = {}
  ) {
    super(message);
    
    this.name = 'MazaoChainError';
    this.code = code;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.context = options.context;
    this.originalError = options.originalError;
    this.retryable = options.retryable || false;
    this.userMessage = options.userMessage || this.getDefaultUserMessage(code);

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MazaoChainError);
    }
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    // Default messages in French (can be localized later)
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Vous devez vous connecter pour accéder à cette fonctionnalité.',
      [ErrorCode.FORBIDDEN]: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
      [ErrorCode.INVALID_TOKEN]: 'Votre session a expiré. Veuillez vous reconnecter.',
      [ErrorCode.SESSION_EXPIRED]: 'Votre session a expiré. Veuillez vous reconnecter.',
      
      [ErrorCode.VALIDATION_ERROR]: 'Les données saisies ne sont pas valides.',
      [ErrorCode.INVALID_INPUT]: 'Veuillez vérifier les informations saisies.',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Certains champs obligatoires sont manquants.',
      [ErrorCode.INVALID_FORMAT]: 'Le format des données n\'est pas correct.',
      
      [ErrorCode.WALLET_NOT_CONNECTED]: 'Veuillez connecter votre portefeuille HashPack.',
      [ErrorCode.WALLET_CONNECTION_FAILED]: 'Impossible de se connecter au portefeuille.',
      [ErrorCode.INSUFFICIENT_BALANCE]: 'Solde insuffisant pour cette transaction.',
      [ErrorCode.TRANSACTION_FAILED]: 'La transaction a échoué. Veuillez réessayer.',
      [ErrorCode.TRANSACTION_TIMEOUT]: 'La transaction a pris trop de temps. Veuillez réessayer.',
      [ErrorCode.INVALID_TRANSACTION]: 'Transaction invalide.',
      [ErrorCode.NETWORK_ERROR]: 'Erreur de réseau. Vérifiez votre connexion.',
      
      [ErrorCode.INSUFFICIENT_COLLATERAL]: 'Garantie insuffisante pour ce prêt.',
      [ErrorCode.EVALUATION_PENDING]: 'Votre évaluation de culture est en attente d\'approbation.',
      [ErrorCode.LOAN_NOT_ELIGIBLE]: 'Vous n\'êtes pas éligible pour ce prêt.',
      [ErrorCode.INVALID_LOAN_AMOUNT]: 'Montant de prêt invalide.',
      [ErrorCode.REPAYMENT_FAILED]: 'Le remboursement a échoué. Veuillez réessayer.',
      
      [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données. Veuillez réessayer.',
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Service externe indisponible.',
      [ErrorCode.INTERNAL_SERVER_ERROR]: 'Erreur interne du serveur.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporairement indisponible.',
      
      [ErrorCode.FILE_UPLOAD_FAILED]: 'Échec du téléchargement du fichier.',
      [ErrorCode.INVALID_FILE_TYPE]: 'Type de fichier non supporté.',
      [ErrorCode.FILE_TOO_LARGE]: 'Fichier trop volumineux.',
    };

    return messages[code] || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }

  /**
   * Create error from unknown error type
   */
  static fromUnknown(error: unknown, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR): MazaoChainError {
    if (error instanceof MazaoChainError) {
      return error;
    }

    if (error instanceof Error) {
      return new MazaoChainError(code, error.message, {
        originalError: error,
        severity: ErrorSeverity.HIGH,
      });
    }

    return new MazaoChainError(code, String(error), {
      severity: ErrorSeverity.HIGH,
    });
  }
}