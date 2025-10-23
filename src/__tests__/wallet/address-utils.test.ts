/**
 * Address utilities unit tests
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeAddress,
  extractHederaAccountId,
  extractEvmAddress,
  isValidForMirrorNode,
  formatAddressForDisplay,
} from '@/lib/wallet/address-utils';

describe('Address Utils', () => {
  describe('analyzeAddress', () => {
    it('should identify Hedera account ID format', () => {
      const result = analyzeAddress('0.0.123456');
      
      expect(result.type).toBe('hedera');
      expect(result.hederaAccountId).toBe('0.0.123456');
      expect(result.original).toBe('0.0.123456');
    });

    it('should identify EVM address format', () => {
      const result = analyzeAddress('0x1234567890abcdef1234567890abcdef12345678');
      
      expect(result.type).toBe('evm');
      expect(result.evmAddress).toBe('0x1234567890abcdef1234567890abcdef12345678');
    });

    it('should identify WalletConnect Hedera format', () => {
      const result = analyzeAddress('hedera:testnet:0.0.123456');
      
      expect(result.type).toBe('walletconnect');
      expect(result.hederaAccountId).toBe('0.0.123456');
      expect(result.network).toBe('testnet');
      expect(result.chainId).toBe('hedera:testnet');
    });

    it('should identify WalletConnect EVM format', () => {
      const result = analyzeAddress('eip155:295:0x1234567890abcdef1234567890abcdef12345678');
      
      expect(result.type).toBe('walletconnect');
      expect(result.evmAddress).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.network).toBe('mainnet');
      expect(result.chainId).toBe('eip155:295');
    });

    it('should handle unknown format', () => {
      const result = analyzeAddress('invalid-address');
      
      expect(result.type).toBe('unknown');
      expect(result.hederaAccountId).toBeUndefined();
      expect(result.evmAddress).toBeUndefined();
    });

    it('should identify incomplete EVM format (chain ID only)', () => {
      const result = analyzeAddress('eip155:295');
      
      expect(result.type).toBe('walletconnect');
      expect(result.network).toBe('mainnet');
      expect(result.chainId).toBe('eip155:295');
      expect(result.evmAddress).toBeUndefined(); // No address part
    });
  });

  describe('extractHederaAccountId', () => {
    it('should extract from native Hedera format', () => {
      expect(extractHederaAccountId('0.0.123456')).toBe('0.0.123456');
    });

    it('should extract from WalletConnect Hedera format', () => {
      expect(extractHederaAccountId('hedera:testnet:0.0.123456')).toBe('0.0.123456');
    });

    it('should return null for EVM addresses', () => {
      expect(extractHederaAccountId('0x1234567890abcdef1234567890abcdef12345678')).toBeNull();
      expect(extractHederaAccountId('eip155:295:0x1234567890abcdef1234567890abcdef12345678')).toBeNull();
    });
  });

  describe('extractEvmAddress', () => {
    it('should extract from native EVM format', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(extractEvmAddress(address)).toBe(address);
    });

    it('should extract from WalletConnect EVM format', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(extractEvmAddress(`eip155:295:${address}`)).toBe(address);
    });

    it('should return null for Hedera addresses', () => {
      expect(extractEvmAddress('0.0.123456')).toBeNull();
      expect(extractEvmAddress('hedera:testnet:0.0.123456')).toBeNull();
    });
  });

  describe('isValidForMirrorNode', () => {
    it('should return true for valid Hedera account IDs', () => {
      expect(isValidForMirrorNode('0.0.123456')).toBe(true);
      expect(isValidForMirrorNode('hedera:testnet:0.0.123456')).toBe(true);
    });

    it('should return false for EVM addresses', () => {
      expect(isValidForMirrorNode('0x1234567890abcdef1234567890abcdef12345678')).toBe(false);
      expect(isValidForMirrorNode('eip155:295:0x1234567890abcdef1234567890abcdef12345678')).toBe(false);
    });

    it('should return false for invalid formats', () => {
      expect(isValidForMirrorNode('invalid-address')).toBe(false);
      expect(isValidForMirrorNode('')).toBe(false);
      expect(isValidForMirrorNode('eip155:295')).toBe(false); // Incomplete EVM format
    });
  });

  describe('formatAddressForDisplay', () => {
    it('should return full address if short enough', () => {
      expect(formatAddressForDisplay('0.0.123456', 20)).toBe('0.0.123456');
    });

    it('should truncate EVM addresses properly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const result = formatAddressForDisplay(address, 10);
      expect(result).toBe('0x1234...5678');
    });

    it('should truncate long addresses in the middle', () => {
      const address = 'very-long-address-that-needs-truncation';
      const result = formatAddressForDisplay(address, 10);
      expect(result).toMatch(/^.{3}\.\.\..*$/);
      expect(result.length).toBe(10);
    });
  });
});