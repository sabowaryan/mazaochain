// Hedera Wallet integration service using official @hashgraph/hedera-wallet-connect v2
// Using Reown AppKit approach with HederaProvider and HederaAdapter
import {
  HederaProvider,
  HederaAdapter,
  HederaChainDefinition,
  hederaNamespace,
} from "@hashgraph/hedera-wallet-connect";
import { Client, Transaction } from "@hashgraph/sdk";
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

// Import WalletConnect modal for QR code display
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let WalletConnectModal: any = null;

class HederaWalletService {
  private hederaProvider: HederaProvider | null = null;
  private nativeAdapter: HederaAdapter | null = null;
  private evmAdapter: HederaAdapter | null = null;
  private isInitialized = false;
  private connectionState: WalletConnection | null = null;
  private client: Client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private modal: any = null;

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

      // Dynamically import WalletConnect modal (only in browser)
      if (typeof window !== "undefined" && !WalletConnectModal) {
        try {
          const modalModule = await import("@walletconnect/modal");
          WalletConnectModal = modalModule.WalletConnectModal;
        } catch (error) {
          console.warn("Failed to load WalletConnect modal:", error);
        }
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

      // Initialize HederaProvider with metadata and projectId
      this.hederaProvider = await HederaProvider.init({
        projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        metadata,
      });

      // Initialize WalletConnect modal if available
      if (WalletConnectModal && typeof window !== "undefined") {
        this.modal = new WalletConnectModal({
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          chains: ["hedera:testnet", "hedera:mainnet"],
          themeMode: "light",
          themeVariables: {
            "--wcm-accent-color": "#10b981",
            "--wcm-background-color": "#10b981",
          },
        });
      }

      // Create and configure HederaAdapters for both namespaces
      await this.createAdapters();

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
   * Create and configure HederaAdapters for Native and EVM namespaces
   */
  private async createAdapters(): Promise<void> {
    if (!this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.INITIALIZATION_FAILED,
        "HederaProvider not initialized"
      );
    }

    const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    const isMainnet = env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet";

    // Create Native Hedera Adapter
    this.nativeAdapter = new HederaAdapter({
      projectId,
      networks: isMainnet
        ? [HederaChainDefinition.Native.Mainnet]
        : [HederaChainDefinition.Native.Testnet],
      namespace: hederaNamespace,
    });

    // Create EVM Adapter
    this.evmAdapter = new HederaAdapter({
      projectId,
      networks: isMainnet
        ? [HederaChainDefinition.EVM.Mainnet]
        : [HederaChainDefinition.EVM.Testnet],
      namespace: "eip155",
    });

    // Set the universal provider for both adapters
    // @ts-expect-error - Type mismatch due to different UniversalProvider versions
    await this.nativeAdapter.setUniversalProvider(this.hederaProvider);
    // @ts-expect-error - Type mismatch due to different UniversalProvider versions
    await this.evmAdapter.setUniversalProvider(this.hederaProvider);
  }

  /**
   * Set up session event listeners for v2
   */
  private setupSessionListeners(): void {
    if (!this.hederaProvider) return;

    // Listen for session events using HederaProvider's emit system
    this.hederaProvider.on("session_update", (data: unknown) => {
      this.handleSessionUpdate(data);
    });

    this.hederaProvider.on("session_delete", (data: unknown) => {
      this.handleSessionDelete(data);
    });

    this.hederaProvider.on("accountsChanged", (accounts: string[]) => {
      this.handleAccountChange(accounts);
    });

    this.hederaProvider.on("chainChanged", (chainId: string) => {
      this.handleChainChange(chainId);
    });

    this.hederaProvider.on("disconnect", () => {
      this.connectionState = null;
    });
  }

  /**
   * Handle session updates
   */
  private handleSessionUpdate(data: unknown): void {
    console.log("Session update received:", data);

    // Extract account information from the update
    const accounts = this.hederaProvider?.getAccountAddresses();
    if (accounts && accounts.length > 0) {
      this.updateConnectionStateFromAccount(accounts[0]);
    }
  }

