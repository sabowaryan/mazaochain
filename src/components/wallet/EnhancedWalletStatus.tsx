'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppKitModal } from './AppKitAccountModal';

import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import { Button } from '@/components/ui/Button';
import {
  WalletIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  BanknotesIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  WalletIcon as WalletIconSolid
} from '@heroicons/react/24/solid';

interface EnhancedWalletStatusProps {
  variant?: 'compact' | 'detailed' | 'dropdown';
  showBalance?: boolean;
  showNetwork?: boolean;
  className?: string;
}

export function EnhancedWalletStatus({ 
  variant = 'compact',
  showBalance = false,
  showNetwork = true,
  className = '' 
}: EnhancedWalletStatusProps) {
  const { 
    isConnected, 
    isConnecting, 
    connection, 
    namespace, 
    balances, 
    disconnectWallet 
  } = useWallet();
  
  const { triggerHaptic } = useHapticFeedback();
  const { openModal, AppKitModal } = useAppKitModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('light');
  };

  const handleDisconnect = async () => {
    triggerHaptic('medium');
    setIsDropdownOpen(false);
    await disconnectWallet();
  };

  const handleOpenAccountModal = () => {
    triggerHaptic('light');
    setIsDropdownOpen(false);
    // TODO: Find correct AppKit method for account modal in documentation
    // For now, we'll handle this in the dropdown itself
    console.warn('AppKit account modal method needs to be found in documentation');
  };

  const handleOpenNetworkModal = () => {
    triggerHaptic('light');
    setIsDropdownOpen(false);
    // This might not be supported, let's use the account modal instead
    openModal('Account');
  };

  // Connecting state
  if (isConnecting) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <span className="text-sm text-emerald-600 font-medium">
          Connexion...
        </span>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <XCircleIconSolid className="w-5 h-5 text-red-500" />
        <span className="text-sm text-red-600 font-medium">
          Wallet déconnecté
        </span>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleOpenAccountModal}
          className={`flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors ${className}`}
        >
          <CheckCircleIconSolid className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">
            {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
          </span>
          {showNetwork && connection?.network && (
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
              connection.network === 'mainnet' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {connection.network === 'mainnet' ? 'Main' : 'Test'}
            </span>
          )}
        </button>
        <AppKitModal />
      </>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <>
        <div className={`flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 ${className}`}>
          <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
            <CheckCircleIconSolid className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-bold text-emerald-700">
                {connection?.accountId ? formatAccountId(connection.accountId) : 'Connecté'}
              </span>
              <button
                onClick={() => copyToClipboard(connection?.accountId || '')}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {showNetwork && connection?.network && (
                <span className={`px-2 py-0.5 font-medium rounded-full ${
                  connection.network === 'mainnet' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {connection.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </span>
              )}
              {namespace && (
                <span className={`px-2 py-0.5 font-medium rounded-full ${
                  namespace === 'hedera' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {namespace === 'hedera' ? 'Native' : 'EVM'}
                </span>
              )}
            </div>
            {showBalance && balances && (
              <div className="mt-2 text-sm">
                <span className="font-semibold text-gray-900">
                  {formatBalance(balances.hbar)} HBAR
                </span>
                {balances.tokens.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    +{balances.tokens.length} token(s)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            
          </div>
        </div>
        <AppKitModal />
      </>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <>
        <div className={`relative ${className}`}>
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <WalletIconSolid className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {connection?.accountId ? formatAccountId(connection.accountId) : 'Wallet'}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <WalletIconSolid className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {connection?.accountId ? formatAccountId(connection.accountId) : 'Wallet Connecté'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {connection?.network && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            connection.network === 'mainnet' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {connection.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                          </span>
                        )}
                        {namespace && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            namespace === 'hedera' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {namespace === 'hedera' ? 'Native' : 'EVM'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                {showBalance && balances && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Solde HBAR</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatBalance(balances.hbar)} HBAR
                      </span>
                    </div>
                    {balances.tokens.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          +{balances.tokens.length} autre(s) token(s)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={() => copyToClipboard(connection?.accountId || '')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copier l'adresse
                  </button>
                  
                  {/* Informations réseau */}
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 text-center">
                      Réseau: {connection?.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      Type: {namespace === 'hedera' ? 'Native' : 'EVM'}
                    </p>
                  </div>

                  {/* AppKit Account Manager */}
                
                </div>
              </div>
            </>
          )}
        </div>
        <AppKitModal />
      </>
    );
  }

  return null;
}