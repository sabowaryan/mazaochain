'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import { Button } from '@/components/ui/Button';
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface QuickDisconnectButtonProps {
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showConfirmation?: boolean;
}

export function QuickDisconnectButton({ 
  variant = 'button',
  size = 'md',
  className = '',
  showConfirmation = true
}: QuickDisconnectButtonProps) {
  const { isConnected, disconnectWallet } = useWallet();
  const { triggerHaptic } = useHapticFeedback();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnect = async () => {
    if (!isConnected) return;

    if (showConfirmation && !showConfirm) {
      setShowConfirm(true);
      triggerHaptic('light');
      return;
    }

    setIsDisconnecting(true);
    triggerHaptic('medium');

    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setIsDisconnecting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    triggerHaptic('light');
  };

  if (!isConnected) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  // Confirmation state
  if (showConfirm) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-700 font-medium">
            Confirmer ?
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1"
        >
          {isDisconnecting ? (
            <div className="w-3 h-3 animate-spin rounded-full border border-white border-t-transparent" />
          ) : (
            <CheckCircleIcon className="w-3 h-3" />
          )}
        </Button>
        <Button
          onClick={handleCancel}
          variant="outline"
          size="sm"
          className="px-2 py-1 text-xs"
        >
          ✕
        </Button>
      </div>
    );
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ${className}`}
        title="Déconnecter le wallet"
      >
        {isDisconnecting ? (
          <div className={`${getIconSize()} animate-spin rounded-full border-2 border-red-600 border-t-transparent`} />
        ) : (
          <ArrowRightOnRectangleIcon className={getIconSize()} />
        )}
      </button>
    );
  }

  // Text variant
  if (variant === 'text') {
    return (
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className={`text-red-600 hover:text-red-700 underline transition-colors ${className}`}
      >
        {isDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
      </button>
    );
  }

  // Button variant (default)
  return (
    <Button
      onClick={handleDisconnect}
      disabled={isDisconnecting}
      variant="outline"
      size={size === 'md' ? 'default' : size}
      className={`border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 ${getSizeClasses()} ${className}`}
    >
      <div className="flex items-center gap-2">
        {isDisconnecting ? (
          <div className={`${getIconSize()} animate-spin rounded-full border-2 border-red-600 border-t-transparent`} />
        ) : (
          <ArrowRightOnRectangleIcon className={getIconSize()} />
        )}
        <span>
          {isDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
        </span>
      </div>
    </Button>
  );
}