  /**
   * Handle session deletion
   */
  private handleSessionDelete(data: unknown): void {
    console.log("Session deleted:", data);
    this.connectionState = null;
  }

  /**
   * Handle account change events
   */
  private handleAccountChange(accounts: string[]): void {
    console.log("Account changed:", accounts);
    if (accounts && accounts.length > 0) {
      this.updateConnectionStateFromAccount(accounts[0]);
    }
  }

  /**
   * Handle chain change events
   */
  private handleChainChange(chainId: string): void {
    console.log("Chain changed:", chainId);
    if (this.connectionState) {
      this.connectionState.chainId = chainId;
    }
  }

  /**
   * Update connection state from account string
   */
  private updateConnectionStateFromAccount(accountString: string): void {
    const parts = accountString.split(":");
    if (parts.length >= 3) {
      const namespace = parts[0] as "hedera" | "eip155";
      const networkOrChainId = parts[1];
      const accountId = parts[2];

      if (namespace === "hedera") {
        this.connectionState = {
          accountId,
          network: networkOrChainId as "mainnet" | "testnet",
          isConnected: true,
          namespace: "hedera",
          chainId: `hedera:${networkOrChainId}`,
        };
      } else if (namespace === "eip155") {
        this.connectionState = {
          accountId,
          network: networkOrChainId === "295" ? "mainnet" : "testnet",
          isConnected: true,
          namespace: "eip155",
          chainId: `eip155:${networkOrChainId}`,
        };
      }
    }
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
    if (!this.hederaProvider) return null;

    try {
      // First, try to get active accounts from provider
      const accounts = this.hederaProvider.getAccountAddresses();

      if (accounts && accounts.length > 0) {
        this.updateConnectionStateFromAccount(accounts[0]);
        console.log("Restored active session:", this.connectionState);
        
        // Save the restored session
        this.saveSession();
        
        return this.connectionState;
      }

      // If no active accounts, try to load from localStorage
      const savedSession = this.loadSavedSession();
      if (savedSession) {
        console.log("Found saved session, but no active connection");
        // Don't set as connected, just return the saved data
        return savedSession;
      }
    } catch (error) {
      // Silently handle errors during session restoration
      // This is expected when there's no existing session or provider not connected
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
   */
  async connectWallet(
    namespace: "hedera" | "eip155" = "hedera"
  ): Promise<WalletConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "HederaProvider not initialized"
      );
    }

