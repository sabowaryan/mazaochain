// Wallet Service Factory
// Provides a unified interface that switches between custom HederaWalletService
// and AppKit-based implementation based on environment configuration

import { hederaWalletService } from "./hedera-wallet";
import { isAppKitEnabled } from "./appkit-config";
import type { WalletConnection, WalletBalances } from "@/types/wallet";
import { Transaction } from "@hashgraph/sdk";

/**
 * Unified Wallet Service Interface
 * Abstracts the underlying implementation (custom or AppKit)
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
 * AppKit-based Wallet Service Implementation
 * Wraps AppKit functionality to match our IWalletService interface
 */
class AppKitWalletService implements IWalletService {
  private connectionState: WalletConnection | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private appKitInstance: any = null;
  private isInitialized = false;
  private listenersSetup = false; // Flag to prevent multiple subscriptions

  async initialize(): Promise<void> {
    if (this.isInitialized && this.appKitInstance) {
      return;
    }

    try {
      // Dynamically import and initialize AppKit
      const { initializeAppKit } = await import("./appkit-config");
      this.appKitInstance = await initializeAppKit();
      this.isInitialized = true;

      // Set up event listeners for connection state changes
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize AppKit:", error);
      throw new Error("AppKit initialization failed");
    }
  }

  private setupEventListeners = (): void => {
    if (!this.appKitInstance || this.listenersSetup) return;

    console.log("🔧 [AppKitWalletService] Setting up event listeners");
    this.listenersSetup = true;

    // Listen for account changes using subscribeAccount (recommended by Reown docs)
    try {
      if (typeof this.appKitInstance.subscribeAccount === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.appKitInstance.subscribeAccount((account: any) => {
          // Quick check to avoid processing duplicate events
          const currentAccountId = this.connectionState?.accountId;
          const currentIsConnected = this.connectionState?.isConnected;

          // Skip if already connected with same account
          if (
            account?.isConnected &&
            currentIsConnected &&
            currentAccountId === account.address
          ) {
            return; // Skip duplicate updates silently
          }

          // Skip if already disconnected and receiving another disconnect event
          if (!account?.isConnected && !currentIsConnected) {
            return; // Skip duplicate disconnect events silently
          }

          console.log(
            "📡 [AppKitWalletService] Account update received:",
            account
          );

          if (account && account.isConnected) {
            this.updateConnectionStateFromAccount(account);
          } else {
            console.log("❌ [AppKitWalletService] Account disconnected");
            this.connectionState = null;
          }
        });
        console.log(
          "✅ [AppKitWalletService] subscribeAccount set up successfully"
        );
      } else if (typeof this.appKitInstance.subscribeState === "function") {
        // Fallback to subscribeState if subscribeAccount not available
        console.log("⚠️ [AppKitWalletService] Using subscribeState fallback");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.appKitInstance.subscribeState((state: any) => {
          console.log("📡 [AppKitWalletService] State update received:", state);
          this.updateConnectionStateFromAppKit(state);
        });
      } else {
        console.warn(
          "⚠️ [AppKitWalletService] No subscription methods available"
        );
      }
    } catch (error) {
      console.warn("Could not set up AppKit event listeners:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateConnectionStateFromAccount(account: any): void {
    try {
      // AppKit account object: { address, caipAddress, chainId, isConnected, status, type }
      const address = account.address;
      const caipAddress = account.caipAddress;
      const isConnected = account.isConnected;
      const status = account.status; // "connected" | "disconnected" | "connecting"

      // If disconnected or status is disconnected, clear state
      if (!isConnected || status === "disconnected") {
        console.log("❌ [AppKitWalletService] Account disconnected");
        this.connectionState = null;
        return;
      }

      console.log("🔄 [AppKitWalletService] Updating from account:", {
        address,
        caipAddress,
        status,
      });

      if (isConnected && (address || caipAddress)) {
        let accountId = address;
        let namespace: "hedera" | "eip155" = "hedera";
        let network: "mainnet" | "testnet" = "testnet";
        let fullChainId = "";

        // Parse CAIP address (format: "namespace:chainId:address")
        if (caipAddress) {
          const parts = caipAddress.split(":");
          if (parts.length >= 3) {
            namespace = parts[0] as "hedera" | "eip155";
            const chainPart = parts[1];
            accountId = parts.slice(2).join(":");

            if (namespace === "hedera") {
              network = chainPart === "mainnet" ? "mainnet" : "testnet";
              fullChainId = `hedera:${network}`;
            } else {
              // EVM: 295 = mainnet, 296 = testnet
              network = chainPart === "295" ? "mainnet" : "testnet";
              fullChainId = `eip155:${chainPart}`;
            }
          }
        }

        // Fallback: use address directly if no CAIP
        if (!fullChainId) {
          // Try to get chainId from AppKit state
          const state = this.appKitInstance?.getState?.();
          const selectedNetwork = state?.selectedNetworkId || "hedera:testnet";

          if (selectedNetwork.includes("hedera")) {
            namespace = "hedera";
            network = selectedNetwork.includes("mainnet")
              ? "mainnet"
              : "testnet";
            fullChainId = `hedera:${network}`;
          } else {
            namespace = "eip155";
            network = selectedNetwork.includes("295") ? "mainnet" : "testnet";
            fullChainId = selectedNetwork;
          }
        }

        this.connectionState = {
          accountId,
          network,
          isConnected: true,
          namespace,
          chainId: fullChainId,
        };

        console.log(
          "✅ [AppKitWalletService] Connection state updated:",
          this.connectionState
        );
      }
    } catch (error) {
      console.error("Failed to update from account:", error);
      this.connectionState = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateConnectionStateFromAppKit(state: any): void {
    try {
      console.log(
        "🔄 [AppKitWalletService] Updating connection state from:",
        state
      );

      // Deproxify the state object to access properties
      const stateObj = JSON.parse(JSON.stringify(state));
      console.log("🔍 [AppKitWalletService] Deproxified state:", stateObj);

      // AppKit state structure: { address, chainId, isConnected, ... }
      const address = stateObj?.address || state?.address;
      const caipAddress = stateObj?.caipAddress || state?.caipAddress; // Format: "hedera:testnet:0.0.12345" or "eip155:296:0x..."
      const chainId = stateObj?.chainId || state?.chainId;
      const isConnected = stateObj?.isConnected || state?.isConnected;

      console.log("📊 [AppKitWalletService] Parsed values:", {
        address,
        caipAddress,
        chainId,
        isConnected,
      });

      if (isConnected && (address || caipAddress)) {
        // Parse CAIP address if available
        let accountId = address;
        let namespace: "hedera" | "eip155" = "hedera";
        let network: "mainnet" | "testnet" = "testnet";
        let fullChainId = chainId;

        if (caipAddress) {
          // Parse CAIP format: "namespace:chainId:address"
          const parts = caipAddress.split(":");
          if (parts.length >= 3) {
            namespace = parts[0] as "hedera" | "eip155";
            const chainPart = parts[1];
            accountId = parts.slice(2).join(":"); // Handle addresses with colons

            // Determine network from chain part
            if (namespace === "hedera") {
              network = chainPart === "mainnet" ? "mainnet" : "testnet";
              fullChainId = `hedera:${network}`;
            } else {
              // EVM: 295 = mainnet, 296 = testnet
              network = chainPart === "295" ? "mainnet" : "testnet";
              fullChainId = `eip155:${chainPart}`;
            }
          }
        } else if (chainId) {
          // Fallback: parse chainId
          if (chainId.includes("hedera")) {
            namespace = "hedera";
            network = chainId.includes("mainnet") ? "mainnet" : "testnet";
          } else if (
            chainId.includes("eip155") ||
            chainId.includes("295") ||
            chainId.includes("296")
          ) {
            namespace = "eip155";
            network = chainId.includes("295") ? "mainnet" : "testnet";
          }
          fullChainId = chainId;
        }

        this.connectionState = {
          accountId,
          network,
          isConnected: true,
          namespace,
          chainId: fullChainId || `${namespace}:${network}`,
        };

        console.log(
          "✅ [AppKitWalletService] Connection state updated:",
          this.connectionState
        );
      } else {
        console.log("❌ [AppKitWalletService] Not connected or no address");
        this.connectionState = null;
      }
    } catch (error) {
      console.error("Failed to update connection state:", error);
    }
  }

  async connectWallet(
    namespace: "hedera" | "eip155" = "hedera"
  ): Promise<WalletConnection> {
    // Ensure AppKit is initialized
    if (!this.isInitialized || !this.appKitInstance) {
      await this.initialize();
    }

    if (!this.appKitInstance) {
      throw new Error("AppKit not initialized");
    }

    try {
      // Open AppKit modal
      await this.appKitInstance.open();

      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 60000);

        let checkCount = 0;
        const maxChecks = 240; // 60 seconds (240 * 250ms) - more frequent checks

        const checkConnection = () => {
          checkCount++;

          // Check if connection state is set
          if (this.connectionState?.isConnected) {
            clearTimeout(timeout);
            console.log("AppKit connected successfully:", this.connectionState);
            resolve(this.connectionState);
            return;
          }

          // Try to get account from AppKit using getAccount() API
          try {
            const account = this.appKitInstance.getAccount?.();

            if (
              account?.isConnected &&
              (account.address || account.caipAddress)
            ) {
              clearTimeout(timeout);

              // Update connection state from account
              this.updateConnectionStateFromAccount(account);

              console.log(
                "AppKit connected successfully:",
                this.connectionState
              );
              resolve(this.connectionState!);
              return;
            }
          } catch (error) {
            // Log errors for debugging but continue checking
            if (checkCount % 20 === 0) {
              console.log(`AppKit connection check ${checkCount}:`, error);
            }
          }

          if (checkCount >= maxChecks) {
            clearTimeout(timeout);
            reject(new Error("Connection timeout - no response from wallet"));
          } else {
            setTimeout(checkConnection, 250); // Check every 250ms instead of 500ms
          }
        };

        // Start checking for connection
        checkConnection();
      });
    } catch (error) {
      console.error("AppKit connection error:", error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      console.log("🔌 [AppKitWalletService] Disconnecting wallet...");

      // Clear state immediately to prevent UI issues
      this.connectionState = null;

      if (this.appKitInstance) {
        await this.appKitInstance.disconnect();
        console.log(
          "✅ [AppKitWalletService] Wallet disconnected successfully"
        );
      }
    } catch (error) {
      console.error("❌ [AppKitWalletService] Disconnect error:", error);
      // State already cleared above
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signTransaction(_transaction: Transaction): Promise<Transaction> {
    // AppKit handles transaction signing through its modal
    // This would need to be implemented based on AppKit's transaction API
    throw new Error("Transaction signing via AppKit not yet implemented");
  }

  async signAndExecuteTransaction(transaction: Transaction): Promise<unknown> {
    const signedTx = await this.signTransaction(transaction);
    // Execute transaction logic here
    return signedTx;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signMessage(_message: string): Promise<{ signatureMap: string }> {
    // AppKit handles message signing through its modal
    throw new Error("Message signing via AppKit not yet implemented");
  }

  async getAccountBalance(accountId?: string): Promise<WalletBalances> {
    // Delegate to the custom service for balance queries
    return hederaWalletService.getAccountBalance(accountId);
  }

  getConnectionState(): WalletConnection | null {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState?.isConnected ?? false;
  }

  getAccountId(): string | null {
    return this.connectionState?.accountId ?? null;
  }

  getActiveNamespace(): "hedera" | "eip155" | null {
    return this.connectionState?.namespace ?? null;
  }
}

// Singleton instance to prevent multiple initializations
let appKitServiceInstance: AppKitWalletService | null = null;

/**
 * Get the appropriate wallet service based on configuration
 */
export function getWalletService(): IWalletService {
  if (isAppKitEnabled()) {
    // Return singleton instance to prevent multiple initializations
    if (!appKitServiceInstance) {
      appKitServiceInstance = new AppKitWalletService();
    }
    return appKitServiceInstance;
  }

  return hederaWalletService as IWalletService;
}

/**
 * Check if using AppKit mode
 */
export function isUsingAppKit(): boolean {
  return isAppKitEnabled();
}
