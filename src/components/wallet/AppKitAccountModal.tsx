'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';

interface AppKitAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  view?: 'Account' | 'Networks' | 'WalletConnect' | 'Help';
}

export function AppKitAccountModal({ 
  isOpen, 
  onClose, 
  view = 'Account' 
}: AppKitAccountModalProps) {
  const { isConnected } = useWallet();
  const { triggerHaptic } = useHapticFeedback();
  const [appKit, setAppKit] = useState<any>(null);

  // Load AppKit instance
  useEffect(() => {
    const loadAppKit = async () => {
      try {
        const { getWalletService } = await import('@/lib/wallet/wallet-service-factory');
        const walletService = await getWalletService();
        const appKitInstance = (walletService as any).getAppKitInstance?.();
        
        if (appKitInstance) {
          setAppKit(appKitInstance);
        }
      } catch (error) {
        console.error('Failed to load AppKit instance:', error);
      }
    };

    loadAppKit();
  }, []);

  // Open AppKit modal when isOpen changes
  useEffect(() => {
    if (!appKit || !isConnected) return;

    const openModal = async () => {
      try {
        if (isOpen) {
          triggerHaptic('light');
          // Use standard AppKit open method without view parameter
          await appKit.open();
        } else {
          await appKit.close();
        }
      } catch (error) {
        console.error('Failed to control AppKit modal:', error);
      }
    };

    openModal();
  }, [isOpen, appKit, isConnected, triggerHaptic]);

  // Listen for AppKit modal close events
  useEffect(() => {
    if (!appKit) return;

    const handleModalClose = () => {
      onClose();
    };

    // Subscribe to AppKit events
    try {
      appKit.subscribeModal?.(handleModalClose);
    } catch (error) {
      console.warn('Failed to subscribe to AppKit modal events:', error);
    }

    return () => {
      try {
        appKit.unsubscribeModal?.(handleModalClose);
      } catch (error) {
        console.warn('Failed to unsubscribe from AppKit modal events:', error);
      }
    };
  }, [appKit, onClose]);

  // This component doesn't render anything visible
  // The AppKit modal is rendered by the AppKit library itself
  return null;
}

// Hook for easier usage
export function useAppKitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'Account' | 'Networks' | 'WalletConnect' | 'Help'>('Account');

  const openModal = (modalView: typeof view = 'Account') => {
    setView(modalView);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    view,
    openModal,
    closeModal,
    AppKitModal: ({ className }: { className?: string }) => (
      <AppKitAccountModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        view={view} 
      />
    )
  };
}