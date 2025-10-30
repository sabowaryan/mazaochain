// Gestionnaire d'erreurs pour les wallets v2

/**
 * Codes d'erreur standardisés pour le wallet
 */
export enum WalletErrorCode {
  // Erreurs de connexion
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REJECTED = 'CONNECTION_REJECTED',
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Erreurs de session
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_SESSION = 'INVALID_SESSION',
  
  // Erreurs de transaction
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // Erreurs générales
  NOT_CONNECTED = 'NOT_CONNECTED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // Erreurs v1 (legacy)
  WALLETCONNECT_CONFIG_ERROR = 'WALLETCONNECT_CONFIG_ERROR',
  RECOMMENDED_WALLETS_ERROR = 'RECOMMENDED_WALLETS_ERROR',
  EXPLORER_CTRL_ERROR = 'EXPLORER_CTRL_ERROR'
}

/**
 * Classe d'erreur personnalisée pour le wallet
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode = WalletErrorCode.UNKNOWN_ERROR,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

/**
 * Messages d'erreur spécifiques pour chaque code d'erreur
 */
const ERROR_MESSAGES: Record<WalletErrorCode, string> = {
  // Erreurs de connexion
  [WalletErrorCode.CONNECTION_TIMEOUT]: 'La connexion a expiré. Veuillez réessayer.',
  [WalletErrorCode.CONNECTION_REJECTED]: 'Connexion refusée dans HashPack.',
  [WalletErrorCode.WALLET_NOT_INSTALLED]: 'HashPack n\'est pas installé. Veuillez installer l\'extension HashPack.',
  [WalletErrorCode.INVALID_PROJECT_ID]: 'Configuration WalletConnect invalide. Veuillez vérifier votre Project ID.',
  [WalletErrorCode.NETWORK_ERROR]: 'Problème de connexion réseau. Vérifiez votre connexion internet.',
  
  // Erreurs de session
  [WalletErrorCode.SESSION_EXPIRED]: 'Votre session a expiré. Veuillez vous reconnecter.',
  [WalletErrorCode.SESSION_NOT_FOUND]: 'Aucune session active trouvée. Veuillez vous connecter.',
  [WalletErrorCode.INVALID_SESSION]: 'Session invalide. Veuillez vous reconnecter.',
  
  // Erreurs de transaction
  [WalletErrorCode.TRANSACTION_REJECTED]: 'Transaction refusée dans HashPack.',
  [WalletErrorCode.TRANSACTION_FAILED]: 'La transaction a échoué. Veuillez réessayer.',
  [WalletErrorCode.INVALID_TRANSACTION]: 'Transaction invalide. Veuillez vérifier les paramètres.',
  [WalletErrorCode.INSUFFICIENT_BALANCE]: 'Solde insuffisant pour effectuer cette transaction.',
  
  // Erreurs générales
  [WalletErrorCode.NOT_CONNECTED]: 'Wallet non connecté. Veuillez vous connecter d\'abord.',
  [WalletErrorCode.INITIALIZATION_FAILED]: 'Échec de l\'initialisation du wallet. Veuillez rafraîchir la page.',
  [WalletErrorCode.UNKNOWN_ERROR]: 'Une erreur inconnue s\'est produite avec le wallet.',
  
  // Erreurs v1 (legacy)
  [WalletErrorCode.WALLETCONNECT_CONFIG_ERROR]: 'Erreur de configuration du wallet. Veuillez vérifier votre configuration WalletConnect.',
  [WalletErrorCode.RECOMMENDED_WALLETS_ERROR]: 'Erreur lors du chargement des wallets recommandés. Veuillez réessayer.',
  [WalletErrorCode.EXPLORER_CTRL_ERROR]: 'Erreur du contrôleur d\'exploration des wallets. Veuillez rafraîchir la page.'
};

/**
 * Détecte le code d'erreur approprié basé sur le message d'erreur
 * Enhanced for HederaProvider and AppKit error detection
 */
