"use client";

// Wallet Service Factory
// Provides a unified interface for wallet operations using HederaWalletService

import { hederaWalletService } from "./hedera-wallet";
import type { WalletConnection, WalletBalances } from "@/types/wallet";
import { Transaction } from "@hashgraph/sdk";

/**
 * Unified Wallet Service Interface
 * Defines the contract for wallet operations
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

/**
 * Get the wallet service instance
 * Returns the HederaWalletService with DAppConnector
 */
export function getWalletService(): IWalletService {
  return hederaWalletService as IWalletService;
}
