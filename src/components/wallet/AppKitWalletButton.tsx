'use client';

// AppKitWalletButton: SSR-safe outer wrapper.
// The actual wallet UI is loaded via next/dynamic with ssr:false so that
// @reown/appkit/react (which imports @walletconnect/core browser-only code)
// is never evaluated during server-side rendering.

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { WalletIcon as WalletIconSolid } from '@heroicons/react/24/solid';

const AppKitWalletButtonReady = dynamic(
  () => import('./AppKitWalletButtonReady'),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="px-4 py-2 text-base opacity-70 cursor-not-allowed">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Chargement...</span>
        </div>
      </Button>
    ),
  }
);

interface AppKitWalletButtonProps {
  variant?: 'connect' | 'account' | 'network';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function AppKitWalletButton({
  variant = 'connect',
  size = 'md',
  className = '',
  showLabel = true
}: AppKitWalletButtonProps) {
  const { isRestoring } = useWallet();

  // While the wallet service is initialising (and AppKit is not yet ready),
  // render a static loading indicator. Once isRestoring becomes false,
  // AppKit is guaranteed to be initialised and AppKitWalletButtonReady
  // can safely call useAppKit().
  if (isRestoring) {
    return (
      <Button
        disabled
        className={`px-4 py-2 text-base opacity-70 cursor-not-allowed ${className}`}
      >
        <div className="flex items-center gap-2">
          <WalletIconSolid className="w-5 h-5 animate-pulse" />
          {showLabel && <span>Initialisation...</span>}
        </div>
      </Button>
    );
  }

  return (
    <AppKitWalletButtonReady
      variant={variant}
      size={size}
      className={className}
      showLabel={showLabel}
    />
  );
}