function detectErrorCode(error: Error): WalletErrorCode {
  const message = error.message.toLowerCase();
  const errorObj = error as Error & { code?: string; name?: string };
  const errorCode = errorObj.code?.toLowerCase() || "";
  const errorName = errorObj.name?.toLowerCase() || "";
  
  // Erreurs de connexion - Enhanced detection
  if (
    message.includes('timeout') || 
    message.includes('timed out') ||
    message.includes('proposal expired') ||
    message.includes('time limit') ||
    errorCode.includes('timeout') ||
    errorName.includes('timeout')
  ) {
    return WalletErrorCode.CONNECTION_TIMEOUT;
  }
  if (
    message.includes('rejected') || 
    message.includes('user rejected') || 
    message.includes('user denied') ||
    message.includes('cancelled') ||
    message.includes('denied') ||
    errorCode.includes('rejected') ||
    errorCode.includes('denied') ||
    errorName.includes('rejection')
  ) {
    return WalletErrorCode.CONNECTION_REJECTED;
  }
  if (
    message.includes('not installed') || 
    message.includes('no provider') ||
    message.includes('wallet not found') ||
    message.includes('no wallet') ||
    message.includes('missing wallet') ||
    errorCode.includes('wallet_not_found') ||
    errorName.includes('walletnotfound')
  ) {
    return WalletErrorCode.WALLET_NOT_INSTALLED;
  }
  if (
    message.includes('project id') || 
    message.includes('projectid') || 
    message.includes('invalid project') ||
    message.includes('missing project') ||
    errorCode.includes('project_id') ||
    errorName.includes('projectid')
  ) {
    return WalletErrorCode.INVALID_PROJECT_ID;
  }
  if (
    message.includes('network') || 
    message.includes('fetch failed') || 
    message.includes('connection failed') ||
    message.includes('cors') ||
    message.includes('unreachable') ||
    message.includes('dns') ||
    errorCode.includes('network') ||
    errorName.includes('network')
  ) {
    return WalletErrorCode.NETWORK_ERROR;
  }
  
  // Erreurs de session - Enhanced detection
  if (
    message.includes('session expired') || 
    message.includes('expired session') ||
    message.includes('session timeout') ||
    errorCode.includes('session_expired') ||
    errorName.includes('sessionexpired')
  ) {
    return WalletErrorCode.SESSION_EXPIRED;
  }
  if (
    message.includes('session not found') || 
    message.includes('no session') || 
    message.includes('missing session') ||
    message.includes('session unavailable') ||
    errorCode.includes('session_not_found') ||
    errorName.includes('sessionnotfound')
  ) {
    return WalletErrorCode.SESSION_NOT_FOUND;
  }
  if (
    message.includes('invalid session') || 
    message.includes('session invalid') ||
    message.includes('malformed session') ||
    errorCode.includes('invalid_session') ||
    errorName.includes('invalidsession')
  ) {
    return WalletErrorCode.INVALID_SESSION;
  }
  
  // Erreurs de transaction - Enhanced detection
  if (
    message.includes('transaction rejected') || 
    message.includes('user rejected transaction') ||
    message.includes('signing rejected') ||
    message.includes('message rejected') ||
    errorCode.includes('transaction_rejected') ||
    errorName.includes('transactionrejected')
  ) {
    return WalletErrorCode.TRANSACTION_REJECTED;
  }
  if (
    message.includes('transaction failed') || 
    message.includes('failed to execute') ||
    message.includes('signing failed') ||
    message.includes('execution failed') ||
    errorCode.includes('transaction_failed') ||
    errorName.includes('transactionfailed')
  ) {
    return WalletErrorCode.TRANSACTION_FAILED;
  }
  if (
    message.includes('invalid transaction') || 
    message.includes('malformed transaction') ||
    message.includes('bad transaction') ||
    message.includes('transaction format') ||
    errorCode.includes('invalid_transaction') ||
    errorName.includes('invalidtransaction')
  ) {
    return WalletErrorCode.INVALID_TRANSACTION;
  }
  if (
    message.includes('insufficient') || 
    message.includes('not enough balance') ||
    message.includes('balance too low') ||
    message.includes('insufficient funds') ||
    errorCode.includes('insufficient_balance') ||
    errorName.includes('insufficientbalance')
  ) {
    return WalletErrorCode.INSUFFICIENT_BALANCE;
  }
  
  // Erreurs générales - Enhanced detection
  if (
    message.includes('not connected') || 
    message.includes('no connection') ||
    message.includes('disconnected') ||
    message.includes('connection lost') ||
    errorCode.includes('not_connected') ||
    errorName.includes('notconnected')
  ) {
    return WalletErrorCode.NOT_CONNECTED;
  }
  if (
    message.includes('initialization failed') || 
    message.includes('failed to initialize') ||
    message.includes('init failed') ||
    message.includes('setup failed') ||
    errorCode.includes('initialization_failed') ||
    errorName.includes('initializationfailed')
  ) {
    return WalletErrorCode.INITIALIZATION_FAILED;
  }
  
  // Erreurs v1 (legacy) - Keep existing patterns
  if (message.includes("can't convert undefined to object")) {
    return WalletErrorCode.WALLETCONNECT_CONFIG_ERROR;
  }
  if (message.includes('getrecomendedwallets')) {
    return WalletErrorCode.RECOMMENDED_WALLETS_ERROR;
  }
  if (message.includes('explorerctrl')) {
    return WalletErrorCode.EXPLORER_CTRL_ERROR;
  }
  
  return WalletErrorCode.UNKNOWN_ERROR;
}

