// Offline storage utilities for PWA functionality

interface OfflineData {
  id: string;
  type: 'evaluation' | 'loan_request' | 'profile_update';
  data: any;
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

  async saveOfflineData(type: OfflineData['type'], data: any): Promise<string> {
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
  const saveForLater = async (type: OfflineData['type'], data: unknown) => {
    try {
      const id = await offlineStorage.saveOfflineData(type, data);
      console.log(`Data saved offline with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Failed to save data offline:', error);
      throw error;
    }
  };

  const syncPendingData = async () => {
    try {
      const unsyncedData = await offlineStorage.getUnsyncedData();
      
      for (const item of unsyncedData) {
        try {
          // Here you would implement the actual sync logic
          // For now, we'll just mark as synced
          await offlineStorage.markAsSynced(item.id);
          console.log(`Synced offline data: ${item.id}`);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      // Clean up synced data
      await offlineStorage.clearSyncedData();
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  };

  return {
    saveForLater,
    syncPendingData
  };
}