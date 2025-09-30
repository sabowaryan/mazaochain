// Hedera Wallet integration service using official @hashgraph/hedera-wallet-connect v1.5.1
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import {
  LedgerId,
  AccountId,
  AccountBalanceQuery,
  Client,
  Transaction,
} from "@hashgraph/sdk";
import { env } from "@/lib/config/env";
import { handleWalletError, suppressWalletConnectErrors } from "./wallet-error-handler";

export interface WalletConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
  symbol: string;
  name: string;
}

export interface WalletBalances {
  hbar: string;
  tokens: TokenBalance[];
}

class HederaWalletService {
  private dAppConnector: DAppConnector | null = null;
  private isInitialized = false;
  private connectionState: WalletConnection | null = null;
  private client: Client;

  constructor() {
    // Initialize Hedera client
    this.client =
      env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
        ? Client.forMainnet()
        : Client.forTestnet();
    
    // Supprimer les erreurs de console en développement
    suppressWalletConnectErrors();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Vérifier les variables d'environnement requises
      if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Wallet functionality will be limited.");
        return;
      }

      const metadata = {
        name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain MVP",
        description: env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || "Decentralized lending platform for farmers",
        url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        icons: [`${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`],
      };

      const ledgerId =
        env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? LedgerId.MAINNET
          : LedgerId.TESTNET;

      const supportedChains =
        env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? [HederaChainId.Mainnet]
          : [HederaChainId.Testnet];

      this.dAppConnector = new DAppConnector(
        metadata,
        ledgerId,
        env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        supportedChains
      );

      // Set up event listeners
      this.setupEventListeners();

      // Initialize the connector
      await this.dAppConnector.init({ logger: "error" });

      this.isInitialized = true;
      console.log("Hedera Wallet service initialized successfully");
    } catch (error) {
      const walletError = handleWalletError(error);
      console.error("Failed to initialize Hedera Wallet service:", walletError);
      throw walletError;
    }
  }

  private setupEventListeners(): void {
    if (!this.dAppConnector) return;

    // Listen for session events using the correct API
    this.dAppConnector.onSessionIframeCreated = (session) => {
      console.log("Session created:", session);

      if (session && session.namespaces) {
        // Extract account information from session
        const hederaNamespace = session.namespaces["hedera"];
        if (
          hederaNamespace &&
          hederaNamespace.accounts &&
          hederaNamespace.accounts.length > 0
        ) {
          // Parse account ID from the namespace format (e.g., "hedera:testnet:0.0.123456")
          const accountString = hederaNamespace.accounts[0];
          const accountId = accountString.split(":")[2]; // Extract the account ID part

          this.connectionState = {
            accountId: accountId,
            network: env.NEXT_PUBLIC_HEDERA_NETWORK,
            isConnected: true,
          };
          console.log("Wallet connected:", this.connectionState);
        }
      }
    };

    console.log("Hedera Wallet event listeners set up");
  }

  async connectWallet(): Promise<WalletConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.dAppConnector) {
      throw new Error("DAppConnector not initialized");
    }

    try {
      // Check if already connected
      if (this.connectionState?.isConnected) {
        return this.connectionState;
      }

      console.log("Opening wallet connection modal...");

      // Open the wallet connection modal
      await this.dAppConnector.openModal();

      // Wait for connection to be established
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout. Please try again."));
        }, 60000); // 60 second timeout

        const checkConnection = () => {
          if (this.connectionState?.isConnected) {
            clearTimeout(timeout);
            resolve(this.connectionState);
          } else {
            setTimeout(checkConnection, 500);
          }
        };

        checkConnection();
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new Error("Failed to connect to wallet");
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (this.dAppConnector) {
        // Disconnect all sessions
        await this.dAppConnector.disconnectAll();
      }

      // Clear connection state
      this.connectionState = null;

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw new Error("Failed to disconnect wallet");
    }
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

  async signTransaction(
    accountId: string,
    transaction: Transaction
  ): Promise<Transaction> {
    if (!this.connectionState || !this.dAppConnector) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Signing transaction:", transaction);

      // For now, we'll implement basic transaction signing
      // This will be expanded when we have actual transactions to sign
      throw new Error(
        "Transaction signing not yet implemented - waiting for transaction creation"
      );
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw new Error("Failed to sign transaction");
    }
  }

  async signAndReturnTransaction(
    accountId: string,
    transaction: Transaction
  ): Promise<Transaction> {
    if (!this.connectionState || !this.dAppConnector) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Signing and returning transaction:", transaction);

      // For now, we'll implement basic transaction signing
      // This will be expanded when we have actual transactions to sign
      throw new Error(
        "Transaction signing not yet implemented - waiting for transaction creation"
      );
    } catch (error) {
      console.error("Failed to sign and return transaction:", error);
      throw new Error("Failed to sign and return transaction");
    }
  }

  async signMessage(accountId: string, message: string): Promise<unknown> {
    if (!this.connectionState || !this.dAppConnector) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Signing message:", message);

      // For now, we'll implement basic message signing
      // This will be expanded when we need message signing functionality
      throw new Error(
        "Message signing not yet implemented - waiting for authentication needs"
      );
    } catch (error) {
      console.error("Failed to sign message:", error);
      throw new Error("Failed to sign message");
    }
  }

  // Get all connected sessions
  getSessions() {
    return this.dAppConnector?.walletConnectClient?.session.getAll() || [];
  }

  // Get active session
  getActiveSession() {
    const sessions = this.getSessions();
    return sessions.length > 0 ? sessions[0] : null;
  }
}

// Export singleton instance
export const hederaWalletService = new HederaWalletService();
