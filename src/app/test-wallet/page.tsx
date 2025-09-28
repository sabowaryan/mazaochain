// Wallet integration test page
'use client';

import { WalletTest } from '@/components/wallet/WalletTest';

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
        
        <WalletTest />
      </div>
    </div>
  );
}