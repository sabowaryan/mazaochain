"use client";

// Hedera Wallet integration service using official @hashgraph/hedera-wallet-connect v2
// Using HederaProvider for WalletConnect integration with AppKit support
import {
  HederaProvider,
  DAppSigner,
  HederaAdapter,
  hederaNamespace,
} from "@hashgraph/hedera-wallet-connect";
import { HederaChainDefinition } from "@hashgraph/hedera-wallet-connect";
// Import proper types from Hedera SDK
import type { Client, Transaction, AccountId, LedgerId } from "@hashgraph/sdk";
import type UniversalProvider from "@walletconnect/universal-provider";
import type { SessionTypes } from "@walletconnect/types";
import type { AppKit } from "@reown/appkit";
import { env } from "@/lib/config/env";
import { suppressWalletConnectErrors } from "./wallet-error-handler";
import { debugAddress, isValidForMirrorNode, extractHederaAccountId } from "./address-utils";
import { cleanInvalidSessions } from "./session-cleaner";
import {
  WalletConnection,
  WalletSession,
  TokenBalance,
  WalletBalances,
  WalletErrorCode,
  WalletError,
} from "@/types/wallet";

class HederaWalletService {
  private hederaProvider: UniversalProvider | null = null;
  private nativeAdapter: HederaAdapter | null = null;
  private evmAdapter: HederaAdapter | null = null;
  private appKitInstance: AppKit | null = null;
  private signers: DAppSigner[] = [];
  private isInitialized = false;
  private connectionState: WalletConnection | null = null;
  private client: any = null;

  constructor() {
    // Lazy initialization - client will be created when needed
    // Suppress WalletConnect console errors in development
    suppressWalletConnectErrors();
  }

  private async initializeHederaClient() {
    if (!this.client) {
      try {
        // Skip initialization during build
        if (typeof window === 'undefined' && !env.HEDERA_PRIVATE_KEY) {
          return;
        }

        // Use SDK wrapper to avoid build-time issues
        const { createClient } = await import("@/lib/hedera/sdk-wrapper");

        // Initialize Hedera client
        this.client = await createClient(
          env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet"
        );
      } catch (error) {
        console.error('Failed to initialize Hedera client:', error);
      }
    }
  }

  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _doInitialize(): Promise<void> {
    console.log("🚀 Initializing wallet service...");

    try {
      // Initialize Hedera client first
      await this.initializeHederaClient();

      // Requirement 14.4: Validate projectId and throw appropriate errors
      if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
        throw new WalletError(
          WalletErrorCode.INVALID_PROJECT_ID,
          "WalletConnect Project ID is not configured. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment variables."
        );
      }

      // Validate projectId format (should be a non-empty string with reasonable length)
      // WalletConnect Project IDs are typically 32-character hex strings, but we allow flexibility for testing
      const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.trim();
      if (projectId.length < 10 || projectId.length > 100) {
        throw new WalletError(
          WalletErrorCode.INVALID_PROJECT_ID,
          "Invalid WalletConnect Project ID format. Please check your NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID configuration."
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

      // Requirement 14.1: Add error handling for HederaProvider.init failures
      // Initialize HederaProvider with projectId and metadata
      // Cast to UniversalProvider for AppKit compatibility
      try {
        this.hederaProvider = (await HederaProvider.init({
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          metadata,
        })) as unknown as UniversalProvider;

        // Increase max listeners to prevent EventEmitter warnings
        // This is safe because we're using a singleton pattern
        const providerWithEmitter = this.hederaProvider as any;
        if (providerWithEmitter && typeof providerWithEmitter.setMaxListeners === 'function') {
          providerWithEmitter.setMaxListeners(20);
        }
      } catch (error) {
        const err = error as { message?: string; code?: string; name?: string };
        const errorMessage = (err?.message || "").toLowerCase();
        const errorCode = err?.code || "";
        const errorName = err?.name || "";

        // Enhanced error detection for HederaProvider initialization failures
        if (
          errorMessage.includes("project id") ||
          errorMessage.includes("projectid") ||
          errorMessage.includes("invalid project") ||
          errorCode.includes("PROJECT_ID") ||
          errorName.includes("ProjectId")
        ) {
          throw new WalletError(
            WalletErrorCode.INVALID_PROJECT_ID,
            "Failed to initialize HederaProvider: Invalid or missing WalletConnect Project ID. Please check your NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID configuration.",
            error
          );
        } else if (
          errorMessage.includes("network") ||
          errorMessage.includes("connection") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("unreachable") ||
          errorCode.includes("NETWORK") ||
          errorName.includes("Network")
        ) {
          throw new WalletError(
            WalletErrorCode.NETWORK_ERROR,
            "Failed to initialize HederaProvider: Network connection error. Please check your internet connection and try again.",
            error
          );
        } else if (
          errorMessage.includes("metadata") ||
          errorMessage.includes("invalid metadata") ||
          errorMessage.includes("malformed")
        ) {
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            "Failed to initialize HederaProvider: Invalid application metadata configuration.",
            error
          );
        } else if (
          errorMessage.includes("unsupported") ||
          errorMessage.includes("not supported") ||
          errorMessage.includes("incompatible")
        ) {
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            "Failed to initialize HederaProvider: Unsupported environment or configuration.",
            error
          );
        } else {
          // Requirement 14.5: Wrap unknown errors with original error
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            `Failed to initialize HederaProvider: ${err?.message || "Unknown initialization error"}`,
            error
          );
        }
      }

      // Create native adapter for Hedera namespace
      // Supports native Hedera transactions (HTS, HBAR transfers, native smart contracts)
      try {
        this.nativeAdapter = new HederaAdapter({
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          networks: env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
            ? [HederaChainDefinition.Native.Mainnet]
            : [HederaChainDefinition.Native.Testnet],
          namespace: hederaNamespace, // 'hedera' as CaipNamespace
        });
      } catch (error) {
        throw new WalletError(
          WalletErrorCode.INITIALIZATION_FAILED,
          "Failed to create native Hedera adapter",
          error
        );
      }

      // Create EVM adapter for EIP-155 namespace
      // Supports EVM-compatible transactions on Hedera (Ethereum-like smart contracts)
      try {
        this.evmAdapter = new HederaAdapter({
          projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          networks: env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
            ? [HederaChainDefinition.EVM.Mainnet]   // Chain ID 295
            : [HederaChainDefinition.EVM.Testnet],  // Chain ID 296
          namespace: 'eip155',
        });
      } catch (error) {
        throw new WalletError(
          WalletErrorCode.INITIALIZATION_FAILED,
          "Failed to create EVM adapter",
          error
        );
      }

