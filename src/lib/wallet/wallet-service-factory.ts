"use client";

// Wallet Service Factory
// Provides a unified interface for wallet operations using HederaWalletService
// Updated to use HederaProvider + AppKit integration

import type { WalletConnection, WalletBalances } from "@/types/wallet";
// Type for Hedera SDK Transaction (to avoid direct imports during build)
type Transaction = any;

/**
 * Unified Wallet Service Interface
 * Defines the contract for wallet operations
 * Requirements: 11.2 - Maintain IWalletService interface contract
 */
export interface IWalletService {
  initialize(): Promise<void>;
  connectWallet(namespace?: "hedera" | "eip155"): Promise<WalletConnection>;
  disconnectWallet(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAndExecuteTransaction(transaction: Transaction): Promise<unknown>;
  signMessage(message: string): Promise<{ signatureMap: string }>;
  getAccountBalance(accountId?: string): Promise<WalletBalances>;
  getConnectionState(): WalletConnection | null;
  isConnected(): boolean;
  getAccountId(): string | null;
  getActiveNamespace(): "hedera" | "eip155" | null;
}

// Cache for the wallet service instance
let walletServiceInstance: IWalletService | null = null;

/**
 * Get the wallet service instance
 * Returns the updated HederaWalletService with HederaProvider and AppKit integration
 * Requirements: 11.1 - Ensure factory returns the updated HederaWalletService
 * Requirements: 11.3 - Verify singleton pattern for service instance
 */
export async function getWalletService(): Promise<IWalletService> {
  if (!walletServiceInstance) {
    // Dynamic import to avoid SSR issues
    const { hederaWalletService } = await import("./hedera-wallet");
    walletServiceInstance = hederaWalletService as IWalletService;
  }
  return walletServiceInstance;
}

/**
 * Check if the service is using AppKit integration
 * This function indicates that the service is now using HederaProvider + AppKit
 * Requirements: 11.4 - Ensure backward compatibility with existing code
 */
export function isUsingAppKit(): boolean {
  // The service now always uses HederaProvider + AppKit integration
  // This replaces the previous DAppConnector implementation
  return true;
}
