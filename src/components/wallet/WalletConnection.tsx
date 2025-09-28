// Wallet connection component
'use client';

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface WalletConnectionProps {
  showBalances?: boolean;
  className?: string;
}

export function WalletConnection({ showBalances = true, className = '' }: WalletConnectionProps) {
  const {
    isConnected,
    isConnecting,
    connection,
    balances,
    isLoadingBalances,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    error,
    clearError,
  } = useWallet();

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  };

  const formatBalance = (balance: string, decimals: number = 8) => {
    const num = parseFloat(balance);
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };

  if (error) {
    return (
      <Card className={`p-4 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-800">Erreur de portefeuille</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <Button
            onClick={clearError}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            Fermer
          </Button>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connecter HashPack
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Connectez votre portefeuille HashPack pour accéder aux fonctionnalités blockchain
          </p>
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? 'Connexion...' : 'Connecter HashPack'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Portefeuille connecté
            </h3>
            <p className="text-sm text-gray-600">
              {connection?.accountId ? formatAccountId(connection.accountId) : 'N/A'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={refreshBalances}
              disabled={isLoadingBalances}
              variant="outline"
              size="sm"
            >
              {isLoadingBalances ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button
              onClick={disconnectWallet}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Déconnecter
            </Button>
          </div>
        </div>

        {/* Balances */}
        {showBalances && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Soldes</h4>
            
            {isLoadingBalances ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Chargement des soldes...</p>
              </div>
            ) : balances ? (
              <div className="space-y-2">
                {/* HBAR Balance */}
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">HBAR</span>
                  <span className="text-sm text-gray-900">
                    {formatBalance(balances.hbar)} HBAR
                  </span>
                </div>

                {/* Token Balances */}
                {balances.tokens.map((token) => (
                  <div key={token.tokenId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{token.symbol}</span>
                      <p className="text-xs text-gray-500">{token.name}</p>
                    </div>
                    <span className="text-sm text-gray-900">
                      {formatBalance(token.balance, token.decimals)} {token.symbol}
                    </span>
                  </div>
                ))}

                {balances.tokens.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">Aucun token trouvé</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Impossible de charger les soldes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}