      // Initialize AppKit with HederaProvider and adapters
      // AppKit provides the modal UI for wallet connection
      try {
        // Dynamic import to avoid SSR issues
        const { initializeAppKit } = await import("./appkit-config");
        this.appKitInstance = await initializeAppKit({
          adapters: [this.nativeAdapter, this.evmAdapter],
          universalProvider: this.hederaProvider,
        });
        console.log("AppKit initialized successfully with Hedera adapters");
      } catch (error) {
        const err = error as { message?: string; code?: string; name?: string };
        const errorMessage = (err?.message || "").toLowerCase();
        const errorCode = err?.code || "";
        const errorName = err?.name || "";

        // Requirement 14.3: Add network error handling specific to AppKit
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("connection") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("cors") ||
          errorMessage.includes("unreachable") ||
          errorMessage.includes("timeout") ||
          errorCode.includes("NETWORK") ||
          errorName.includes("Network")
        ) {
          throw new WalletError(
            WalletErrorCode.NETWORK_ERROR,
            "Failed to initialize AppKit: Network connection error. Please check your internet connection and firewall settings.",
            error
          );
        } else if (
          errorMessage.includes("project id") ||
          errorMessage.includes("projectid") ||
          errorMessage.includes("invalid project") ||
          errorMessage.includes("missing project") ||
          errorCode.includes("PROJECT_ID") ||
          errorName.includes("ProjectId")
        ) {
          // Requirement 14.4: Validate projectId and throw appropriate errors
          throw new WalletError(
            WalletErrorCode.INVALID_PROJECT_ID,
            "Failed to initialize AppKit: Invalid WalletConnect Project ID. Please verify your NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID configuration.",
            error
          );
        } else if (
          errorMessage.includes("adapter") ||
          errorMessage.includes("provider") ||
          errorMessage.includes("invalid adapter") ||
          errorMessage.includes("missing adapter")
        ) {
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            "Failed to initialize AppKit: Invalid adapter configuration. Please check your Hedera adapter setup.",
            error
          );
        } else if (
          errorMessage.includes("metadata") ||
          errorMessage.includes("invalid metadata") ||
          errorMessage.includes("malformed metadata")
        ) {
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            "Failed to initialize AppKit: Invalid application metadata. Please check your app configuration.",
            error
          );
        } else if (
          errorMessage.includes("unsupported") ||
          errorMessage.includes("not supported") ||
          errorMessage.includes("incompatible") ||
          errorMessage.includes("browser")
        ) {
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            "Failed to initialize AppKit: Unsupported browser or environment. Please use a modern browser with WalletConnect support.",
            error
          );
        } else {
          // Requirement 14.5: Wrap unknown errors with original error
          throw new WalletError(
            WalletErrorCode.INITIALIZATION_FAILED,
            `Failed to initialize AppKit: ${err?.message || "Unknown AppKit initialization error"}`,
            error
          );
        }
      }

      // Set up session event listeners
      this.setupSessionListeners();

      // Automatically clean invalid sessions on startup (disabled in dev to avoid conflicts)
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      if (!isDevelopment) {
        console.log("🧹 Checking for invalid sessions on startup...");
        const cleanupResult = cleanInvalidSessions();
        if (cleanupResult.cleaned) {
          console.log("✅ Cleaned invalid session on startup:", cleanupResult.reason);
        } else {
          console.log("ℹ️ No invalid sessions found:", cleanupResult.reason);
        }
      }

      // Attempt to restore existing session
      // The restoration logic is now handled by the service and the hook.
      // We don't need to await here, as the hook will call restoreExistingSession
      // and the listener will update the state.
      // But for completeness, let's keep the call, as it triggers AppKit's internal restoration.
      await this.restoreExistingSession();

      this.isInitialized = true;
      console.log("✅ Wallet service initialized successfully");
    } catch (error) {
      // Requirement 14.5: Wrap unknown errors in WalletError with original error
      const walletError =
        error instanceof WalletError
          ? error
          : new WalletError(
            WalletErrorCode.UNKNOWN_ERROR,
            "Failed to initialize Hedera Wallet service with HederaProvider",
            error
          );
      console.error("❌ Failed to initialize Hedera Wallet service:", walletError);
      throw walletError;
    }
  }

  /**
   * Set up AppKit session event listeners
   * Listens for account changes, network changes, and session updates
   * Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
   */
  private lastStateChangeTime = 0;
  private setupSessionListeners(): void {
    if (!this.appKitInstance) return;

    try {
      // Subscribe to AppKit state changes
      // This handles account changes, network changes, and disconnection
      if (typeof this.appKitInstance.subscribeState === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.appKitInstance.subscribeState((state: any) => {
          // Debounce state changes to prevent rapid-fire events (max 1 per 100ms)
          const now = Date.now();
          if (now - this.lastStateChangeTime < 100) {
            return;
          }
          this.lastStateChangeTime = now;

          this.handleAppKitStateChange(state as Record<string, unknown>);
        });
        console.log("AppKit event listeners configured successfully");
      } else {
        console.warn(
          "AppKit subscribeState method not available, using polling only"
        );
      }

      // Set up additional event listeners if available
      // These handle specific events like account changes and network changes
      if (this.hederaProvider && typeof this.hederaProvider.on === "function") {
        // Listen for account changes (Requirement 6.1)
        this.hederaProvider.on("accountsChanged", (accounts: string[]) => {
          this.handleAccountsChanged(accounts);
        });

        // Listen for network/chain changes (Requirement 6.2)
        this.hederaProvider.on("chainChanged", (chainId: string) => {
          this.handleChainChanged(chainId);
        });

        // Listen for session updates
        this.hederaProvider.on("session_update", (session: unknown) => {
          this.handleSessionUpdate(session);
        });

        // Listen for session deletion (Requirement 6.3)
        this.hederaProvider.on("session_delete", () => {
          this.handleSessionDelete();
        });

        // Listen for disconnect events
        this.hederaProvider.on("disconnect", () => {
          this.handleDisconnect();
        });

        console.log("HederaProvider event listeners configured successfully");
      }
    } catch (error) {
      console.warn("Could not set up event listeners:", error);
      // Fallback to polling in connectWallet method
    }
  }

  /**
   * Handle AppKit state changes
   * Called when AppKit state changes (account, network, connection status)
   * Requirement 6.4: Update React context on connection state changes
   */
  private lastInvalidAddressLog = 0;
  private invalidAddressCount = 0;
  private isCleaningSession = false;

  private handleAppKitStateChange(state: Record<string, unknown>): void {
    // Prevent processing during cleanup to avoid infinite loops
    if (this.isCleaningSession) {
      return;
    }

    try {
      const stateAny = state as {
        address?: string;
        selectedNetworkId?: string;
        chainId?: string;
        isConnected?: boolean;
      };

      // CRITICAL FIX: Never use selectedNetworkId as address - it's a chain ID!
      const address = stateAny.address; // Only use actual address
      const chainId = stateAny.chainId || stateAny.selectedNetworkId;
      const isConnected = stateAny.isConnected || !!address;

      // Ignore transient undefined/false during Fast Refresh or modal transitions
      // Do not downgrade an already connected state on temporary undefined states
      if ((!address || !isConnected) && this.connectionState?.isConnected) {
        return;
      }

      // Debug log to track event firing
      console.log("📡 handleAppKitStateChange called:", {
        address: address?.substring(0, 20) + '...',
        chainId,
        isConnected,
        hasConnectionState: !!this.connectionState
      });

      // CRITICAL FIX: Block invalid addresses IMMEDIATELY before any logging or processing
      if (address && (
        address === 'eip155:295' ||
        address === 'eip155:296' ||
        address === 'hedera:testnet' ||
        address === 'hedera:mainnet' ||
        address === chainId ||
        (address.startsWith('eip155:') && address.length < 20) ||
        (address.startsWith('hedera:') && !address.match(/hedera:\w+:\d+\.\d+\.\d+$/))
      )) {
        // Throttle logging to prevent console spam (log once every 5 seconds)
        const now = Date.now();
        if (now - this.lastInvalidAddressLog > 5000) {
          console.warn("🚫 BLOCKED invalid address from AppKit:", address);
          this.lastInvalidAddressLog = now;
          this.invalidAddressCount++;

          // If we've seen this error multiple times, force cleanup once
          if (this.invalidAddressCount === 3 && !this.isCleaningSession) {
            console.warn("⚠️ Multiple invalid addresses detected, forcing cleanup");
            this.clearInvalidSession();
          }
        }
        return; // Exit immediately without any further processing
      }

      // Only log valid state changes to reduce console noise
      if (address && address !== chainId) {
        console.log("AppKit state changed:", { address, chainId, isConnected });
      }

      // CRITICAL: Validate that we have a real address, not a chain ID
      if (isConnected && address && address !== chainId) {

        // Additional validation for address format
        const detectedNamespace = chainId?.includes("eip155") ? "eip155" : "hedera";

        // For Hedera namespace, ensure proper account ID format
        if (detectedNamespace === "hedera" && !address.match(/^\d+\.\d+\.\d+$/)) {
          console.warn("🚫 Invalid Hedera account ID format from AppKit:", address);
          this.clearInvalidSession();
          return;
        }

        // For EVM namespace, ensure proper address format
        if (detectedNamespace === "eip155" && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
          console.warn("🚫 Invalid EVM address format from AppKit:", address);
          this.clearInvalidSession();
          return;
        }

        const newConnectionState: WalletConnection = {
          accountId: address,
          network: chainId?.includes("mainnet") ? "mainnet" : "testnet",
          isConnected: true,
          namespace: detectedNamespace,
          chainId: chainId || "hedera:testnet",
        };

        // Only update if state actually changed
        if (
          !this.connectionState ||
          this.connectionState.accountId !== newConnectionState.accountId ||
          this.connectionState.chainId !== newConnectionState.chainId
        ) {
          console.log("✅ Valid address - updating connection state:", newConnectionState);
          this.connectionState = newConnectionState;
          this.saveSession();
          debugAddress(this.connectionState.accountId, "Valid AppKit State");
        }
      } else if (!isConnected && this.connectionState) {
        // Handle disconnection (Requirement 6.3)
        console.log("Wallet disconnected via AppKit state change");
        this.connectionState = null;
        this.clearSavedSession();
      }
    } catch (error) {
      console.error("Error handling AppKit state change:", error);
    }
  }

  /**
   * Handle account changes from wallet
   * Requirement 6.1: Receive notification from AppKit when wallet account changes
   */
  private handleAccountsChanged(accounts: string[]): void {
    console.log("Accounts changed:", accounts);

    if (accounts.length === 0) {
      // No accounts available - wallet disconnected
      if (this.connectionState) {
        console.log("No accounts available - disconnecting");
        this.connectionState = null;
        this.clearSavedSession();
      }
      return;
    }

    // Update connection state with new account
    const newAccountId = accounts[0];
    if (this.connectionState && this.connectionState.accountId !== newAccountId) {
      console.log(`Account changed from ${this.connectionState.accountId} to ${newAccountId}`);
      this.connectionState = {
        ...this.connectionState,
        accountId: newAccountId,
      };
      this.saveSession();
    }
  }

  /**
   * Handle network/chain changes from wallet
   * Requirement 6.2: Update connection state with new network
   */
  private handleChainChanged(chainId: string): void {
    console.log("Chain changed:", chainId);

    if (!this.connectionState) return;

    // Parse chain ID to determine namespace and network
    const detectedNamespace = chainId.includes("eip155") ? "eip155" : "hedera";
    const network = chainId.includes("mainnet") ? "mainnet" : "testnet";

    // Update connection state with new network information
    if (
      this.connectionState.chainId !== chainId ||
      this.connectionState.namespace !== detectedNamespace ||
      this.connectionState.network !== network
    ) {
      console.log(`Network changed to ${network} (${detectedNamespace})`);
      this.connectionState = {
        ...this.connectionState,
        chainId,
        namespace: detectedNamespace,
        network,
      };
      this.saveSession();
    }
  }

  /**
   * Handle session updates
   * Called when WalletConnect session is updated
   */
  private handleSessionUpdate(session: unknown): void {
    console.log("Session updated:", session);
    // Session updates are handled by AppKit and HederaProvider
    // We just log for debugging purposes
  }

  /**
   * Handle session deletion
   * Requirement 6.3: Clean up local connection state when session is deleted
   */
  private handleSessionDelete(): void {
    console.log("Session deleted - cleaning up connection state");

    if (this.connectionState) {
      this.connectionState = null;
      this.clearSavedSession();
      console.log("Connection state cleared due to session deletion");
    }
  }

  /**
   * Handle disconnect events
   * Clean up connection state when wallet disconnects
   */
  private handleDisconnect(): void {
    console.log("Wallet disconnected - cleaning up connection state");

    if (this.connectionState) {
      this.connectionState = null;
      this.clearSavedSession();
      console.log("Connection state cleared due to disconnect");
    }
  }

  /**
   * Remove all event listeners
   * Called during cleanup or when reinitializing
   * Requirement 6.5: Clean up AppKit and HederaProvider event listeners
   */
  private removeEventListeners(): void {
    if (!this.hederaProvider) return;

    try {
      // Note: Since we use arrow functions in setupSessionListeners,
      // we can't remove individual listeners. Instead, we rely on
      // the provider being set to null during cleanup.
      // This is acceptable as the service is a singleton and cleanup
      // only happens during app shutdown or reinitialization.

      console.log("Event listeners will be cleaned up with provider instance");
    } catch (error) {
      console.warn("Error removing event listeners:", error);
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
   * Clear invalid sessions and reset connection state
   */
  private clearInvalidSession(): void {
    // Prevent re-entry during cleanup
    if (this.isCleaningSession) {
      return;
    }

    this.isCleaningSession = true;
    console.log("🧹 Clearing invalid session and resetting connection state");

    // Clear state first to prevent further processing
    this.connectionState = null;
    this.clearSavedSession();

    // Clear WalletConnect storage directly (without triggering disconnect events)
    this.clearWalletConnectStorage();

    // Reset counters
    this.invalidAddressCount = 0;
    this.lastInvalidAddressLog = 0;

    // Only disconnect from AppKit if absolutely necessary
    // This is commented out to prevent triggering new state change events
    // The storage cleanup above should be sufficient
    /*
    if (this.appKitInstance) {
      try {
        this.appKitInstance.disconnect().catch(() => {});
        this.appKitInstance.close().catch(() => {});
      } catch (error) {
        console.warn("Error during AppKit cleanup:", error);
      }
    }
    */

    // Reset flag after a short delay to allow cleanup to complete
    setTimeout(() => {
      this.isCleaningSession = false;
    }, 2000);
  }

  /**
   * Clear WalletConnect storage to prevent session restoration
   */
  private clearWalletConnectStorage(): void {
    try {
      const wcKeys = [
        'wc@2:client:0.3//session',
        'wc@2:core:0.3//keychain',
        'wc@2:core:0.3//messages',
        'wc@2:core:0.3//subscription',
        'wc@2:core:0.3//history',
        'wc@2:core:0.3//expirer',
        'wc@2:universal_provider:/optionalNamespaces',
        'wc@2:universal_provider:/namespaces',
        'wc@2:universal_provider:/sessionProperties'
      ];

      wcKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Cleared WalletConnect key: ${key}`);
        }
      });

      // Clear any AppKit specific storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('appkit') || key.startsWith('reown')) {
          localStorage.removeItem(key);
          console.log(`Cleared AppKit key: ${key}`);
        }
      });
    } catch (error) {
      console.warn("Error clearing WalletConnect storage:", error);
    }
  }

  /**
   * Restore existing session on startup
   * AppKit handles session persistence automatically via WalletConnect
   */
  private async restoreExistingSession(): Promise<WalletConnection | null> {
    if (!this.appKitInstance || !this.hederaProvider) return null;

    try {
      // PRIORITY: Try to get accounts directly from HederaProvider session first
      // This is the most reliable source after QR code approval
      try {
        const providerWithSession = this.hederaProvider as UniversalProvider & {
          session?: SessionTypes.Struct;
        };

        if (providerWithSession.session) {
          const accounts = Object.values(providerWithSession.session.namespaces).flatMap(
            (namespace) => namespace.accounts
          );

          if (accounts.length > 0) {
            // Parse the first account address
            const accountStr = accounts[0];
            const parsed = this.parseAccountAddress(accountStr);

            this.connectionState = {
              accountId: parsed.accountId,
              network: parsed.network,
              isConnected: true,
              namespace: parsed.namespace,
              chainId: parsed.chainId,
            };

            this.saveSession();
            console.log("✅ Restored session from HederaProvider (priority):", this.connectionState);
            return this.connectionState;
          }
        }
      } catch (error) {
        console.warn("Could not get accounts from HederaProvider session:", error);
      }

      // Check if AppKit has an existing session
      const state = this.appKitInstance.getState?.() || {};
      const stateAny = state as {
        address?: string;
        selectedNetworkId?: string;
        chainId?: string;
        isConnected?: boolean;
      };

      // CRITICAL FIX: Never use selectedNetworkId as address - it's a chain ID!
      const address = stateAny.address; // Only use actual address
      const isConnected = stateAny.isConnected || !!address;

      if (isConnected && address) {

        // Fallback to AppKit state if provider doesn't have accounts
        const chainId = stateAny.chainId || stateAny.selectedNetworkId;
        const detectedNamespace = chainId?.includes("eip155")
          ? "eip155"
          : "hedera";

        console.log("AppKit fallback state:", { address, chainId, detectedNamespace });
        debugAddress(address, "AppKit Fallback Address");

        // Validate that we have a proper address, not just a chain ID
        if (!address ||
          address === chainId ||
          address.startsWith('eip155:') ||
          address.startsWith('hedera:') ||
          address === 'eip155:295' ||
          address === 'eip155:296' ||
          address === 'hedera:testnet' ||
          address === 'hedera:mainnet') {
          console.warn("🚫 Invalid or incomplete address from AppKit state. Force clearing session:", address);
          debugAddress(address, "Invalid Restore Address");

          // Force clear and prevent restoration
          this.clearInvalidSession();

          // Also force AppKit to reset its state (only if connected)
          if (this.appKitInstance) {
            try {
              const currentState = this.appKitInstance.getState?.() as any;
              const isCurrentlyConnected = currentState?.address && currentState?.isConnected;
              if (isCurrentlyConnected) {
                // Reset AppKit to clean state only if actually connected
                this.appKitInstance.disconnect();
              }
            } catch (error) {
              console.warn("Error resetting AppKit state:", error);
            }
          }

          return null;
        }

        // For EVM namespace, we need to convert the address to Hedera format
        // The address from AppKit state might be in EVM format (0x...) or chain format (eip155:295)
        let accountId = address;

        if (detectedNamespace === "eip155") {
          // If we have an EVM address, we need to get the corresponding Hedera account
          // For now, we'll skip restoration for EVM addresses since we can't reliably convert them
          // The user will need to reconnect their wallet
          console.warn("Cannot restore EVM session without proper Hedera account mapping. User needs to reconnect.");
          return null;
        }

        // Additional validation for Hedera addresses
        if (detectedNamespace === "hedera" && !accountId.match(/^\d+\.\d+\.\d+$/)) {
          console.warn("Invalid Hedera account ID format. Skipping session restoration:", accountId);
          return null;
        }

        this.connectionState = {
          accountId,
          network: chainId?.includes("mainnet") ? "mainnet" : "testnet",
          isConnected: true,
          namespace: detectedNamespace,
          chainId: chainId || "hedera:testnet",
        };

        console.log("Restored session from AppKit:", this.connectionState);
        debugAddress(this.connectionState.accountId, "Restored Session");
        return this.connectionState;
      }

      // Fallback: Try to load saved session from localStorage
      const savedSession = this.loadSavedSession();
      if (savedSession) {
        console.log("Found saved session in localStorage (AppKit will restore)");
        // AppKit will handle the actual reconnection
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
   * Opens AppKit modal for wallet connection and extracts account information from session
   */
  async connectWallet(
    namespace: "hedera" | "eip155" = "hedera"
  ): Promise<WalletConnection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.appKitInstance) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "AppKit not initialized"
      );
    }

    try {
      // Check if already connected
      if (this.connectionState?.isConnected) {
        return this.connectionState;
      }

      console.log("Opening AppKit modal...");

      // Requirement 14.2: Handle AppKit connection rejection errors
      // Open AppKit modal for wallet selection
      // AppKit handles wallet selection and namespace selection via its UI
      try {
        await this.appKitInstance.open();
      } catch (error) {
        const err = error as { message?: string; code?: string; name?: string };
        const errorMessage = (err?.message || "").toLowerCase();
        const errorCode = err?.code || "";
        const errorName = err?.name || "";

        // Enhanced error detection for AppKit modal errors
        if (
          errorMessage.includes("rejected") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("cancelled") ||
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied") ||
          errorCode.includes("REJECTED") ||
          errorCode.includes("DENIED") ||
          errorName.includes("Rejection")
        ) {
          throw new WalletError(
            WalletErrorCode.CONNECTION_REJECTED,
            "Connection rejected by user. Please try connecting again and approve the connection in your wallet.",
            error
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("timed out") ||
          errorMessage.includes("expired") ||
          errorMessage.includes("proposal expired") ||
          errorCode.includes("TIMEOUT") ||
          errorName.includes("Timeout")
        ) {
          throw new WalletError(
            WalletErrorCode.CONNECTION_TIMEOUT,
            "Connection timeout. The wallet connection request expired. Please try again.",
            error
          );
        } else if (
          errorMessage.includes("project") && errorMessage.includes("id") ||
          errorMessage.includes("projectid") ||
          errorMessage.includes("invalid project") ||
          errorCode.includes("PROJECT_ID") ||
          errorName.includes("ProjectId")
        ) {
          // Requirement 14.4: Validate projectId and throw appropriate errors
          throw new WalletError(
            WalletErrorCode.INVALID_PROJECT_ID,
            "Invalid WalletConnect Project ID. Please check your configuration and try again.",
            error
          );
        } else if (
          errorMessage.includes("not installed") ||
          errorMessage.includes("wallet not found") ||
          errorMessage.includes("no wallet") ||
          errorMessage.includes("missing wallet") ||
          errorCode.includes("WALLET_NOT_FOUND") ||
          errorName.includes("WalletNotFound")
        ) {
          throw new WalletError(
            WalletErrorCode.WALLET_NOT_INSTALLED,
            "Wallet not found. Please install HashPack or another compatible Hedera wallet.",
            error
          );
        } else if (
          (errorMessage.includes("network") && !errorMessage.includes("timeout")) ||
          errorMessage.includes("fetch") ||
          (errorMessage.includes("connection") && !errorMessage.includes("timeout") && !errorMessage.includes("unexpected")) ||
          errorMessage.includes("cors") ||
          errorMessage.includes("unreachable") ||
          errorCode.includes("NETWORK") ||
          errorName.includes("Network")
        ) {
          // Requirement 14.3: Add network error handling specific to AppKit
          // Only classify as network error if it's not already a timeout or unexpected generic error
          throw new WalletError(
            WalletErrorCode.NETWORK_ERROR,
            "Network error while opening AppKit modal. Please check your internet connection and try again.",
            error
          );
        } else if (
          errorMessage.includes("modal") ||
          errorMessage.includes("ui") ||
          errorMessage.includes("interface") ||
          errorMessage.includes("display")
        ) {
          throw new WalletError(
            WalletErrorCode.UNKNOWN_ERROR,
            "Failed to display wallet connection interface. Please refresh the page and try again.",
            error
          );
        } else {
          // Requirement 14.5: Wrap unknown errors with original error
          throw new WalletError(
            WalletErrorCode.UNKNOWN_ERROR,
            `Failed to open AppKit modal: ${err?.message || "Unknown error occurred while opening wallet connection interface"}`,
            error
          );
        }
      }

      // Try to resolve immediately from provider session namespaces (QR approved on mobile)
      try {
        const providerWithSession = this.hederaProvider as UniversalProvider & { session?: SessionTypes.Struct };
        const sess = providerWithSession?.session;
        if (sess) {
          const accounts = Object.values(sess.namespaces).flatMap(ns => ns.accounts);
          if (accounts.length > 0) {
            const parsed = this.parseAccountAddress(accounts[0]);
            this.connectionState = {
              accountId: parsed.accountId,
              network: parsed.network,
              isConnected: true,
              namespace: parsed.namespace as any,
              chainId: parsed.chainId,
            };
            this.saveSession();
            console.log("✅ Connected (provider session accounts):", this.connectionState);
            return this.connectionState;
          }
        }
      } catch {/* continue to event/polling */}

      // Wait for connection with polling
      // AppKit's built-in session persistence will handle reconnection on page reload
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Check one last time before rejecting
          if (this.connectionState?.isConnected) {
            console.log("✅ Connection succeeded just before timeout");
            resolve(this.connectionState);
          } else {
            console.warn("⏱️ Connection timeout - no valid address received");
            reject(
              new WalletError(
                WalletErrorCode.CONNECTION_TIMEOUT,
                "Connection timeout. Please try again."
              )
            );
          }
        }, 240000); // 240 second timeout (4 minutes)

        let checkCount = 0;
        const maxChecks = 480; // 240 seconds with 500ms intervals (4 minutes)

        // Prefer event-driven resolve: wait for first valid state change
        const eventDrivenResolve = new Promise<WalletConnection>((eventResolve, eventReject) => {
          try {
            const unsubscribe = (this.appKitInstance as any)?.subscribeState?.((raw: any) => {
              try {
                const addr = raw?.address;
                const connected = raw?.isConnected;
                const chId = raw?.chainId || raw?.selectedNetworkId;

                if (addr && connected) {
                  // Validate Hedera vs EVM as plus haut
                  let finalAccountId = addr;
                  const detectedNamespace = chId?.includes("eip155") ? "eip155" : "hedera";
                  if (detectedNamespace === "eip155") {
                    const hederaAccountId = extractHederaAccountId(addr);
                    if (hederaAccountId) finalAccountId = hederaAccountId;
                  }
                  if (detectedNamespace === "hedera" && !finalAccountId.match(/^\d+\.\d+\.\d+$/)) {
                    return; // wait for proper account id
                  }

                  this.connectionState = {
                    accountId: finalAccountId,
                    network: chId?.includes("mainnet") ? "mainnet" : "testnet",
                    isConnected: true,
                    namespace: detectedNamespace as any,
                    chainId: chId || `${namespace}:testnet`,
                  };
                  this.saveSession();
                  if (typeof unsubscribe === 'function') unsubscribe();
                  clearTimeout(timeout);
                  console.log("✅ AppKit connected via event (no polling):", this.connectionState);
                  eventResolve(this.connectionState);
                }
              } catch {}
            });
            // Safety timeout handled by outer timeout
          } catch (e) {
            // ignore, fallback to polling
          }
        });

        const checkConnection = () => {
          checkCount++;

          // Check if connection state was updated by event listeners
          if (this.connectionState?.isConnected) {
            clearTimeout(timeout);
            console.log("✅ AppKit connected successfully via event listener:", this.connectionState);
            resolve(this.connectionState);
            return;
          }

          // Extract account information from AppKit session
          try {
            const state = this.appKitInstance?.getState?.() || {};
            const stateAny = state as {
              address?: string;
              selectedNetworkId?: string;
              chainId?: string;
              isConnected?: boolean;
            };

            // CRITICAL FIX: Never use selectedNetworkId as address - it's a chain ID!
            const address = stateAny.address; // Only use actual address
            const isConnected = stateAny.isConnected;

            // Log state every 10 checks for debugging
            if (checkCount % 10 === 0) {
              console.log(`🔍 Connection check ${checkCount}:`, {
                address,
                isConnected,
                hasConnectionState: !!this.connectionState
              });
            }

            if (address && isConnected) {
              // Validate that we have a proper address, not just a chain ID
              if (address === stateAny.chainId ||
                address === 'eip155:295' ||
                address === 'eip155:296' ||
                address === 'hedera:testnet' ||
                address === 'hedera:mainnet' ||
                (address.startsWith('eip155:') && address.length < 20) ||
                (address.startsWith('hedera:') && !address.match(/hedera:\w+:\d+\.\d+\.\d+$/))) {
                // Invalid address - continue polling
                if (checkCount % 10 === 0) {
                  console.warn("⚠️ Invalid address from AppKit:", address);
                }
                // Don't return yet - continue polling
              } else {
                // Valid address found!

                clearTimeout(timeout);

                // Extract network and chainId from AppKit state
                const chainId = stateAny.chainId || stateAny.selectedNetworkId;
                const detectedNamespace = chainId?.includes("eip155")
                  ? "eip155"
                  : "hedera";

                // For EVM namespace, try to extract Hedera account ID
                let finalAccountId = address;
                debugAddress(address, "AppKit Connection");

                if (detectedNamespace === "eip155") {
                  const hederaAccountId = extractHederaAccountId(address);
                  if (hederaAccountId) {
                    finalAccountId = hederaAccountId;
                    console.log("✅ Extracted Hedera account ID from EVM address:", hederaAccountId);
                  } else {
                    // If we can't extract a Hedera account ID, we'll use the EVM address
                    // but this will limit functionality (e.g., balance queries won't work)
                    console.warn("⚠️ Using EVM address as account ID. Some features may be limited:", address);
                  }
                }

                // Additional validation for Hedera addresses
                if (detectedNamespace === "hedera" && !finalAccountId.match(/^\d+\.\d+\.\d+$/)) {
                  console.warn("⚠️ Invalid Hedera account ID format:", finalAccountId);
                  // Continue polling - wait for proper address
                  return;
                }

                // Update connection state with accountId, network, and namespace
                this.connectionState = {
                  accountId: finalAccountId,
                  network: chainId?.includes("mainnet") ? "mainnet" : "testnet",
                  isConnected: true,
                  namespace: detectedNamespace,
                  chainId: chainId || `${namespace}:testnet`,
                };

                // Save session to localStorage for persistence
                this.saveSession();

                console.log(
                  "✅ AppKit connected successfully via polling:",
                  this.connectionState
                );
                resolve(this.connectionState);
                return;
              }
            }
          } catch (error) {
            // Log errors periodically to avoid console spam
            if (checkCount % 10 === 0) {
              console.warn(`⚠️ AppKit connection check ${checkCount} error:`, error);
            }
          }

          // Check if max attempts reached
          if (checkCount >= maxChecks) {
            clearTimeout(timeout);
            console.warn("⏱️ Max connection checks reached");

            // One final check
            if (this.connectionState?.isConnected) {
              console.log("✅ Connection succeeded on final check");
              resolve(this.connectionState);
            } else {
              reject(
                new WalletError(
                  WalletErrorCode.CONNECTION_TIMEOUT,
                  "Connection timeout - no response from wallet"
                )
              );
            }
          } else {
            // Continue polling
            setTimeout(checkConnection, 500);
          }
        };

        // Race event-driven resolve vs polling
        console.log("🔄 Starting connection (event + polling)...");
        Promise.race([
          eventDrivenResolve,
          new Promise<WalletConnection>((res, rej) => {
            const poll = () => {
              checkConnection();
              if (this.connectionState?.isConnected) res(this.connectionState);
              else setTimeout(poll, 500);
            };
            poll();
          })
        ]).then(resolve).catch(() => {
          // let polling/error handlers above handle rejection
        });
      });
    } catch (error: unknown) {
      // Requirement 14.5: Wrap unknown errors in WalletError with original error
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string; code?: string; name?: string };
      const errorMessage = (err?.message || "").toLowerCase();
      const errorCode = err?.code || "";
      const errorName = err?.name || "";

      // Requirement 14.2: Handle AppKit connection rejection errors with enhanced detection
      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("user denied") ||
        errorCode.includes("REJECTED") ||
        errorCode.includes("DENIED") ||
        errorName.includes("Rejection")
      ) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_REJECTED,
          "Connection rejected by user. Please approve the connection request in your wallet to continue.",
          error
        );
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("proposal expired") ||
        errorMessage.includes("timed out") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("time limit") ||
        errorCode.includes("TIMEOUT") ||
        errorCode.includes("EXPIRED") ||
        errorName.includes("Timeout")
      ) {
        throw new WalletError(
          WalletErrorCode.CONNECTION_TIMEOUT,
          "Connection timeout. The wallet connection request expired. Please try connecting again.",
          error
        );
      } else if (
        errorMessage.includes("project id") ||
        errorMessage.includes("projectid") ||
        errorMessage.includes("invalid project") ||
        errorMessage.includes("missing project") ||
        errorCode.includes("PROJECT_ID") ||
        errorName.includes("ProjectId")
      ) {
        // Requirement 14.4: Validate projectId and throw appropriate errors
        throw new WalletError(
          WalletErrorCode.INVALID_PROJECT_ID,
          "Invalid WalletConnect Project ID. Please check your NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID configuration.",
          error
        );
      } else if (
        errorMessage.includes("not installed") ||
        errorMessage.includes("wallet not found") ||
        errorMessage.includes("no wallet") ||
        errorMessage.includes("missing wallet") ||
        errorMessage.includes("wallet unavailable") ||
        errorCode.includes("WALLET_NOT_FOUND") ||
        errorName.includes("WalletNotFound")
      ) {
        throw new WalletError(
          WalletErrorCode.WALLET_NOT_INSTALLED,
          "Wallet not found. Please install HashPack or another compatible Hedera wallet and try again.",
          error
        );
      } else if (
        errorMessage.includes("session") ||
        errorMessage.includes("invalid session") ||
        errorMessage.includes("session expired") ||
        errorCode.includes("SESSION") ||
        errorName.includes("Session")
      ) {
        throw new WalletError(
          WalletErrorCode.INVALID_SESSION,
          "Invalid or expired wallet session. Please reconnect your wallet.",
          error
        );
      } else if (
        (errorMessage.includes("network") && !errorMessage.includes("timeout")) ||
        errorMessage.includes("fetch") ||
        (errorMessage.includes("connection") && !errorMessage.includes("timeout") && !errorMessage.includes("unexpected")) ||
        errorMessage.includes("cors") ||
        errorMessage.includes("unreachable") ||
        errorMessage.includes("dns") ||
        errorCode.includes("NETWORK") ||
        errorName.includes("Network")
      ) {
        // Requirement 14.3: Add network error handling specific to AppKit
        // Only classify as network error if it's not already a timeout or unexpected generic error
        throw new WalletError(
          WalletErrorCode.NETWORK_ERROR,
          "Network connection error. Please check your internet connection and try again.",
          error
        );
      } else {
        // Requirement 14.5: Wrap unknown errors in WalletError with UNKNOWN_ERROR and original error
        throw new WalletError(
          WalletErrorCode.UNKNOWN_ERROR,
          `Unable to connect to wallet: ${err?.message || "An unknown error occurred during wallet connection"}`,
          error
        );
      }
    }
  }

  /**
   * Create DAppSigner instances from a WalletConnect session
   * Requirements: 7.1, 7.2
   */
  private async createSignersFromSession(session: SessionTypes.Struct): Promise<DAppSigner[]> {
    const signers: DAppSigner[] = [];

    if (!this.hederaProvider) {
      console.warn("HederaProvider not available for creating signers");
      return signers;
    }

    // Get the WalletConnect client from the provider
    // HederaProvider is a UniversalProvider which has a client property
    const providerWithClient = this.hederaProvider as UniversalProvider & {
      client?: unknown;
    };
    const signClient = providerWithClient.client;

    if (!signClient) {
      console.warn("SignClient not available from HederaProvider");
      return signers;
    }

    // Extract accounts from the session namespaces
    const accounts = Object.values(session.namespaces).flatMap(
      (namespace) => namespace.accounts
    );

    for (const account of accounts) {
      try {
        // Format: hedera:testnet:0.0.12345 or hedera:mainnet:0.0.12345
        const parts = account.split(":");
        if (parts.length >= 3 && parts[0] === "hedera") {
          const network = parts[1]; // mainnet or testnet
          const accountIdStr = parts[2]; // 0.0.12345

          // Use SDK wrapper to avoid build-time issues
          const { createAccountId, getLedgerId } = await import("@/lib/hedera/sdk-wrapper");

          // Create AccountId from string
          const accountId = await createAccountId(accountIdStr);

          // Determine LedgerId based on network
          const ledgerId = await getLedgerId(network as 'mainnet' | 'testnet');

          // Create DAppSigner instance
          const signer = new DAppSigner(
            accountId,
            signClient,
            session.topic,
            ledgerId
          );

          signers.push(signer);
          console.log(`Created DAppSigner for account ${accountIdStr} on ${network}`);
        }
      } catch (error) {
        console.error(`Failed to create signer for account ${account}:`, error);
      }
    }

    return signers;
  }

  /**
   * Get or create signers for the current session
   * Requirements: 7.1
   */
  private async getSigners(): Promise<DAppSigner[]> {
    // Return cached signers if available
    if (this.signers.length > 0) {
      return this.signers;
    }

    // Get the current WalletConnect session
    if (!this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "HederaProvider not available"
      );
    }

    try {
      // Access the session from the provider
      const providerWithSession = this.hederaProvider as UniversalProvider & {
        session?: SessionTypes.Struct;
      };
      const session = providerWithSession.session;

      if (!session) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "No active WalletConnect session"
        );
      }

      // Create signers from the session
      this.signers = await this.createSignersFromSession(session);

      if (this.signers.length === 0) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "Failed to create signers from session"
        );
      }

      return this.signers;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Failed to get signers from session",
        error
      );
    }
  }

  /**
   * Sign a native Hedera transaction using DAppSigner
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    // Requirement 7.1: Retrieve the appropriate signer for the namespace
    if (!this.connectionState || !this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    try {
      // Get signers from the current session
      const signers = await this.getSigners();

      if (signers.length === 0) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "No signers available for transaction signing"
        );
      }

      // Use the first signer (primary account)
      // In a multi-account scenario, you might need to select the appropriate signer
      const signer = signers[0];

      console.log(
        `Signing transaction with DAppSigner for account ${signer.getAccountId().toString()}`
      );

      // Requirement 7.2: Use DAppSigner's signTransaction method for signing operations
      // The signTransaction method will send the transaction to the wallet for signing
      const signedTransaction = await signer.signTransaction(transaction);

      // Requirement 7.3: Return the signed transaction result
      console.log("Transaction signed successfully");
      return signedTransaction;
    } catch (error) {
      // Requirement 14.5: Wrap unknown errors in WalletError with original error
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string; code?: string; name?: string };
      const errorMessage = (err?.message || "").toLowerCase();
      const errorCode = err?.code || "";
      const errorName = err?.name || "";

      // Requirement 7.4: Handle wallet rejection with proper error codes - Enhanced detection
      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("transaction rejected") ||
        errorCode.includes("REJECTED") ||
        errorCode.includes("DENIED") ||
        errorName.includes("Rejection")
      ) {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_REJECTED,
          "Transaction rejected by user. Please approve the transaction in your wallet to continue.",
          error
        );
      } else if (
        errorMessage.includes("insufficient") ||
        errorMessage.includes("not enough") ||
        errorMessage.includes("balance too low") ||
        errorMessage.includes("insufficient funds") ||
        errorMessage.includes("insufficient balance") ||
        errorCode.includes("INSUFFICIENT") ||
        errorName.includes("InsufficientBalance")
      ) {
        throw new WalletError(
          WalletErrorCode.INSUFFICIENT_BALANCE,
          "Insufficient balance to complete this transaction. Please check your account balance.",
          error
        );
      } else if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("malformed") ||
        errorMessage.includes("invalid transaction") ||
        errorMessage.includes("bad transaction") ||
        errorMessage.includes("transaction format") ||
        errorCode.includes("INVALID") ||
        errorName.includes("Invalid")
      ) {
        throw new WalletError(
          WalletErrorCode.INVALID_TRANSACTION,
          "Invalid transaction format or parameters. Please check the transaction details and try again.",
          error
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("unreachable") ||
        errorCode.includes("NETWORK") ||
        errorName.includes("Network")
      ) {
        // Requirement 14.3: Add network error handling
        throw new WalletError(
          WalletErrorCode.NETWORK_ERROR,
          "Network error during transaction signing. Please check your connection and try again.",
          error
        );
      } else if (
        errorMessage.includes("session") ||
        errorMessage.includes("not connected") ||
        errorMessage.includes("no session") ||
        errorMessage.includes("session expired") ||
        errorCode.includes("SESSION") ||
        errorName.includes("Session")
      ) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "Wallet session expired or not connected. Please reconnect your wallet and try again.",
          error
        );
      } else {
        // Requirement 7.5: Provide detailed error information to the user
        // Requirement 14.5: Wrap unknown errors with original error
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          `Failed to sign transaction: ${err?.message || "An unknown error occurred during transaction signing"}`,
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
   * Sign a message using HederaAdapter
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async signMessage(message: string): Promise<{ signatureMap: string }> {
    if (!this.connectionState || !this.hederaProvider) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "Wallet not connected"
      );
    }

    try {
      // Requirement 8.1: Use the appropriate adapter for the namespace
      const adapter = this.getActiveAdapter();

      if (!adapter) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "No adapter available for message signing"
        );
      }

      // Requirement 8.2: Format signerAccountId in correct format for the namespace
      const signerAccountId = this.formatAccountIdForNamespace(
        this.connectionState.accountId,
        this.connectionState.namespace
      );

      console.log(
        `Signing message with HederaAdapter for account ${signerAccountId} on namespace ${this.connectionState.namespace}`
      );

      // Requirement 8.3: Use adapter's sign method
      // The adapter will send the signing request to the connected wallet
      // Note: The exact method name may vary based on the HederaAdapter API
      // Common patterns: signMessage, sign, or request with hedera_signMessage method
      const signResult = await this.requestMessageSignature(
        adapter,
        message,
        signerAccountId
      );

      // Requirement 8.5: Validate the signature format
      if (!signResult || typeof signResult !== 'object') {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          "Invalid signature format returned from wallet"
        );
      }

      // Requirement 8.3: Return the signature and signed message
      console.log("Message signed successfully");
      return signResult;
    } catch (error) {
      // Requirement 14.5: Wrap unknown errors in WalletError with original error
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string; code?: string; name?: string };
      const errorMessage = (err?.message || "").toLowerCase();
      const errorCode = err?.code || "";
      const errorName = err?.name || "";

      // Requirement 8.4: Handle wallet rejection with proper error codes - Enhanced detection
      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("message rejected") ||
        errorMessage.includes("signing rejected") ||
        errorCode.includes("REJECTED") ||
        errorCode.includes("DENIED") ||
        errorName.includes("Rejection")
      ) {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_REJECTED,
          "Message signing rejected by user. Please approve the signing request in your wallet to continue.",
          error
        );
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("unreachable") ||
        errorCode.includes("NETWORK") ||
        errorName.includes("Network")
      ) {
        // Requirement 14.3: Add network error handling
        throw new WalletError(
          WalletErrorCode.NETWORK_ERROR,
          "Network error during message signing. Please check your connection and try again.",
          error
        );
      } else if (
        errorMessage.includes("invalid message") ||
        errorMessage.includes("malformed message") ||
        errorMessage.includes("bad message") ||
        errorMessage.includes("message format") ||
        errorCode.includes("INVALID") ||
        errorName.includes("Invalid")
      ) {
        throw new WalletError(
          WalletErrorCode.INVALID_TRANSACTION,
          "Invalid message format. Please check the message content and try again.",
          error
        );
      } else if (
        errorMessage.includes("session") ||
        errorMessage.includes("not connected") ||
        errorMessage.includes("no session") ||
        errorMessage.includes("session expired") ||
        errorCode.includes("SESSION") ||
        errorName.includes("Session")
      ) {
        throw new WalletError(
          WalletErrorCode.NOT_CONNECTED,
          "Wallet session expired or not connected. Please reconnect your wallet and try again.",
          error
        );
      } else if (
        errorMessage.includes("unsupported") ||
        errorMessage.includes("not supported") ||
        errorMessage.includes("method not found") ||
        errorCode.includes("UNSUPPORTED") ||
        errorName.includes("Unsupported")
      ) {
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          "Message signing not supported by the connected wallet. Please try with a different wallet.",
          error
        );
      } else {
        // Requirement 14.5: Wrap unknown errors with original error
        throw new WalletError(
          WalletErrorCode.TRANSACTION_FAILED,
          `Failed to sign message: ${err?.message || "An unknown error occurred during message signing"}`,
          error
        );
      }
    }
  }

  /**
   * Parse account address from WalletConnect format
   * Format: hedera:testnet:0.0.12345 or eip155:296:0x...
   */
  private parseAccountAddress(accountStr: string): {
    accountId: string;
    network: 'mainnet' | 'testnet';
    namespace: 'hedera' | 'eip155';
    chainId: string;
  } {
    const parts = accountStr.split(":");

    if (parts.length >= 3) {
      const namespace = parts[0] as 'hedera' | 'eip155';
      const networkOrChainId = parts[1];
      const accountId = parts[2];

      // Determine network based on namespace
      let network: 'mainnet' | 'testnet';
      let chainId: string;

      if (namespace === 'hedera') {
        // Format: hedera:testnet:0.0.12345 or hedera:mainnet:0.0.12345
        network = networkOrChainId as 'mainnet' | 'testnet';
        chainId = `hedera:${network}`;

        return {
          accountId,
          network,
          namespace,
          chainId,
        };
      } else {
        // Format: eip155:295:0x... (mainnet) or eip155:296:0x... (testnet)
        network = networkOrChainId === '295' ? 'mainnet' : 'testnet';
        chainId = `eip155:${networkOrChainId}`;

        // For EVM addresses, we can't directly use them with Hedera Mirror Node
        // We need to either convert them or handle them differently
        // For now, we'll return the EVM address but mark it appropriately
        return {
          accountId, // This will be 0x... format
          network,
          namespace,
          chainId,
        };
      }
    }

    // Fallback for invalid format
    return {
      accountId: accountStr,
      network: 'testnet',
      namespace: 'hedera',
      chainId: 'hedera:testnet',
    };
  }

  /**
   * Format account ID for the specific namespace
   * Requirement 8.2
   */
  private formatAccountIdForNamespace(
    accountId: string,
    namespace: 'hedera' | 'eip155'
  ): string {
    if (namespace === 'hedera') {
      // Hedera native format: 0.0.xxxxx
      return accountId;
    } else {
      // EVM format: Convert Hedera account to EVM address if needed
      // For now, return as-is since the adapter should handle conversion
      return accountId;
    }
  }



  /**
   * Request message signature from the wallet via adapter
   * Requirement 8.3
   */
  private async requestMessageSignature(
    adapter: HederaAdapter,
    message: string,
    signerAccountId: string
  ): Promise<{ signatureMap: string }> {
    // The HederaAdapter uses WalletConnect protocol under the hood
    // We need to use the request method with the appropriate namespace method
    const namespace = this.connectionState?.namespace || 'hedera';

    try {
      // For Hedera namespace, use hedera_signMessage
      // For EVM namespace, use eth_sign or personal_sign
      const method = namespace === 'hedera' ? 'hedera_signMessage' : 'personal_sign';

      // Prepare the request parameters based on namespace
      const params = namespace === 'hedera'
        ? {
          signerAccountId,
          message,
        }
        : [message, signerAccountId]; // EVM uses array format

      // Use the adapter's underlying provider to make the request
      // Note: This assumes the adapter exposes a request method or similar
      // The exact implementation may need adjustment based on the actual HederaAdapter API
      const result = await (adapter as unknown as { request: (args: { method: string; params: unknown }) => Promise<unknown> }).request({
        method,
        params,
      });

      // Format the result as expected by our interface
      if (typeof result === 'string') {
        return { signatureMap: result };
      } else if (result && typeof result === 'object' && 'signatureMap' in result) {
        return result as { signatureMap: string };
      } else if (result && typeof result === 'object') {
        // Try to extract signature from various possible formats
        const resultObj = result as Record<string, unknown>;
        const signature = resultObj.signature || resultObj.sig || JSON.stringify(result);
        return { signatureMap: String(signature) };
      } else {
        return { signatureMap: JSON.stringify(result) };
      }
    } catch (error) {
      // Re-throw to be handled by the main signMessage method
      throw error;
    }
  }

  /**
   * Disconnect wallet and clean up all sessions
   * Requirement 13.1, 13.2, 13.3, 13.4, 13.5
   */
  async disconnectWallet(): Promise<void> {
    try {
      console.log("Disconnecting wallet...");

      // Call AppKit disconnect methods to clear session (Requirement 13.1)
      if (this.appKitInstance) {
        try {
          await this.appKitInstance.disconnect();
          console.log("AppKit disconnected successfully");
        } catch (error) {
          console.warn("Error disconnecting AppKit:", error);
          // Continue with cleanup even if AppKit disconnect fails
        }
      }

      // Disconnect HederaProvider to clear WalletConnect session
      if (this.hederaProvider && typeof this.hederaProvider.disconnect === 'function') {
        try {
          await this.hederaProvider.disconnect();
          console.log("HederaProvider disconnected successfully");
        } catch (error) {
          console.warn("Error disconnecting HederaProvider:", error);
          // Continue with cleanup even if provider disconnect fails
        }
      }

      // Clear all adapter instances (Requirement 13.2)
      this.nativeAdapter = null;
      this.evmAdapter = null;

      // Clear signers array
      this.signers = [];

      // Clear wallet context state (Requirement 13.3)
      this.connectionState = null;

      // Clear any cached wallet data (Requirement 13.4)
      this.clearSavedSession();

      // Close AppKit modal if open (Requirement 13.5)
      if (this.appKitInstance) {
        try {
          await this.appKitInstance.close();
          console.log("AppKit modal closed");
        } catch (error) {
          console.warn("Error closing AppKit modal:", error);
          // Non-critical error, continue
        }
      }

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);

      // Requirement 14.5: Wrap unknown errors in WalletError with original error
      if (error instanceof WalletError) {
        throw error;
      }

      const err = error as { message?: string; code?: string; name?: string };
      const errorMessage = (err?.message || "").toLowerCase();
      const errorCode = err?.code || "";
      const errorName = err?.name || "";

      if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("unreachable") ||
        errorCode.includes("NETWORK") ||
        errorName.includes("Network")
      ) {
        // Requirement 14.3: Add network error handling
        throw new WalletError(
          WalletErrorCode.NETWORK_ERROR,
          "Network error during wallet disconnection. The wallet may still be disconnected locally.",
          error
        );
      } else if (
        errorMessage.includes("session") ||
        errorMessage.includes("no session") ||
        errorMessage.includes("session not found") ||
        errorCode.includes("SESSION") ||
        errorName.includes("Session")
      ) {
        // Session already cleared, this is not necessarily an error
        console.log("Session already cleared during disconnect");
        return; // Don't throw error for already disconnected state
      } else if (
        errorMessage.includes("already disconnected") ||
        errorMessage.includes("not connected") ||
        errorMessage.includes("no connection")
      ) {
        // Already disconnected, this is not an error
        console.log("Wallet already disconnected");
        return; // Don't throw error for already disconnected state
      } else {
        // Requirement 14.5: Wrap unknown errors with original error
        throw new WalletError(
          WalletErrorCode.UNKNOWN_ERROR,
          `Failed to disconnect wallet: ${err?.message || "An unknown error occurred during wallet disconnection"}`,
          error
        );
      }
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

  /**
   * Get native Hedera adapter instance
   * Used for AppKit initialization and native Hedera transactions
   */
  getNativeAdapter(): HederaAdapter | null {
    return this.nativeAdapter;
  }

  /**
   * Get EVM adapter instance
   * Used for AppKit initialization and EVM transactions
   */
  getEvmAdapter(): HederaAdapter | null {
    return this.evmAdapter;
  }

  /**
   * Get both adapters as an array
   * Convenience method for AppKit initialization
   */
  getAdapters(): HederaAdapter[] {
    const adapters: HederaAdapter[] = [];
    if (this.nativeAdapter) adapters.push(this.nativeAdapter);
    if (this.evmAdapter) adapters.push(this.evmAdapter);
    return adapters;
  }

  /**
   * Get the appropriate adapter based on the active namespace
   * Used for transaction signing
   */
  getActiveAdapter(): HederaAdapter | null {
    const namespace = this.getActiveNamespace();
    if (!namespace) return null;

    return namespace === "hedera" ? this.nativeAdapter : this.evmAdapter;
  }

  /**
   * Get AppKit instance
   * Used for modal operations and AppKit-specific functionality
   */
  getAppKitInstance(): AppKit | null {
    return this.appKitInstance;
  }

  async getAccountBalance(accountId?: string): Promise<WalletBalances> {
    const targetAccountId = accountId || this.connectionState?.accountId;

    if (!targetAccountId) {
      throw new Error("No account ID available for balance query");
    }

    debugAddress(targetAccountId, "Balance Query");

    // Check if the address is valid for Mirror Node API
    if (!isValidForMirrorNode(targetAccountId)) {
      console.warn("Address not valid for Mirror Node API:", targetAccountId);

      // Try to extract Hedera account ID if possible
      const hederaAccountId = extractHederaAccountId(targetAccountId);
      if (hederaAccountId && isValidForMirrorNode(hederaAccountId)) {
        console.log("Using extracted Hedera account ID for balance query:", hederaAccountId);
        return this.getAccountBalance(hederaAccountId);
      }

      // For EVM addresses (0x...), use JSON-RPC endpoint
      if (targetAccountId.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.log("Using JSON-RPC for EVM address balance query:", targetAccountId);
        return this.getEvmAccountBalance(targetAccountId);
      }

      // Unknown address format
      console.error("Unknown address format:", targetAccountId);
      return {
        hbar: "0",
        tokens: [],
      };
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
        // Fetch token metadata in parallel for better performance
        const tokenPromises = accountData.balance.tokens.map(async (token: any) => {
          const metadata = await this.getTokenMetadata(token.token_id, mirrorNodeUrl);
          return {
            tokenId: token.token_id,
            balance: token.balance.toString(),
            decimals: metadata.decimals || token.decimals || 6,
            symbol: metadata.symbol || "UNKNOWN",
            name: metadata.name || "Unknown Token",
          };
        });

        const resolvedTokens = await Promise.all(tokenPromises);
        tokens.push(...resolvedTokens);
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

  /**
   * Get token metadata from Mirror Node API
   * Fetches symbol, name, and decimals for a given token ID
   */
  private async getTokenMetadata(
    tokenId: string,
    mirrorNodeUrl: string
  ): Promise<{ symbol: string; name: string; decimals: number }> {
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/tokens/${tokenId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
      }

      const tokenData = await response.json();

      return {
        symbol: tokenData.symbol || "UNKNOWN",
        name: tokenData.name || "Unknown Token",
        decimals: tokenData.decimals || 6,
      };
    } catch (error) {
      console.warn(`Failed to get metadata for token ${tokenId}:`, error);
      
      // Fallback to static registry for known tokens
      const knownTokens: Record<string, { symbol: string; name: string; decimals: number }> = {
        "0.0.456858": { symbol: "USDC", name: "USD Coin", decimals: 6 },
        // Add more known tokens as needed
      };

      return knownTokens[tokenId] || {
        symbol: "UNKNOWN",
        name: "Unknown Token",
        decimals: 6,
      };
    }
  }

  /**
   * Get account balance for EVM addresses using JSON-RPC
   * Hedera provides JSON-RPC endpoints compatible with Ethereum
   */
  private async getEvmAccountBalance(evmAddress: string): Promise<WalletBalances> {
    try {
      // Dynamic import to avoid SSR issues
      const ethersModule = await import("ethers") as any;
      const { JsonRpcProvider, formatEther, Contract, formatUnits } = ethersModule;

      // Hedera JSON-RPC endpoints
      const rpcUrl =
        env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? "https://mainnet.hashio.io/api"
          : "https://testnet.hashio.io/api";

      // Create provider
      const provider = new JsonRpcProvider(rpcUrl);

      // Get HBAR balance (in wei, need to convert to HBAR)
      const balanceWei = await provider.getBalance(evmAddress);
      const hbarBalance = formatEther(balanceWei);

      console.log(`EVM address ${evmAddress} balance: ${hbarBalance} HBAR`);

      // Get token balances using Mirror Node API
      const tokens: TokenBalance[] = [];
      try {
        const mirrorNodeUrl =
          env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
            ? "https://mainnet-public.mirrornode.hedera.com"
            : "https://testnet.mirrornode.hedera.com";

        // Try to get the Hedera account ID from the EVM address
        const accountResponse = await fetch(
          `${mirrorNodeUrl}/api/v1/accounts?account.publickey=${evmAddress}`
        );

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.accounts && accountData.accounts.length > 0) {
            const hederaAccountId = accountData.accounts[0].account;

            // Get token balances from Mirror Node
            const balanceResponse = await fetch(
              `${mirrorNodeUrl}/api/v1/accounts/${hederaAccountId}`
            );

            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();

              if (balanceData.balance?.tokens && balanceData.balance.tokens.length > 0) {
                // ERC-20 ABI for balanceOf, decimals, symbol, and name
                const erc20Abi = [
                  "function balanceOf(address) view returns (uint256)",
                  "function decimals() view returns (uint8)",
                  "function symbol() view returns (string)",
                  "function name() view returns (string)",
                ];

                for (const token of balanceData.balance.tokens) {
                  try {
                    // Convert Hedera token ID to EVM address
                    const tokenEvmAddress = await this.getTokenEvmAddress(
                      token.token_id,
                      mirrorNodeUrl
                    );

                    if (tokenEvmAddress) {
                      const tokenContract = new Contract(tokenEvmAddress, erc20Abi, provider);

                      // Get token details
                      const [balance, decimals, symbol, name] = await Promise.all([
                        tokenContract.balanceOf(evmAddress),
                        tokenContract.decimals().catch(() => 6),
                        tokenContract.symbol().catch(() => "UNKNOWN"),
                        tokenContract.name().catch(() => "Unknown Token"),
                      ]);

                      tokens.push({
                        tokenId: token.token_id,
                        balance: balance.toString(),
                        decimals: Number(decimals),
                        symbol: symbol,
                        name: name,
                      });
                    } else {
                      // Fallback to Mirror Node metadata
                      const metadata = await this.getTokenMetadata(token.token_id, mirrorNodeUrl);
                      tokens.push({
                        tokenId: token.token_id,
                        balance: token.balance.toString(),
                        decimals: metadata.decimals || token.decimals || 6,
                        symbol: metadata.symbol,
                        name: metadata.name,
                      });
                    }
                  } catch (tokenError) {
                    console.warn(`Failed to get ERC-20 details for token ${token.token_id}:`, tokenError);
                    // Fallback to Mirror Node metadata
                    const metadata = await this.getTokenMetadata(token.token_id, mirrorNodeUrl);
                    tokens.push({
                      tokenId: token.token_id,
                      balance: token.balance.toString(),
                      decimals: metadata.decimals || token.decimals || 6,
                      symbol: metadata.symbol,
                      name: metadata.name,
                    });
                  }
                }
              }
            }
          }
        }
      } catch (tokenError) {
        console.warn("Failed to get token balances for EVM address:", tokenError);
      }

      return {
        hbar: hbarBalance,
        tokens,
      };
    } catch (error) {
      console.error("Failed to get EVM account balance:", error);
      return {
        hbar: "0",
        tokens: [],
      };
    }
  }

  /**
   * Get EVM address for a Hedera token ID
   */
  private async getTokenEvmAddress(
    tokenId: string,
    mirrorNodeUrl: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/tokens/${tokenId}`);
      if (response.ok) {
        const tokenData = await response.json();
        return tokenData.evm_address || null;
      }
    } catch (error) {
      console.warn(`Failed to get EVM address for token ${tokenId}:`, error);
    }
    return null;
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

  /**
   * Force reset AppKit and WalletConnect to clean state
   */
  async forceResetAppKit(): Promise<void> {
    console.log("🔄 Force resetting AppKit and WalletConnect...");

    try {
      // Clear all storage first
      this.clearWalletConnectStorage();
      this.clearSavedSession();

      // Disconnect and reset AppKit
      if (this.appKitInstance) {
        try {
          await this.appKitInstance.disconnect();
          await this.appKitInstance.close();
        } catch (error) {
          console.warn("Error during AppKit reset:", error);
        }
      }

      // Reset connection state
      this.connectionState = null;

      console.log("✅ AppKit force reset completed");
    } catch (error) {
      console.error("Error during force reset:", error);
    }
  }

  /**
   * Clean up resources and event listeners
   * Called when service is destroyed or needs to be reinitialized
   */
  async cleanup(): Promise<void> {
    try {
      console.log("Cleaning up wallet service...");

      // Remove event listeners
      this.removeEventListeners();

      // Disconnect if connected
      if (this.isConnected()) {
        await this.disconnectWallet();
      }

      // Force reset AppKit
      await this.forceResetAppKit();

      // Clear all instances
      this.hederaProvider = null;
      this.nativeAdapter = null;
      this.evmAdapter = null;
      this.appKitInstance = null;
      this.signers = [];
      this.connectionState = null;
      this.isInitialized = false;

      console.log("Wallet service cleaned up successfully");
    } catch (error) {
      console.error("Error during cleanup:", error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

// Export singleton instance with global persistence for Hot Reload
declare global {
  var hederaWalletServiceInstance: HederaWalletService | undefined;
}

// Export singleton instance with build-time safety
export const hederaWalletService = (() => {
  // During build or server-side without proper env, return a mock service
  if (typeof window === 'undefined' && !env.HEDERA_PRIVATE_KEY) {
    return {
      initialize: async () => { },
      connectWallet: async () => ({
        accountId: '',
        network: 'testnet' as const,
        isConnected: false,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet'
      }),
      disconnectWallet: async () => { },
      signTransaction: async (tx: any) => tx,
      signMessage: async () => ({ signatureMap: '' }),
      getConnectionState: () => null,
      isConnected: () => false,
      getAccountId: () => null,
      getActiveNamespace: () => null,
      getNativeAdapter: () => null,
      getEvmAdapter: () => null,
      getAdapters: () => [],
      getActiveAdapter: () => null,
      getAppKitInstance: () => null,
      getAccountBalance: async () => ({ hbar: '0', tokens: [] }),
      getSessions: () => [],
      getActiveSession: () => null,
      signAndExecuteTransaction: async (tx: any) => null,
      cleanup: async () => { },
      isInitialized: false
    } as unknown as HederaWalletService;
  }

  return globalThis.hederaWalletServiceInstance ||
    (globalThis.hederaWalletServiceInstance = new HederaWalletService());
})();
