import { describe, it, expect } from 'vitest';
import enMessages from '../../../messages/en.json';
import frMessages from '../../../messages/fr.json';
import lnMessages from '../../../messages/ln.json';

describe('Translation Files', () => {
  describe('Structure Consistency', () => {
    it('should have the same top-level keys in all languages', () => {
      const enKeys = Object.keys(enMessages).sort();
      const frKeys = Object.keys(frMessages).sort();
      const lnKeys = Object.keys(lnMessages).sort();

      expect(frKeys).toEqual(enKeys);
      expect(lnKeys).toEqual(enKeys);
    });

    it('should have the same nested keys in common section', () => {
      const enCommonKeys = Object.keys(enMessages.common).sort();
      const frCommonKeys = Object.keys(frMessages.common).sort();
      const lnCommonKeys = Object.keys(lnMessages.common).sort();

      expect(frCommonKeys).toEqual(enCommonKeys);
      expect(lnCommonKeys).toEqual(enCommonKeys);
    });

    it('should have the same nested keys in navigation section', () => {
      const enNavKeys = Object.keys(enMessages.navigation).sort();
      const frNavKeys = Object.keys(frMessages.navigation).sort();
      const lnNavKeys = Object.keys(lnMessages.navigation).sort();

      expect(frNavKeys).toEqual(enNavKeys);
      expect(lnNavKeys).toEqual(enNavKeys);
    });

    it('should have the same nested keys in auth section', () => {
      const enAuthKeys = Object.keys(enMessages.auth).sort();
      const frAuthKeys = Object.keys(frMessages.auth).sort();
      const lnAuthKeys = Object.keys(lnMessages.auth).sort();

      expect(frAuthKeys).toEqual(enAuthKeys);
      expect(lnAuthKeys).toEqual(enAuthKeys);
    });

    it('should have the same nested keys in errors section', () => {
      const enErrorKeys = Object.keys(enMessages.errors).sort();
      const frErrorKeys = Object.keys(frMessages.errors).sort();
      const lnErrorKeys = Object.keys(lnMessages.errors).sort();

      expect(frErrorKeys).toEqual(enErrorKeys);
      expect(lnErrorKeys).toEqual(enErrorKeys);
    });
  });

  describe('Translation Completeness', () => {
    it('should not have empty string values in French', () => {
      const checkForEmptyStrings = (obj: any, path = ''): string[] => {
        const emptyKeys: string[] = [];
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string' && value.trim() === '') {
            emptyKeys.push(currentPath);
          } else if (typeof value === 'object' && value !== null) {
            emptyKeys.push(...checkForEmptyStrings(value, currentPath));
          }
        }
        return emptyKeys;
      };

      const emptyKeys = checkForEmptyStrings(frMessages);
      expect(emptyKeys).toEqual([]);
    });

    it('should not have empty string values in Lingala', () => {
      const checkForEmptyStrings = (obj: any, path = ''): string[] => {
        const emptyKeys: string[] = [];
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string' && value.trim() === '') {
            emptyKeys.push(currentPath);
          } else if (typeof value === 'object' && value !== null) {
            emptyKeys.push(...checkForEmptyStrings(value, currentPath));
          }
        }
        return emptyKeys;
      };

      const emptyKeys = checkForEmptyStrings(lnMessages);
      expect(emptyKeys).toEqual([]);
    });

    it('should have all required error message keys', () => {
      const requiredErrorKeys = [
        'generic',
        'networkError',
        'validationError',
        'insufficientFunds',
        'walletNotConnected',
        'transactionFailed',
        'userRejected',
        'contractError',
        'loadingError',
        'unauthorized',
        'notFound',
        'serverError'
      ];

      const frErrorKeys = Object.keys(frMessages.errors);
      const lnErrorKeys = Object.keys(lnMessages.errors);

      requiredErrorKeys.forEach(key => {
        expect(frErrorKeys).toContain(key);
        expect(lnErrorKeys).toContain(key);
      });
    });
  });

  describe('Key Format Validation', () => {
    it('should use camelCase for all keys', () => {
      const checkCamelCase = (obj: any, path = ''): string[] => {
        const invalidKeys: string[] = [];
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          // Check if key is camelCase (starts with lowercase, no underscores or hyphens)
          if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
            invalidKeys.push(currentPath);
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            invalidKeys.push(...checkCamelCase(value, currentPath));
          }
        }
        return invalidKeys;
      };

      const enInvalidKeys = checkCamelCase(enMessages);
      const frInvalidKeys = checkCamelCase(frMessages);
      const lnInvalidKeys = checkCamelCase(lnMessages);

      expect(enInvalidKeys).toEqual([]);
      expect(frInvalidKeys).toEqual([]);
      expect(lnInvalidKeys).toEqual([]);
    });
  });

  describe('Specific Translation Checks', () => {
    it('should have wallet translations in all languages', () => {
      expect(enMessages.wallet).toBeDefined();
      expect(frMessages.wallet).toBeDefined();
      expect(lnMessages.wallet).toBeDefined();

      expect(enMessages.wallet.connect).toBeDefined();
      expect(frMessages.wallet.connect).toBeDefined();
      expect(lnMessages.wallet.connect).toBeDefined();
    });

    it('should have loan translations in all languages', () => {
      expect(enMessages.loan).toBeDefined();
      expect(frMessages.loan).toBeDefined();
      expect(lnMessages.loan).toBeDefined();

      expect(enMessages.loan.request).toBeDefined();
      expect(frMessages.loan.request).toBeDefined();
      expect(lnMessages.loan.request).toBeDefined();
    });

    it('should have farmer dashboard translations in all languages', () => {
      expect(enMessages.farmer.dashboard).toBeDefined();
      expect(frMessages.farmer.dashboard).toBeDefined();
      expect(lnMessages.farmer.dashboard).toBeDefined();

      expect(enMessages.farmer.dashboard.title).toBeDefined();
      expect(frMessages.farmer.dashboard.title).toBeDefined();
      expect(lnMessages.farmer.dashboard.title).toBeDefined();
    });

    it('should have cooperative dashboard translations in all languages', () => {
      expect(enMessages.cooperative.dashboard).toBeDefined();
      expect(frMessages.cooperative.dashboard).toBeDefined();
      expect(lnMessages.cooperative.dashboard).toBeDefined();
    });

    it('should have lender dashboard translations in all languages', () => {
      expect(enMessages.lender.dashboard).toBeDefined();
      expect(frMessages.lender.dashboard).toBeDefined();
      expect(lnMessages.lender.dashboard).toBeDefined();
    });
  });
});
