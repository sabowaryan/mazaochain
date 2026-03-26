'use client';

// This module is loaded exclusively in the browser (via next/dynamic ssr:false in
// AppKitWalletButton.tsx). Importing from @reown/appkit/react here is safe because
// the module is never evaluated during server-side rendering.
import { useAppKit } from '@reown/appkit/react';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import {
  WalletIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  WalletIcon as WalletIconSolid
} from '@heroicons/react/24/solid';

interface AppKitWalletButtonReadyProps {
  variant?: 'connect' | 'account' | 'network';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

// By the time this component mounts, walletService.initialize() has completed
// (the parent waits for !isRestoring before rendering this). createAppKit() is
// called inside initialize(), so useAppKit() is guaranteed to be safe here.
export default function AppKitWalletButtonReady({
  variant = 'connect',
  size = 'md',
  className = '',
  showLabel = true
}: AppKitWalletButtonReadyProps) {
  const { open } = useAppKit();
  const { isConnected, isConnecting, connection, connectWallet } = useWallet();
  const { triggerHaptic } = useHapticFeedback();

  const handleConnectClick = async () => {
    triggerHaptic('medium');
    // connectWallet opens the AppKit modal and sets isConnecting; subscribeAccount
    // and subscribeState handle the state update when the user completes the flow
    await connectWallet('hedera');
  };

  const handleAccountClick = async () => {
    triggerHaptic('light');
    // Open AppKit modal via useAppKit hook for account management view
    await open();
  };

  const handleNetworkClick = async () => {
    triggerHaptic('light');
    // Open AppKit modal via useAppKit hook for network switching
    await open();
  };

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default:   return 'px-4 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default:   return 'w-5 h-5';
    }
  };

  // Connect button for non-connected state
  if (!isConnected && variant === 'connect') {
    return (
      <Button
        onClick={handleConnectClick}
        disabled={isConnecting}
        className={`${getSizeClasses()} bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${className}`}
      >
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <div className={`${getIconSize()} animate-spin rounded-full border-2 border-white border-t-transparent`} />
          ) : (
            <WalletIconSolid className={getIconSize()} />
          )}
          {showLabel && (
            <span>{isConnecting ? 'Connexion...' : 'Connecter Wallet'}</span>
          )}
        </div>
      </Button>
    );
  }

  // Account button for connected state
  if (isConnected && variant === 'account') {
    return (
      <Button
        onClick={handleAccountClick}
        variant="outline"
        className={`${getSizeClasses()} border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-3 h-3 text-white" />
          </div>
          {showLabel && connection?.accountId && (
            <span className="font-mono">{formatAccountId(connection.accountId)}</span>
          )}
          <Cog6ToothIcon className="w-4 h-4 opacity-60" />
        </div>
      </Button>
    );
  }

  // Network button
  if (variant === 'network') {
    return (
      <Button
        onClick={handleNetworkClick}
        variant="outline"
        size="sm"
        className={`border-gray-200 text-gray-600 hover:bg-gray-50 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connection?.network === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          {showLabel && (
            <span className="text-xs">
              {connection?.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </span>
          )}
        </div>
      </Button>
    );
  }

  // Default fallback
  return (
    <Button
      onClick={isConnected ? handleAccountClick : handleConnectClick}
      disabled={isConnecting}
      className={`${getSizeClasses()} ${className}`}
    >
      <div className="flex items-center gap-2">
        <WalletIcon className={getIconSize()} />
        {showLabel && (
          <span>{isConnected ? 'Compte' : 'Connecter'}</span>
        )}
      </div>
    </Button>
  );
}
