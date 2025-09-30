// Gestionnaire d'erreurs pour les wallets
export class WalletError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export function handleWalletError(error: unknown): WalletError {
  console.error('Wallet error:', error);

  if (error instanceof WalletError) {
    return error;
  }

  if (error instanceof Error) {
    // Gestion spécifique des erreurs WalletConnect
    if (error.message.includes("can't convert undefined to object")) {
      return new WalletError(
        'Erreur de configuration du wallet. Veuillez vérifier votre configuration WalletConnect.',
        'WALLETCONNECT_CONFIG_ERROR',
        error
      );
    }

    if (error.message.includes('getRecomendedWallets')) {
      return new WalletError(
        'Erreur lors du chargement des wallets recommandés. Veuillez réessayer.',
        'RECOMMENDED_WALLETS_ERROR',
        error
      );
    }

    if (error.message.includes('ExplorerCtrl')) {
      return new WalletError(
        'Erreur du contrôleur d\'exploration des wallets. Veuillez rafraîchir la page.',
        'EXPLORER_CTRL_ERROR',
        error
      );
    }

    return new WalletError(error.message, 'UNKNOWN_WALLET_ERROR', error);
  }

  return new WalletError(
    'Une erreur inconnue s\'est produite avec le wallet',
    'UNKNOWN_ERROR',
    error
  );
}

// Fonction pour supprimer les erreurs de console en développement
export function suppressWalletConnectErrors() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Supprimer les erreurs connues de WalletConnect
      if (
        message.includes("can't convert undefined to object") ||
        message.includes('getRecomendedWallets') ||
        message.includes('ExplorerCtrl') ||
        message.includes('__cf_bm') ||
        message.includes('websocketTypeError')
      ) {
        return;
      }
      
      originalError.apply(console, args);
    };
  }
}