    try {
      // Check if already connected
      if (this.connectionState?.isConnected) {
        return this.connectionState;
      }

      // Select the appropriate adapter
      const adapter =
        namespace === "hedera" ? this.nativeAdapter : this.evmAdapter;
      if (!adapter) {
        throw new WalletError(
          WalletErrorCode.INITIALIZATION_FAILED,
          `${namespace} adapter not initialized`
        );
      }

      console.log("Starting wallet connection...");

      // Show modal if available
      if (this.modal) {
        console.log("Opening WalletConnect modal...");
      }

      // Connect using the adapter
      // @ts-expect-error - ConnectParams type mismatch
      const connectPromise = adapter.connect({});

      // Wait for connection to be established
      return new Promise((resolve, reject) => {
        // Increase timeout to 120 seconds to give user more time
        const timeout = setTimeout(() => {
          // Close modal if open
          if (this.modal) {
            try {
              this.modal.closeModal();
            } catch (e) {
              // Ignore modal close errors
            }
          }
          
          reject(
            new WalletError(
              WalletErrorCode.CONNECTION_TIMEOUT,
              "La connexion a expiré. Veuillez vérifier que HashPack est installé et ouvert, puis réessayez."
            )
          );
        }, 120000); // 120 second timeout

        let checkCount = 0;
        const maxChecks = 240; // 2 minutes max (240 * 500ms)

        const checkConnection = async () => {
          checkCount++;

          // Check if connection state is set
          if (this.connectionState?.isConnected) {
            clearTimeout(timeout);
            
            // Close modal if open
            if (this.modal) {
              try {
                this.modal.closeModal();
              } catch (e) {
                // Ignore modal close errors
              }
            }
            
            console.log("Wallet connected successfully:", this.connectionState);
            resolve(this.connectionState);
            return;
          }

          // Check for accounts from provider
          try {
            const accounts = this.hederaProvider?.getAccountAddresses();
            if (accounts && accounts.length > 0) {
              this.updateConnectionStateFromAccount(accounts[0]);

              if (this.connectionState) {
                clearTimeout(timeout);
                
                // Close modal if open
                if (this.modal) {
                  try {
                    this.modal.closeModal();
                  } catch (e) {
                    // Ignore modal close errors
                  }
                }
                
                console.log("Wallet connected successfully:", this.connectionState);
                
                // Save session to localStorage
                this.saveSession();
                
                resolve(this.connectionState);
                return;
              }
            }
          } catch (error) {
            // Log errors for debugging but continue checking
            if (checkCount % 10 === 0) {
              console.log(`Connection check ${checkCount}:`, error);
            }
          }

          if (checkCount >= maxChecks) {
            clearTimeout(timeout);
            
            // Close modal if open
            if (this.modal) {
              try {
                this.modal.closeModal();
              } catch (e) {
                // Ignore modal close errors
              }
            }
            
            reject(
              new WalletError(
                WalletErrorCode.CONNECTION_REJECTED,
                "La connexion a été fermée ou rejetée. Veuillez vérifier HashPack et réessayer."
              )
            );
          } else {
            setTimeout(checkConnection, 500);
          }
        };

        // Start checking for connection
        checkConnection();

        // Also wait for the connect promise to resolve/reject
        connectPromise.catch((error: unknown) => {
          clearTimeout(timeout);
          
          // Close modal if open
          if (this.modal) {
            try {
              this.modal.closeModal();
            } catch (e) {
              // Ignore modal close errors
            }
          }
          
          console.error("Connect promise rejected:", error);
          
          const errorMessage = error?.message || String(error);
          
          if (errorMessage.includes("Proposal expired")) {
            reject(
              new WalletError(
                WalletErrorCode.CONNECTION_TIMEOUT,
                "La demande de connexion a expiré. Veuillez ouvrir HashPack et réessayer rapidement."
              )
            );
          } else if (errorMessage.includes("User rejected") || errorMessage.includes("rejected")) {
            reject(
              new WalletError(
                WalletErrorCode.CONNECTION_REJECTED,
                "Connexion refusée dans HashPack"
              )
            );
          } else {
            reject(error);
          }
        });
      });
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
      } else if (errorMessage.includes("timeout")) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_TIMEOUT,
          "Connection timeout. Please try again."
        );
      } else if (errorMessage.includes("Proposal expired")) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_TIMEOUT,
          "Connection request expired. Please try again."
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
   * Sign a native Hedera transaction using hedera_signTransaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.connectionState || !this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    if (this.connectionState.namespace !== "hedera") {
      throw new WalletError(
        WalletErrorCode.INVALID_TRANSACTION,
        "Native Hedera transactions require hedera namespace"
      );
    }

    try {
      // Use HederaProvider's hedera_signTransaction method
      const signedTransaction =
        await this.hederaProvider.hedera_signTransaction({
          signerAccountId: `hedera:${this.connectionState.network}:${this.connectionState.accountId}`,
          transactionBody: transaction,
        });

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
   * Sign a message using hedera_signMessage
   */
  async signMessage(message: string): Promise<{ signatureMap: string }> {
    if (!this.connectionState || !this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    if (this.connectionState.namespace !== "hedera") {
      throw new WalletError(
        WalletErrorCode.INVALID_TRANSACTION,
        "Message signing requires hedera namespace"
      );
    }

    try {
      // Use HederaProvider's hedera_signMessage method
      const result = await this.hederaProvider.hedera_signMessage({
        signerAccountId: `hedera:${this.connectionState.network}:${this.connectionState.accountId}`,
        message,
      });

      return result;
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
      // Close modal if open
      if (this.modal) {
        try {
          this.modal.closeModal();
        } catch (e) {
          // Ignore modal close errors
        }
      }

      if (this.hederaProvider) {
        await this.hederaProvider.disconnect();
      }

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
