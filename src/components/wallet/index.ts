// Wallet components exports
export { WalletConnection } from './WalletConnection';
export { WalletBalance } from './WalletBalance';
export { WalletStatus } from './WalletStatus';

// Re-export types from the new service
export type { WalletConnection as WalletConnectionType, WalletBalances, TokenBalance } from '@/lib/wallet/hedera-wallet';
export { WalletTest } from './WalletTest';