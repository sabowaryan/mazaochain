'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOfflineStorage } from '@/lib/utils/offline-storage';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { syncPendingData, getPendingCount } = useOfflineStorage();

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, [getPendingCount]);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) {
      return { success: false, message: 'Cannot sync while offline or already syncing' };
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingData();
      await updatePendingCount();
      
      return {
        success: true,
        synced: result.synced,
        failed: result.failed,
        message: `Synced ${result.synced} items${result.failed > 0 ? `, ${result.failed} failed` : ''}`
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncPendingData, updatePendingCount]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      updatePendingCount();
      
      // Auto-sync when coming back online
      const syncTimeout = setTimeout(() => {
        handleSync();
      }, 2000); // Wait 2 seconds before syncing

      return () => clearTimeout(syncTimeout);
    }
  }, [isOnline, updatePendingCount, handleSync]);

  // Listen for sync complete messages from service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          console.log('Sync completed by service worker');
          updatePendingCount();
          setIsSyncing(false);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [updatePendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    handleSync,
    updatePendingCount
  };
}
