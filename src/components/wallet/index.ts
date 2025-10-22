// Wallet components exports
export { WalletConnection } from './WalletConnection';
export { WalletBalance } from './WalletBalance';
export { WalletStatus } from './WalletStatus';

// Re-export types from the wallet types
export type { WalletConnection as WalletConnectionType, WalletBalances, TokenBalance } from '@/types/wallet';
export { WalletTest } from './WalletTest';