"use client";

import type UniversalProvider from '@walletconnect/universal-provider';
import {
  HederaAdapter,
  HederaChainDefinition
} from '@hashgraph/hedera-wallet-connect';
import { env } from '@/lib/config/env';

/**
 * Configuration interface for AppKit initialization
 */
export interface AppKitConfig {
  adapters: HederaAdapter[];
  universalProvider: UniversalProvider;
}

/**
 * Initialize Reown AppKit with Hedera adapters and HashPack-focused configuration
 * 
 * This function configures AppKit with:
 * - Native and EVM Hedera adapters
 * - HashPack as the primary and preferred wallet
 * - MazaoChain branding and theme
 * - Disabled analytics, email, and social login features
 * - Support for both mainnet and testnet networks
 * - Custom HashPack wallet configuration for optimal mobile/desktop experience
 * 
 * @param config - Configuration object containing adapters and universalProvider
 * @returns Initialized AppKit instance
 * 
 * @example
 * ```typescript
 * const universalProvider = await HederaProvider.init({...});
 * const nativeAdapter = new HederaAdapter({...});
 * const evmAdapter = new HederaAdapter({...});
 * 
 * const appKit = initializeAppKit({
 *   adapters: [nativeAdapter, evmAdapter],
 *   universalProvider
 * });
 * ```
 */
export async function initializeAppKit(config: AppKitConfig) {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    throw new Error('AppKit can only be initialized in browser environment');
  }

  const { adapters, universalProvider } = config;

  // Dynamic import to avoid SSR issues
  const { createAppKit } = await import('@reown/appkit');

  // Prepare application metadata.
  // Use window.location.origin so the metadata URL matches the actual deployed domain
  // in both dev (Replit preview) and production. WalletConnect uses this URL for
  // domain verification — a mismatch (e.g. hardcoded localhost) causes relay to reject
  // session proposals, preventing QR code generation.
  const siteOrigin = window.location.origin;
  const metadata = {
    name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain MVP",
    description: env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || "Decentralized lending platform for farmers",
    url: siteOrigin,
    icons: [`${siteOrigin}/favicon.ico`],
  };

  // Determine active network from env (defaults to testnet for development safety)
  const isTestnet = env.NEXT_PUBLIC_HEDERA_NETWORK !== 'mainnet';
  const defaultNetwork = isTestnet
    ? HederaChainDefinition.Native.Testnet
    : HederaChainDefinition.Native.Mainnet;

  // Create and configure AppKit instance
  return createAppKit({
    // Hedera adapters for native and EVM namespaces
    // @ts-expect-error - HederaAdapter type compatibility with AppKit 1.8.12
    adapters,

    // UniversalProvider from HederaProvider's UniversalProvider implementation
    universalProvider,

    // WalletConnect configuration
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    // Application metadata
    metadata,

    // Supported Hedera networks.
    // Testnet is listed first so it becomes the default selected network when
    // NEXT_PUBLIC_HEDERA_NETWORK=testnet (the env default). This hints to wallets
    // (e.g. HashPack) that testnet is the primary network for this dApp, prompting
    // them to expose testnet accounts in the WalletConnect connection popup.
    networks: isTestnet
      ? [
          HederaChainDefinition.Native.Testnet,
          HederaChainDefinition.EVM.Testnet,
          HederaChainDefinition.Native.Mainnet,
          HederaChainDefinition.EVM.Mainnet,
        ]
      : [
          HederaChainDefinition.Native.Mainnet,
          HederaChainDefinition.EVM.Mainnet,
          HederaChainDefinition.Native.Testnet,
          HederaChainDefinition.EVM.Testnet,
        ],

    // Default network — AppKit selects this chain when the modal first opens.
    // Setting it to testnet ensures the WalletConnect session proposal prioritises
    // testnet chains, which prompts HashPack to show testnet accounts.
    defaultNetwork,

    // Feature flags
    // walletConnect is enabled by default — this shows the QR code for any
    // WalletConnect-compatible wallet (HashPack, Blade, etc.).
    // Do NOT use includeWalletIds to restrict to HashPack only: that suppresses
    // the generic WalletConnect QR view and forces a deep-link redirect instead.
    features: {
      analytics: false,
      email: false,
      socials: [],
    },

    // Theme configuration
    themeMode: "light",

    // MazaoChain branding - custom theme variables
    themeVariables: {
      "--w3m-accent": "#10b981",              // MazaoChain green (emerald-500)
      "--w3m-border-radius-master": "8px",    // Rounded corners
    },
  });
}
