'use client';

import { useState, useEffect } from 'react';
import { hederaWalletService } from '@/lib/wallet/hedera-wallet';
import { WalletErrorBoundary } from './WalletErrorBoundary';
import { handleWalletError } from '@/lib/wallet/wallet-error-handler';

export function WalletConnectionTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'état de connexion au chargement
    const connectionState = hederaWalletService.getConnectionState();
    if (connectionState?.isConnected) {
      setIsConnected(true);
      setAccountId(connectionState.accountId);
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = await hederaWalletService.connectWallet();
      setIsConnected(connection.isConnected);
      setAccountId(connection.accountId);
    } catch (err) {
      const walletError = handleWalletError(err);
      setError(walletError.message);
      console.error('Erreur de connexion wallet:', walletError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await hederaWalletService.disconnectWallet();
      setIsConnected(false);
      setAccountId(null);
    } catch (err) {
      const walletError = handleWalletError(err);
      setError(walletError.message);
      console.error('Erreur de déconnexion wallet:', walletError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletErrorBoundary>
      <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Test de Connexion Wallet</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">État:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>

          {accountId && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Compte:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {accountId}
              </span>
            </div>
          )}

          <div className="flex space-x-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Connexion...' : 'Connecter Wallet'}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Déconnexion...' : 'Déconnecter'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-medium mb-1">Informations de débogage:</p>
          <p>• Les erreurs de console WalletConnect sont supprimées en développement</p>
          <p>• Les erreurs de source map sont filtrées automatiquement</p>
          <p>• Vérifiez que NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID est configuré</p>
        </div>
      </div>
    </WalletErrorBoundary>
  );
}