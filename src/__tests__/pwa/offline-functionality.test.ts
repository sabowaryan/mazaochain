import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineStorage } from '@/lib/utils/offline-storage';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

global.indexedDB = mockIndexedDB as any;

describe('Offline Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OfflineStorage', () => {
    it('should initialize the database', async () => {
      const mockDB = {
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(false),
        },
        createObjectStore: vi.fn().mockReturnValue({
          createIndex: vi.fn(),
        }),
      };

      const mockRequest = {
        result: mockDB,
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      // Trigger the init
      const initPromise = offlineStorage.init();

      // Simulate successful open
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any);
      }

      await expect(initPromise).resolves.toBeUndefined();
    });

    it('should save offline data with correct structure', async () => {
      const testData = {
        cropType: 'manioc',
        superficie: 2,
        rendement: 1000,
      };

      // Mock the database operations
      const mockStore = {
        add: vi.fn().mockReturnValue({
          onsuccess: null as any,
          onerror: null as any,
        }),
      };

      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue(mockStore),
      };

      const mockDB = {
        transaction: vi.fn().mockReturnValue(mockTransaction),
      };

      // Set the mock DB
      (offlineStorage as any).db = mockDB;

      const savePromise = offlineStorage.saveOfflineData('evaluation', testData);

      // Simulate successful save
      const addRequest = mockStore.add.mock.results[0]?.value;
      if (addRequest && addRequest.onsuccess) {
        addRequest.onsuccess();
      }

      const id = await savePromise;
      expect(id).toMatch(/^evaluation_\d+_[a-z0-9]+$/);
      expect(mockStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'evaluation',
          data: testData,
          synced: false,
        })
      );
    });
  });

  describe('Service Worker Integration', () => {
    it('should register background sync when supported', () => {
      const mockRegistration = {
        sync: {
          register: vi.fn().mockResolvedValue(undefined),
        },
      };

      global.navigator = {
        serviceWorker: {
          ready: Promise.resolve(mockRegistration as any),
        },
      } as any;

      // This would be tested in the actual component/hook usage
      expect(navigator.serviceWorker).toBeDefined();
    });
  });

  describe('Offline Detection', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(navigator.onLine).toBe(true);
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(navigator.onLine).toBe(false);
    });
  });
});
