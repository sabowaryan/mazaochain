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

  // Prepare application metadata
  const metadata = {
    name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain MVP",
    description: env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || "Decentralized lending platform for farmers",
    url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    icons: [`${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`],
  };

  // Create and configure AppKit instance
  return createAppKit({
    // Hedera adapters for native and EVM namespaces
    // @ts-expect-error - HederaAdapter type compatibility with AppKit 1.8.12
    adapters,

    // UniversalProvider from HederaPr properties in HederaProvider's UniversalProvider implementation
    universalProvider,

    // WalletConnect configuration
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    // Application metadata
    metadata,

    // Supported Hedera networks - include both mainnet and testnet per docs recommendation
    networks: [
      HederaChainDefinition.EVM.Mainnet,
      HederaChainDefinition.EVM.Testnet,
      HederaChainDefinition.Native.Mainnet,
      HederaChainDefinition.Native.Testnet,
    ],

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
