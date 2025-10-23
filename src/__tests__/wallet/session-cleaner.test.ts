/**
 * Session cleaner tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  cleanInvalidSessions, 
  cleanAllWalletData, 
  getSessionInfo 
} from '@/lib/wallet/session-cleaner';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Session Cleaner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('cleanInvalidSessions', () => {
    it('should not clean when no session exists', () => {
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(false);
      expect(result.reason).toBe('No session found');
    });

    it('should clean session with missing accountId', () => {
      const invalidSession = {
        network: 'testnet',
        timestamp: Date.now()
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(invalidSession));
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toBe('Missing accountId');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });

    it('should clean session with invalid eip155 chain ID as accountId', () => {
      const invalidSession = {
        accountId: 'eip155:295',
        network: 'testnet',
        timestamp: Date.now()
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(invalidSession));
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toContain('Invalid address format: eip155:295');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });

    it('should clean session with hedera namespace without address', () => {
      const invalidSession = {
        accountId: 'hedera:testnet',
        network: 'testnet',
        timestamp: Date.now()
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(invalidSession));
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toContain('Invalid address format: hedera:testnet');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });

    it('should clean expired session', () => {
      const expiredSession = {
        accountId: '0.0.123456',
        network: 'testnet',
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(expiredSession));
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toBe('Session expired');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });

    it('should not clean valid Hedera session', () => {
      const validSession = {
        accountId: '0.0.123456',
        network: 'testnet',
        namespace: 'hedera',
        chainId: 'hedera:testnet',
        timestamp: Date.now()
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(validSession));
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(false);
      expect(result.reason).toBe('Session is valid');
      expect(localStorage.getItem('hedera_wallet_session')).not.toBeNull();
    });

    it('should clean malformed JSON session', () => {
      localStorage.setItem('hedera_wallet_session', 'invalid-json{');
      
      const result = cleanInvalidSessions();
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toContain('Parse error');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });
  });

  describe('cleanAllWalletData', () => {
    it('should clean all wallet-related localStorage keys', () => {
      // Set up various wallet-related keys
      localStorage.setItem('hedera_wallet_session', 'test');
      localStorage.setItem('wallet_connection_state', 'test');
      localStorage.setItem('appkit_session', 'test');
      localStorage.setItem('wc@2:client:0.3//session', 'test');
      localStorage.setItem('wc@2:core:0.3//keychain', 'test');
      localStorage.setItem('some_other_key', 'test');
      
      const cleanedKeys = cleanAllWalletData();
      
      expect(cleanedKeys).toContain('hedera_wallet_session');
      expect(cleanedKeys).toContain('wallet_connection_state');
      expect(cleanedKeys).toContain('appkit_session');
      expect(cleanedKeys).toContain('wc@2:client:0.3//session');
      expect(cleanedKeys).toContain('wc@2:core:0.3//keychain');
      expect(cleanedKeys).not.toContain('some_other_key');
      
      // Verify keys are actually removed
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
      expect(localStorage.getItem('wallet_connection_state')).toBeNull();
      expect(localStorage.getItem('appkit_session')).toBeNull();
      expect(localStorage.getItem('some_other_key')).toBe('test'); // Should remain
    });
  });

  describe('getSessionInfo', () => {
    it('should return null when no session exists', () => {
      const info = getSessionInfo();
      expect(info).toBeNull();
    });

    it('should return session info with analysis', () => {
      const session = {
        accountId: '0.0.123456',
        network: 'testnet',
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(session));
      
      const info = getSessionInfo();
      
      expect(info.session).toEqual(session);
      expect(info.addressInfo).toBeDefined();
      expect(info.isValidForMirrorNode).toBe(true);
      expect(info.age).toBeGreaterThan(0);
      expect(info.ageHours).toBeCloseTo(2, 0);
    });

    it('should handle malformed session gracefully', () => {
      localStorage.setItem('hedera_wallet_session', 'invalid-json');
      
      const info = getSessionInfo();
      
      expect(info.error).toBeDefined();
    });
  });

  describe('Real-world cleanup scenarios', () => {
    it('should clean the problematic eip155:295 session', () => {
      // This is the exact problematic session from the logs
      const problematicSession = {
        accountId: 'eip155:295',
        network: 'testnet',
        namespace: 'eip155',
        chainId: 'eip155:295',
        timestamp: Date.now()
      };
      
      localStorage.setItem('hedera_wallet_session', JSON.stringify(problematicSession));
      
      console.log('Before cleanup - Session info:', getSessionInfo());
      
      const result = cleanInvalidSessions();
      
      console.log('Cleanup result:', result);
      console.log('After cleanup - Session info:', getSessionInfo());
      
      expect(result.cleaned).toBe(true);
      expect(result.reason).toContain('eip155:295');
      expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
    });

    it('should clean multiple invalid session formats', () => {
      const invalidSessions = [
        'eip155:295',
        'eip155:296', 
        'hedera:testnet',
        'hedera:mainnet',
        '',
        'invalid-format'
      ];

      invalidSessions.forEach((accountId, index) => {
        localStorage.clear();
        
        const session = {
          accountId,
          network: 'testnet',
          timestamp: Date.now()
        };
        
        localStorage.setItem('hedera_wallet_session', JSON.stringify(session));
        
        const result = cleanInvalidSessions();
        
        console.log(`Testing invalid session ${index + 1}:`, { accountId, result });
        
        expect(result.cleaned).toBe(true);
        expect(localStorage.getItem('hedera_wallet_session')).toBeNull();
      });
    });
  });
});