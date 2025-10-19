"use client";

import { WalletConnection } from "./WalletConnection";

interface WalletConnectionWrapperProps {
  showBalances?: boolean;
  className?: string;
}

/**
 * Wallet Connection Wrapper
 * Uses DAppConnector-based wallet connection via WalletConnection component
 */
export function WalletConnectionWrapper({
  showBalances = true,
  className = "",
}: WalletConnectionWrapperProps) {
  // Render DAppConnector-based implementation
  return <WalletConnection showBalances={showBalances} className={className} />;
}