/**
 * Gère les erreurs du wallet et retourne une WalletError standardisée
 */
export function handleWalletError(error: unknown): WalletError {
  console.error('Wallet error:', error);

  // Si c'est déjà une WalletError, la retourner telle quelle
  if (error instanceof WalletError) {
    return error;
  }

  // Si c'est une Error standard
  if (error instanceof Error) {
    const errorCode = detectErrorCode(error);
    const errorMessage = ERROR_MESSAGES[errorCode];
    
    return new WalletError(errorMessage, errorCode, error);
  }

  // Erreur inconnue
  return new WalletError(
    ERROR_MESSAGES[WalletErrorCode.UNKNOWN_ERROR],
    WalletErrorCode.UNKNOWN_ERROR,
    error
  );
}

// Fonction pour supprimer les erreurs de console
export function suppressWalletConnectErrors() {
  if (typeof window !== 'undefined') {
    // Supprimer les erreurs non capturées (unhandled promise rejections)
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || String(event.reason);
      if (
        message.includes('Proposal expired') ||
        message.includes('No matching key') ||
        message.includes('proposal:')
      ) {
        event.preventDefault(); // Empêcher l'affichage dans la console
      }
    });
    
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      try {
        // Si aucun argument, ignorer
        if (!args || args.length === 0) {
          return;
        }

        // Ignorer les objets vides
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
          try {
            const keys = Object.keys(args[0]);
            if (keys.length === 0) {
              return;
            }
          } catch {
            // Si on ne peut pas obtenir les clés, ignorer
            return;
          }
        }
        
        // Ignorer les objets vides/arguments vides
        try {
          const allEmpty = args.every(arg => {
            if (arg === null || arg === undefined) return true;
            if (typeof arg === 'object') {
              try {
                return Object.keys(arg).length === 0;
              } catch {
                return false;
              }
            }
            const s = String(arg).trim();
            return s === '' || s === '{}';
          });
          if (allEmpty) {
            return;
          }
        } catch {}

        // Convertir les args en string de manière sûre
        const message = args.map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg === null || arg === undefined) return '';
          try {
            if (typeof arg === 'object') {
              return JSON.stringify(arg);
            }
            return String(arg);
          } catch {
            return '';
          }
        }).join(' ');
        
        // Supprimer les erreurs connues de WalletConnect et Supabase Auth
        if (
          message && (
            message.includes("can't convert undefined to object") ||
            message.includes('getRecomendedWallets') ||
            message.includes('ExplorerCtrl') ||
            message.includes('__cf_bm') ||
            message.includes('websocketTypeError') ||
            message.includes('React Error Boundary') ||
            message.includes('AuthSessionMissingError') ||
            message.includes('Auth session missing') ||
            message.includes('No matching key') ||
            message.includes('proposal:') ||
            message.includes('Proposal expired') ||
            message.includes('Failed to connect to wallet') ||
            message === '{}' ||
            message === '[]' // Ignorer les collections vides
          )
        ) {
          return;
        }
        
        // Ne pas afficher si le message est vide ou juste des espaces
        if (!message.trim()) {
          return;
        }
        
        originalError.apply(console, args);
      } catch {
        // En cas d'erreur dans le gestionnaire, vérifier si c'est une erreur à supprimer
        try {
          const message = args.map(arg => {
            if (typeof arg === 'string') return arg;
            return '';
          }).join(' ');
          
          // Ne pas afficher les erreurs WalletConnect même en cas d'erreur de traitement
          if (
            message.includes('No matching key') ||
            message.includes('proposal:') ||
            message.includes('Proposal expired') ||
            message.includes('Failed to connect')
          ) {
            return;
          }
        } catch {
          // Ignorer silencieusement
          return;
        }
        
        // Seulement afficher si ce n'est pas une erreur connue
        try {
          originalError.apply(console, args);
        } catch {
          // Si même l'appel original échoue, ignorer silencieusement
        }
      }
    };
  }
}