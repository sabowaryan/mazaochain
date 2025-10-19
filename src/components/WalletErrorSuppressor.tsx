'use client';

import { useEffect } from 'react';
import { suppressWalletConnectErrors } from '@/lib/wallet/wallet-error-handler';

export function WalletErrorSuppressor() {
  useEffect(() => {
    suppressWalletConnectErrors();
  }, []);

  return null;
}
