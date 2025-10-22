// Hedera SDK wrapper to avoid build-time issues
// This module provides safe imports of Hedera SDK components

// Polyfills will be loaded dynamically when needed

export async function getHederaSDK() {
  // Only load SDK in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Hedera SDK not available during server-side rendering');
  }

  try {
    // Ensure polyfills are loaded first
    const { setupHederaPolyfills } = await import('@/lib/hedera-polyfills');
    await setupHederaPolyfills();
    
    // Small delay to ensure polyfills are fully applied
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const sdk = await import('@hashgraph/sdk');
    return sdk;
  } catch (error) {
    console.error('Failed to import Hedera SDK:', error);
    throw new Error('Hedera SDK not available');
  }
}

export async function createAccountId(accountIdStr: string) {
  const { AccountId } = await getHederaSDK();
  return AccountId.fromString(accountIdStr);
}

export async function getLedgerId(network: 'mainnet' | 'testnet') {
  const { LedgerId } = await getHederaSDK();
  return network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
}

export async function createClient(network: 'mainnet' | 'testnet') {
  const { Client } = await getHederaSDK();
  return network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
}