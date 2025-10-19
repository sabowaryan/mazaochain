"use client";

import { useEffect, useState } from "react";
import { initializeAppKit, isAppKitEnabled } from "@/lib/wallet/appkit-config";

// Declare AppKit web components for TypeScript
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "appkit-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "appkit-network-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "appkit-account-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * AppKit Wallet Connection Button
 * Provides a modern, pre-built UI for wallet connections using Reown AppKit
 * 
 * This component is only rendered when NEXT_PUBLIC_USE_APPKIT=true
 */
export function AppKitButton() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize if AppKit mode is enabled
    if (!isAppKitEnabled()) {
      return;
    }

    const init = async () => {
      try {
        await initializeAppKit();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize AppKit:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize AppKit");
      }
    };

    init();
  }, []);

  // Don't render if AppKit is not enabled
  if (!isAppKitEnabled()) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">AppKit Error</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <button
        disabled
        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
      >
        Initializing...
      </button>
    );
  }

  // Render AppKit button
  return (
    <div className="flex items-center gap-2">
      {/* @ts-expect-error - AppKit web component */}
      <appkit-button />
    </div>
  );
}

/**
 * AppKit Network Button
 * Shows current network and allows switching
 */
export function AppKitNetworkButton() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isAppKitEnabled()) {
      return;
    }

    const init = async () => {
      try {
        await initializeAppKit();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize AppKit:", err);
      }
    };

    init();
  }, []);

  if (!isAppKitEnabled() || !isInitialized) {
    return null;
  }

  return (
    <>
      {/* @ts-expect-error - AppKit web component */}
      <appkit-network-button />
    </>
  );
}

/**
 * AppKit Account Button
 * Shows connected account with balance and options
 */
export function AppKitAccountButton() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isAppKitEnabled()) {
      return;
    }

    const init = async () => {
      try {
        await initializeAppKit();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize AppKit:", err);
      }
    };

    init();
  }, []);

  if (!isAppKitEnabled() || !isInitialized) {
    return null;
  }

  return (
    <>
      {/* @ts-expect-error - AppKit web component */}
      <appkit-account-button />
    </>
  );
}
