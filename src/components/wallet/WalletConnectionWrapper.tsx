"use client";

import { isAppKitEnabled } from "@/lib/wallet/appkit-config";
import { WalletConnection } from "./WalletConnection";
import { AppKitButton, AppKitAccountButton } from "./AppKitButton";

interface WalletConnectionWrapperProps {
  showBalances?: boolean;
  className?: string;
}

/**
 * Wallet Connection Wrapper
 * Automatically switches between custom WalletConnection component
 * and AppKit-based UI based on NEXT_PUBLIC_USE_APPKIT environment variable
 */
export function WalletConnectionWrapper({
  showBalances = true,
  className = "",
}: WalletConnectionWrapperProps) {
  // Check if AppKit mode is enabled
  const useAppKit = isAppKitEnabled();

  if (useAppKit) {
    // Render AppKit UI
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AppKitButton />
          <AppKitAccountButton />
        </div>
        {showBalances && (
          <div className="text-sm text-gray-600">
            <p>Using Reown AppKit for wallet connection</p>
          </div>
        )}
      </div>
    );
  }

  // Render custom implementation
  return <WalletConnection showBalances={showBalances} className={className} />;
}
