'use client';

import { useState, useEffect } from 'react';
import { useOfflineStorage } from '@/lib/utils/offline-storage';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const { syncPendingData } = useOfflineStorage();

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      
      // Sync any pending offline data when coming back online
      try {
        await syncPendingData();
      } catch (error) {
        console.error('Failed to sync offline data:', error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingData]);

  return {
    isOnline,
    isOffline: !isOnline
  };
}