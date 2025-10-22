// Wallet integration test page
'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const WalletTest = dynamic(
  () => import('@/components/wallet/WalletTest').then(mod => ({ default: mod.WalletTest })),
  { 
    ssr: false,
    loading: () => <LoadingSpinner size="lg" />
  }
);

const WalletConnectionTest = dynamic(
  () => import('@/components/wallet/WalletConnectionTest').then(mod => ({ default: mod.WalletConnectionTest })),
  { 
    ssr: false,
    loading: () => <LoadingSpinner size="lg" />
  }
);

export default function TestWalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HashPack Wallet Integration Test
          </h1>
          <p className="mt-2 text-gray-600">
            Test the HashPack wallet connectivity and functionality
          </p>
        </div>
        
        <div className="space-y-8">
          <WalletConnectionTest />
          <WalletTest />
        </div>
      </div>
    </div>
  );
}