// Wallet integration test component
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function WalletTest() {
  const {
    isConnected,
    isConnecting,
    connection,
    balances,
    isLoadingBalances,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    error,
    clearError,
  } = useWallet();

  const [testResult, setTestResult] = useState<string>('');

  const runConnectionTest = async () => {
    setTestResult('Testing wallet connection...');
    try {
      await connectWallet();
      setTestResult('✅ Wallet connection successful!');
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const runBalanceTest = async () => {
    if (!isConnected) {
      setTestResult('❌ Please connect wallet first');
      return;
    }

    setTestResult('Testing balance retrieval...');
    try {
      await refreshBalances();
      setTestResult('✅ Balance retrieval successful!');
    } catch (err) {
      setTestResult(`❌ Balance test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Wallet Integration Test</h2>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Connection Status</h3>
          <p className="text-sm">
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
          {connection && (
            <p className="text-sm">
              Account: {connection.accountId}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600">
              Error: {error}
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runConnectionTest}
            disabled={isConnecting}
            variant="default"
          >
            {isConnecting ? 'Connecting...' : 'Test Connection'}
          </Button>

          <Button
            onClick={runBalanceTest}
            disabled={!isConnected || isLoadingBalances}
            variant="outline"
          >
            {isLoadingBalances ? 'Loading...' : 'Test Balance'}
          </Button>

          <Button
            onClick={disconnectWallet}
            disabled={!isConnected}
            variant="outline"
          >
            Disconnect
          </Button>

          {error && (
            <Button
              onClick={clearError}
              variant="ghost"
            >
              Clear Error
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="p-3 bg-blue-50 rounded">
            <h3 className="font-medium mb-2">Test Result</h3>
            <p className="text-sm">{testResult}</p>
          </div>
        )}

        {/* Balance Display */}
        {balances && (
          <div className="p-3 bg-green-50 rounded">
            <h3 className="font-medium mb-2">Wallet Balances</h3>
            <div className="space-y-1 text-sm">
              <p>HBAR: {balances.hbar}</p>
              {balances.tokens.length > 0 ? (
                balances.tokens.map((token) => (
                  <p key={token.tokenId}>
                    {token.symbol}: {token.balance}
                  </p>
                ))
              ) : (
                <p>No tokens found</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-yellow-50 rounded">
          <h3 className="font-medium mb-2">Instructions</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Make sure you have HashPack wallet extension installed</li>
            <li>Click "Test Connection" to open the pairing modal</li>
            <li>Approve the connection in HashPack</li>
            <li>Click "Test Balance" to verify balance retrieval works</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}