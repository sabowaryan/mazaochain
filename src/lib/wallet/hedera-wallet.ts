"use client";

// Hedera Wallet integration service using official @hashgraph/hedera-wallet-connect v2
// Using DAppConnector for direct WalletConnect integration
import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
  DAppSigner,
} from "@hashgraph/hedera-wallet-connect";
import { Client, Transaction, LedgerId, AccountId } from "@hashgraph/sdk";
import { WalletConnectModal } from "@walletconnect/modal";
import type { SessionTypes } from "@walletconnect/types";
// UniversalProvider type is used for type casting in setUniversalProvider calls
import { env } from "@/lib/config/env";
import { suppressWalletConnectErrors } from "./wallet-error-handler";
import {
  WalletConnection,
  WalletSession,
  TokenBalance,
  WalletBalances,
  WalletErrorCode,
  WalletError,
} from "@/types/wallet";

class HederaWalletService {
  private dAppConnector: DAppConnector | null = null;
  private signers: DAppSigner[] = [];
  private isInitialized = false;
  private connectionState: WalletConnection | null = null;
  private client: Client;
  private walletConnectModal: WalletConnectModal | null = null;

  constructor() {
    // Initialize Hedera client
    this.client =
      env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
        ? Client.forMainnet()
        : Client.forTestnet();

    // Suppress WalletConnect console errors in development
    suppressWalletConnectErrors();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate required environment variables
      if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        throw new WalletError(
          WalletErrorCode.INVALID_PROJECT_ID,
          "WalletConnect Project ID is not configured. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment variables."
        );
      }

      // Configure application metadata
      const metadata = {
        name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain MVP",
        description:
          env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION ||
          "Decentralized lending platform for farmers",
        url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        icons: [
          `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`,
        ],
      };

      // Determine the LedgerId (MAINNET or TESTNET) from configuration
      const ledgerId =
        env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? LedgerId.MAINNET
          : LedgerId.TESTNET;

      // Create DAppConnector with metadata, ledgerId, projectId, methods, events, chains
      this.dAppConnector = new DAppConnector(
        metadata,
        ledgerId,
        env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [HederaChainId.Mainnet, HederaChainId.Testnet]
      );

      // Initialize DAppConnector
      await this.dAppConnector.init({ logger: "error" });

      // Create WalletConnect modal
      if (typeof window !== "undefined") {
        this.walletConnectModal = new WalletConnectModal({
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          chains: ["hedera:mainnet", "hedera:testnet"],
        });
      }

      // Set up session event listeners
      this.setupSessionListeners();

      // Attempt to restore existing session
      await this.restoreExistingSession();

