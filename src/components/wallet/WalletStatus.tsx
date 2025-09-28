// Wallet status indicator for navigation
'use client';

import { useWallet } from '@/hooks/useWallet';

export function WalletStatus() {
  const { isConnected, connection, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Connexion...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>Portefeuille déconnecté</span>
      </div>
    );
  }

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span>
        {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
      </span>
    </div>
  );
}