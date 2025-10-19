'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/components/TranslationProvider';

export function OfflineIndicator() {
  const t = useTranslations('pwa');
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verify actual connectivity by making a network request
  const verifyConnection = useCallback(async () => {
    if (!navigator.onLine) {
      return false;
    }

    setIsVerifying(true);
    try {
      // Try to fetch a small resource to verify actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    // Set initial online status and verify
    const checkInitialStatus = async () => {
      const online = await verifyConnection();
      setIsOnline(online);
      if (!online) {
        setShowOfflineMessage(true);
      }
    };
    
    checkInitialStatus();

    const handleOnline = async () => {
      // Verify actual connectivity before declaring online
      const actuallyOnline = await verifyConnection();
      setIsOnline(actuallyOnline);
      
      if (actuallyOnline) {
        setShowOfflineMessage(true); // Show "back online" message
        
        // Trigger sync of offline data
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_OFFLINE_DATA'
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check (every 30 seconds)
    const intervalId = setInterval(async () => {
      const online = await verifyConnection();
      if (online !== isOnline) {
        setIsOnline(online);
        setShowOfflineMessage(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [verifyConnection, isOnline]);

  // Auto-hide the message after 5 seconds when back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm rounded-lg shadow-lg p-3 z-50 transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          {isVerifying ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : isOnline ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {isVerifying 
              ? t('verifyingConnection') || 'Vérification de la connexion...'
              : isOnline 
                ? t('connectionRestored') || 'Connexion rétablie' 
                : t('offlineMessage')}
          </p>
        </div>
      </div>
    </div>
  );
}