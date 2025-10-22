// Wallet status indicator for navigation
'use client';

import { useWallet } from '@/hooks/useWallet';
import {
  WalletIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid';

interface WalletStatusProps {
  variant?: 'compact' | 'detailed' | 'badge';
  showIcon?: boolean;
  className?: string;
}

export function WalletStatus({ 
  variant = 'compact', 
  showIcon = true, 
  className = '' 
}: WalletStatusProps) {
  const { isConnected, connection, isConnecting, namespace } = useWallet();

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  const getNetworkBadge = () => {
    if (!connection?.network) return null;
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        connection.network === 'mainnet' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {connection.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
      </span>
    );
  };

  const getNamespaceBadge = () => {
    if (!namespace) return null;
    
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        namespace === 'hedera' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {namespace === 'hedera' ? 'Native' : 'EVM'}
      </span>
    );
  };

  if (isConnecting) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcon && <ArrowPathIcon className="animate-spin h-4 w-4 text-blue-600" />}
        <span className="text-sm text-blue-600 font-medium">
          {variant === 'compact' ? 'Connexion...' : 'Connexion en cours...'}
        </span>
      </div>
    );
  }

  if (!isConnected) {
    if (variant === 'badge') {
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg ${className}`}>
          {showIcon && <XCircleIconSolid className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-medium text-red-700">Déconnecté</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcon && <XCircleIcon className="h-4 w-4 text-red-500" />}
        <span className="text-sm text-red-600 font-medium">
          {variant === 'compact' ? 'Déconnecté' : 'Portefeuille déconnecté'}
        </span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg ${className}`}>
        {showIcon && <CheckCircleIconSolid className="h-4 w-4 text-emerald-500" />}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-emerald-700">
            {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
          </span>
          <div className="flex gap-1 mt-1">
            {getNetworkBadge()}
            {getNamespaceBadge()}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showIcon && (
          <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
            <CheckCircleIconSolid className="h-5 w-5 text-emerald-600" />
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-emerald-700">
              {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
            </span>
            <ClipboardDocumentIcon className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
              onClick={() => {
                if (connection?.accountId) {
                  navigator.clipboard.writeText(connection.accountId);
                }
              }}
              title="Copier l'ID complet"
            />
          </div>
          <div className="flex gap-1 mt-1">
            {getNetworkBadge()}
            {getNamespaceBadge()}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <CheckCircleIcon className="h-4 w-4 text-emerald-500" />}
      <span className="text-sm text-emerald-600 font-medium">
        {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
      </span>
    </div>
  );
}