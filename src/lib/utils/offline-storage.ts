// Offline storage utilities for PWA functionality

interface OfflineData {
  id: string;
  type: 'evaluation' | 'loan_request' | 'profile_update';
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'mazaochain-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for offline data
        if (!db.objectStoreNames.contains('offline_data')) {
          const store = db.createObjectStore('offline_data', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async saveOfflineData(type: OfflineData['type'], data: Record<string, unknown>): Promise<string> {
    if (!this.db) await this.init();

    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData: OfflineData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const request = store.add(offlineData);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedData(): Promise<OfflineData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Hook for using offline storage in React components
export function useOfflineStorage() {
  const saveForLater = async (type: OfflineData['type'], data: Record<string, unknown>) => {
    try {
      const id = await offlineStorage.saveOfflineData(type, data);
      console.log(`Data saved offline with ID: ${id}`);
      
      // Register background sync if supported
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is supported
        if ('sync' in registration) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (registration as any).sync.register('sync-offline-data');
            console.log('Background sync registered for offline data');
          } catch (error) {
            console.warn('Background sync registration failed:', error);
          }
        }
      }
      
      return id;
    } catch (error) {
      console.error('Failed to save data offline:', error);
      throw error;
    }
  };

  const syncPendingData = async () => {
    try {
      const unsyncedData = await offlineStorage.getUnsyncedData();
      
      if (unsyncedData.length === 0) {
        console.log('No offline data to sync');
        return { synced: 0, failed: 0 };
      }
      
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const item of unsyncedData) {
        try {
          // Determine the API endpoint based on item type
          let endpoint = '';
          switch (item.type) {
            case 'evaluation':
              endpoint = '/api/crop-evaluations';
              break;
            case 'loan_request':
              endpoint = '/api/loans';
              break;
            case 'profile_update':
              endpoint = '/api/profile';
              break;
            default:
              console.warn(`Unknown item type: ${item.type}`);
              failedCount++;
              continue;
          }
          
          // Attempt to sync the data
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data)
          });
          
          if (response.ok) {
            await offlineStorage.markAsSynced(item.id);
            syncedCount++;
            console.log(`Synced offline data: ${item.id}`);
          } else {
            failedCount++;
            console.error(`Failed to sync item ${item.id}: ${response.status}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      // Clean up synced data
      await offlineStorage.clearSyncedData();
      
      console.log(`Sync complete: ${syncedCount} synced, ${failedCount} failed`);
      return { synced: syncedCount, failed: failedCount };
    } catch (error) {
      console.error('Failed to sync pending data:', error);
      throw error;
    }
  };

  const getPendingCount = async () => {
    try {
      const unsyncedData = await offlineStorage.getUnsyncedData();
      return unsyncedData.length;
    } catch (error) {
      console.error('Failed to get pending count:', error);
      return 0;
    }
  };

  return {
    saveForLater,
    syncPendingData,
    getPendingCount
  };
}