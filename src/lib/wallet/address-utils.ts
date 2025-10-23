/**
 * Utility functions for handling Hedera and EVM address formats
 */

export interface AddressInfo {
  original: string;
  type: 'hedera' | 'evm' | 'walletconnect' | 'unknown';
  hederaAccountId?: string;
  evmAddress?: string;
  chainId?: string;
  network?: 'mainnet' | 'testnet';
}

/**
 * Analyze an address and extract information about its format
 */
export function analyzeAddress(address: string): AddressInfo {
  const info: AddressInfo = {
    original: address,
    type: 'unknown',
  };

  // Hedera account ID format (0.0.xxxxx)
  if (address.match(/^\d+\.\d+\.\d+$/)) {
    info.type = 'hedera';
    info.hederaAccountId = address;
    return info;
  }

  // EVM address format (0x...)
  if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
    info.type = 'evm';
    info.evmAddress = address;
    return info;
  }

  // WalletConnect format (namespace:network:address)
  if (address.includes(':')) {
    const parts = address.split(':');
    if (parts.length >= 2) {
      const namespace = parts[0];
      const networkOrChainId = parts[1];
      
      if (parts.length >= 3) {
        // Full format: namespace:network:address
        info.type = 'walletconnect';
        const accountAddress = parts[2];

        if (namespace === 'hedera') {
          info.hederaAccountId = accountAddress;
          info.network = networkOrChainId as 'mainnet' | 'testnet';
          info.chainId = `hedera:${networkOrChainId}`;
        } else if (namespace === 'eip155') {
          info.evmAddress = accountAddress;
          info.network = networkOrChainId === '295' ? 'mainnet' : 'testnet';
          info.chainId = `eip155:${networkOrChainId}`;
        }
      } else if (parts.length === 2 && namespace === 'eip155') {
        // Incomplete EVM format: eip155:chainId (missing address)
        info.type = 'walletconnect';
        info.network = networkOrChainId === '295' ? 'mainnet' : 'testnet';
        info.chainId = `eip155:${networkOrChainId}`;
        // No address available - this is an incomplete/invalid state
      }
    }
  }

  return info;
}

/**
 * Extract Hedera account ID from various address formats
 */
export function extractHederaAccountId(address: string): string | null {
  const info = analyzeAddress(address);
  return info.hederaAccountId || null;
}

/**
 * Extract EVM address from various address formats
 */
export function extractEvmAddress(address: string): string | null {
  const info = analyzeAddress(address);
  return info.evmAddress || null;
}

/**
 * Check if an address is valid for Hedera Mirror Node API
 */
export function isValidForMirrorNode(address: string): boolean {
  const hederaAccountId = extractHederaAccountId(address);
  return hederaAccountId !== null && hederaAccountId.match(/^\d+\.\d+\.\d+$/) !== null;
}

/**
 * Format address for display purposes
 */
export function formatAddressForDisplay(address: string, maxLength: number = 20): string {
  if (address.length <= maxLength) {
    return address;
  }

  const info = analyzeAddress(address);
  
  if (info.type === 'hedera' && info.hederaAccountId) {
    // For Hedera addresses, show full account ID if short enough
    if (info.hederaAccountId.length <= maxLength) {
      return info.hederaAccountId;
    }
  }

  if (info.type === 'evm' && info.evmAddress) {
    // For EVM addresses, show first 6 and last 4 characters
    return `${info.evmAddress.slice(0, 6)}...${info.evmAddress.slice(-4)}`;
  }

  // Fallback: truncate in the middle
  const start = Math.floor((maxLength - 3) / 2);
  const end = maxLength - 3 - start;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Debug function to log address information
 */
export function debugAddress(address: string, context: string = ''): void {
  const info = analyzeAddress(address);
  console.log(`[Address Debug${context ? ` - ${context}` : ''}]:`, {
    original: info.original,
    type: info.type,
    hederaAccountId: info.hederaAccountId,
    evmAddress: info.evmAddress,
    chainId: info.chainId,
    network: info.network,
    validForMirrorNode: isValidForMirrorNode(address),
  });
}