      this.isInitialized = true;
    } catch (error) {
      const walletError =
        error instanceof WalletError
          ? error
          : new WalletError(
              WalletErrorCode.INITIALIZATION_FAILED,
              "Failed to initialize Hedera Wallet service",
              error
            );
      console.error("Failed to initialize Hedera Wallet service:", walletError);
      throw walletError;
    }
  }

  /**
   * Set up session event listeners
   * Note: DAppConnector handles session events automatically via its internal listeners
   * configured during initialization (ChainChanged, AccountsChanged).
   * No manual event handling is required.
   */
  private setupSessionListeners(): void {
    // DAppConnector manages events internally
    // Events are configured during initialization:
    // - HederaSessionEvent.ChainChanged
    // - HederaSessionEvent.AccountsChanged
    // Signers are automatically updated by DAppConnector
  }

  /**
   * Save session to localStorage (without private keys!)
   */
  private saveSession(): void {
    if (!this.connectionState) return;

    try {
      const sessionData = {
        accountId: this.connectionState.accountId,
        network: this.connectionState.network,
        namespace: this.connectionState.namespace,
        chainId: this.connectionState.chainId,
        timestamp: Date.now(),
      };

      localStorage.setItem(
        "hedera_wallet_session",
        JSON.stringify(sessionData)
      );
      console.log("Session saved to localStorage");
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSavedSession(): WalletConnection | null {
    try {
      const sessionData = localStorage.getItem("hedera_wallet_session");
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Check if session is expired (24 hours)
      const age = Date.now() - session.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        console.log("Session expired, removing from localStorage");
        localStorage.removeItem("hedera_wallet_session");
        return null;
      }

      console.log("Loaded saved session from localStorage");
      return {
        accountId: session.accountId,
        network: session.network,
        isConnected: false, // Will be verified
        namespace: session.namespace,
        chainId: session.chainId,
      };
    } catch (error) {
      console.error("Failed to load saved session:", error);
      return null;
    }
  }

  /**
   * Clear saved session from localStorage
   */
  private clearSavedSession(): void {
    try {
      localStorage.removeItem("hedera_wallet_session");
      console.log("Session cleared from localStorage");
    } catch (error) {
      console.error("Failed to clear saved session:", error);
    }
  }

  /**
   * Restore existing session on startup
   */
  private async restoreExistingSession(): Promise<WalletConnection | null> {
    if (!this.dAppConnector) return null;

    try {
      // Try to load saved session from localStorage
      const savedSession = this.loadSavedSession();
      if (savedSession) {
        console.log("Found saved session in localStorage");
        // Note: The actual connection will be re-established when user interacts
        // DAppConnector will handle session restoration automatically
        return savedSession;
      }
    } catch (error) {
      // Silently handle errors during session restoration
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("Not initialized")) {
        console.error("Failed to restore session:", error);
      }
    }

    return null;
  }

  /**
   * Connect wallet with optional namespace selection
   * Note: DAppConnector only supports hedera namespace, eip155 parameter is kept for compatibility
   */
  async connectWallet(
    _namespace: "hedera" | "eip155" = "hedera"
  ): Promise<WalletConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.dAppConnector) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "DAppConnector not initialized"
      );
    }

    try {
      // Check if already connected
      if (this.connectionState?.isConnected) {
        return this.connectionState;
      }

      console.log("Opening WalletConnect modal...");

      // Open the WalletConnect modal and wait for session
      const session = await this.dAppConnector.openModal();

      // Extract signers from the session
      this.signers = this.createSignersFromSession(session);

      // Update connection state with information from the first signer
      if (this.signers.length > 0) {
        const firstSigner = this.signers[0];
        const accountId = firstSigner.getAccountId().toString();

        this.connectionState = {
          accountId,
          network:
            env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
              ? "mainnet"
              : "testnet",
          isConnected: true,
          namespace: "hedera",
          chainId: `hedera:${env.NEXT_PUBLIC_HEDERA_NETWORK}`,
        };

        // Save session to localStorage
        this.saveSession();

        console.log("Wallet connected successfully:", this.connectionState);
        return this.connectionState;
      }

      throw new WalletError(
        WalletErrorCode.CONNECTION_REJECTED,
        "No signers created from session"
      );
    } catch (error: unknown) {
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string };
      const errorMessage = err?.message || "";

      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_REJECTED,
          "Connection rejected in HashPack"
        );
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Proposal expired")
      ) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_TIMEOUT,
          "Connection timeout. Please try again."
        );
      } else if (errorMessage.includes("Project ID")) {
        throw new WalletError(
          WalletErrorCode.INVALID_PROJECT_ID,
          "Invalid WalletConnect Project ID"
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("Network")
      ) {
        throw new WalletError(
          WalletErrorCode.NETWORK_ERROR,
          "Network connection error. Please check your internet connection."
        );
      } else {
        throw new WalletError(
          WalletErrorCode.UNKNOWN_ERROR,
          "Unable to connect to wallet. Please ensure HashPack is installed and unlocked.",
          error
        );
      }
    }
  }

  /**
   * Create DAppSigner instances from a WalletConnect session
   */
  private createSignersFromSession(session: SessionTypes.Struct): DAppSigner[] {
    const signers: DAppSigner[] = [];

    // Extract accounts from the session namespaces
    const accounts = Object.values(session.namespaces).flatMap(
      (namespace) => namespace.accounts
    );

    for (const account of accounts) {
      // Format: hedera:testnet:0.0.12345 or hedera:mainnet:0.0.12345
      const parts = account.split(":");
      if (parts.length >= 3 && parts[0] === "hedera") {
        const accountId = parts[2];

        // Create a signer via DAppConnector
        const signer = this.dAppConnector!.getSigner(
          AccountId.fromString(accountId)
        );

        signers.push(signer);
      }
    }

    return signers;
  }

  /**
   * Sign a native Hedera transaction using DAppSigner
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.connectionState || !this.dAppConnector) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    try {
      // Get the first signer (primary account)
      const signer = this.signers[0];
      if (!signer) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "No signer available"
        );
      }

      // Sign the transaction using DAppSigner
      const signedTransaction = await signer.signTransaction(transaction);

      return signedTransaction;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string };
      const errorMessage = err?.message || "";

      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_REJECTED,
          "Transaction rejected by user"
        );
      } else if (errorMessage.includes("insufficient")) {
        throw new WalletError(
          WalletErrorCode.INSUFFICIENT_BALANCE,
          "Insufficient balance for transaction"
        );
      } else {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          "Failed to sign transaction",
          error
        );
      }
    }
  }

  /**
   * Sign and execute a transaction (convenience method)
   */
  async signAndExecuteTransaction(transaction: Transaction): Promise<unknown> {
    const signedTransaction = await this.signTransaction(transaction);

    try {
      // Execute the signed transaction
      const response = await signedTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      return receipt;
    } catch (error) {
      throw new WalletError(
        WalletErrorCode.TRANSACTION_FAILED,
        "Failed to execute transaction",
        error
      );
    }
  }

  /**
   * Sign a message using DAppConnector
   */
  async signMessage(message: string): Promise<{ signatureMap: string }> {
    if (!this.connectionState || !this.dAppConnector) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    try {
      // Format signerAccountId in HIP-30 format (hedera:network:accountId)
      const signerAccountId = `hedera:${this.connectionState.network}:${this.connectionState.accountId}`;

      // Use DAppConnector's signMessage method
      const result = await this.dAppConnector.signMessage({
        signerAccountId,
        message,
      });

      // DAppConnector returns JsonRpcResult wrapper, extract the actual result
      return result as unknown as { signatureMap: string };
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string };
      const errorMessage = err?.message || "";

      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_REJECTED,
          "Message signing rejected by user"
        );
      } else {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          "Failed to sign message",
          error
        );
      }
    }
  }

  /**
   * Disconnect wallet and clean up all sessions
   */
  async disconnectWallet(): Promise<void> {
    try {
      if (this.dAppConnector) {
        // Disconnect all signers
        for (const signer of this.signers) {
          await this.dAppConnector.disconnect(signer.topic);
        }
      }

      // Clear signers array
      this.signers = [];

      // Clear connection state
      this.connectionState = null;

      // Clear saved session from localStorage
      this.clearSavedSession();

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw new WalletError(
        WalletErrorCode.UNKNOWN_ERROR,
        "Failed to disconnect wallet",
        error
      );
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): WalletConnection | null {
    return this.connectionState;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connectionState?.isConnected ?? false;
  }

  /**
   * Get connected account ID
   */
  getAccountId(): string | null {
    return this.connectionState?.accountId ?? null;
  }

  /**
   * Get active namespace
   */
  getActiveNamespace(): "hedera" | "eip155" | null {
    return this.connectionState?.namespace ?? null;
  }

  async getAccountBalance(accountId?: string): Promise<WalletBalances> {
    const targetAccountId = accountId || this.connectionState?.accountId;

    if (!targetAccountId) {
      throw new Error("No account ID available for balance query");
    }

    try {
      // Use Hedera Mirror Node API to get balance
      const mirrorNodeUrl =
        env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? "https://mainnet-public.mirrornode.hedera.com"
          : "https://testnet.mirrornode.hedera.com";

      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/accounts/${targetAccountId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch account data: ${response.statusText}`);
      }

      const accountData = await response.json();

      // Convert balance from tinybars to HBAR
      const hbarBalance = (
        parseInt(accountData.balance.balance) / 100000000
      ).toString();

      // Get token balances
      const tokens: TokenBalance[] = [];

      if (accountData.balance.tokens && accountData.balance.tokens.length > 0) {
        for (const token of accountData.balance.tokens) {
          tokens.push({
            tokenId: token.token_id,
            balance: token.balance.toString(),
            decimals: token.decimals || 6,
            symbol: this.getTokenSymbol(token.token_id),
            name: this.getTokenName(token.token_id),
          });
        }
      }

      return {
        hbar: hbarBalance,
        tokens,
      };
    } catch (error) {
      console.error("Failed to get account balance:", error);

      // Return empty balance on error to avoid breaking the UI
      return {
        hbar: "0",
        tokens: [],
      };
    }
  }

  private getTokenSymbol(tokenId: string): string {
    // This would typically come from a token registry or API
    const tokenSymbols: Record<string, string> = {
      // Hedera testnet USDC token ID (example)
      "0.0.456858": "USDC",
      // Add more known token IDs and their symbols
    };

    return tokenSymbols[tokenId] || "UNKNOWN";
  }

  private getTokenName(tokenId: string): string {
    // This would typically come from a token registry or API
    const tokenNames: Record<string, string> = {
      // Hedera testnet USDC token ID (example)
      "0.0.456858": "USD Coin",
      // Add more known token IDs and their names
    };

    return tokenNames[tokenId] || "Unknown Token";
  }

  /**
   * Get all connected sessions
   */
  getSessions(): WalletSession[] {
    // HederaProvider doesn't expose sessions directly
    // Return empty array for now
    return [];
  }

  /**
   * Get active session
   */
  getActiveSession(): WalletSession | null {
    return null;
  }
}

// Export singleton instance with global persistence for Hot Reload
declare global {
  var hederaWalletServiceInstance: HederaWalletService | undefined;
}

export const hederaWalletService =
  globalThis.hederaWalletServiceInstance ||
  (globalThis.hederaWalletServiceInstance = new HederaWalletService());
