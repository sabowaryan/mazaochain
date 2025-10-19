// Reown AppKit configuration with HederaAdapter
// This provides a modern, pre-built UI for wallet connections
import { env } from "@/lib/config/env";

// Type for AppKit instance (simplified to avoid type errors)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppKitInstance = any;

let appKitInstance: AppKitInstance | null = null;
let universalProviderInstance: any = null;
let isInitializing = false;
let initPromise: Promise<AppKitInstance> | null = null;

/**
 * Initialize Reown AppKit with Hedera adapters
 * This provides a modern modal UI for wallet connections
 *
 * Note: This is a placeholder implementation. Full AppKit integration
 * requires additional configuration and may need adjustments based on
 * the specific AppKit version and Hedera adapter compatibility.
 */
export async function initializeAppKit(): Promise<AppKitInstance> {
  // Return existing instance if already initialized
  if (appKitInstance) {
    return appKitInstance;
  }

  // If initialization is in progress, wait for it
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Mark as initializing and create promise
  isInitializing = true;
  initPromise = _initializeAppKit();

  try {
    const instance = await initPromise;
    return instance;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
}

async function _initializeAppKit(): Promise<AppKitInstance> {

  // Validate required configuration
  if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    throw new Error(
      "WalletConnect Project ID is required. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment."
    );
  }

  try {
    // Dynamic import to avoid loading AppKit when not needed
    const { createAppKit } = await import("@reown/appkit");
    const { HederaProvider, HederaAdapter, HederaChainDefinition } =
      await import("@hashgraph/hedera-wallet-connect");

    const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    const isMainnet = env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet";
    
    

    // Configure AppKit metadata
    const metadata = {
      name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain ",
      description:
        env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION ||
        "Decentralized lending platform for farmers",
      url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      icons: [
        `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`,
      ],
    };

    // Initialize HederaProvider first (required for Hedera wallet connections)
    // Use cached instance if available to prevent multiple initializations
    if (!universalProviderInstance) {
      universalProviderInstance = (await HederaProvider.init({
        projectId,
        metadata,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as unknown as any; // Type cast to avoid type mismatch
    }
    const universalProvider = universalProviderInstance;

    // Define networks for both Native Hedera and EVM
    const nativeNetworks = isMainnet
      ? [HederaChainDefinition.Native.Mainnet]
      : [HederaChainDefinition.Native.Testnet];

    const evmNetworks = isMainnet
      ? [HederaChainDefinition.EVM.Mainnet]
      : [HederaChainDefinition.EVM.Testnet];

    // Combine all networks
    const allNetworks = [...nativeNetworks, ...evmNetworks];

    // Create Native Hedera adapter
    const hederaNativeAdapter = new HederaAdapter({
      projectId,
      networks: nativeNetworks,
      // @ts-expect-error - namespace type mismatch with library
      namespace: "hedera", // Native Hedera namespace
    });

    // Create EVM adapter
    const hederaEVMAdapter = new HederaAdapter({
      projectId,
      networks: evmNetworks,
      namespace: "eip155", // EVM namespace
    });

    // Initialize AppKit with both adapters
    appKitInstance = createAppKit({
      adapters: [hederaNativeAdapter, hederaEVMAdapter],
      universalProvider,
      projectId,
      metadata,
      networks: allNetworks,
      features: {
        analytics: false, // Disable analytics for privacy
        email: false, // Disable email login
        socials: [], // No social logins
      },
      themeMode: "light",
      themeVariables: {
        "--w3m-accent": "#10b981", // Green accent matching MazaoChain theme
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any); // Use 'as any' to bypass type checking

    return appKitInstance;
  } catch (error) {
    console.error("Failed to initialize AppKit:", error);
    throw new Error(
      "AppKit initialization failed. This feature may require additional configuration or may not be fully compatible with the current Hedera adapter version."
    );
  }
}

/**
 * Get the AppKit instance
 */
export function getAppKit(): AppKitInstance | null {
  return appKitInstance;
}

/**
 * Check if AppKit mode is enabled
 */
export function isAppKitEnabled(): boolean {
  return env.NEXT_PUBLIC_USE_APPKIT === true;
}
