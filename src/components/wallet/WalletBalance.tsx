// Wallet balance display component
'use client';

import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WalletBalanceProps {
  showRefresh?: boolean;
  className?: string;
}

export function WalletBalance({ showRefresh = true, className = '' }: WalletBalanceProps) {
  const {
    isConnected,
    balances,
    isLoadingBalances,
    refreshBalances,
  } = useWallet();

  const formatBalance = (balance: string, decimals: number = 8) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };

  const getUSDCBalance = () => {
    if (!balances?.tokens) return '0';
    
    // Look for USDC token (you might need to adjust the token ID)
    const usdcToken = balances.tokens.find(token => 
      token.symbol === 'USDC' || token.name.toLowerCase().includes('usd coin')
    );
    
    return usdcToken ? formatBalance(usdcToken.balance, usdcToken.decimals) : '0';
  };

  const getMazaoTokenBalance = () => {
    if (!balances?.tokens) return '0';
    
    // Look for MazaoToken
    const mazaoToken = balances.tokens.find(token => 
      token.symbol === 'MAZAO' || token.name.toLowerCase().includes('mazao')
    );
    
    return mazaoToken ? formatBalance(mazaoToken.balance, mazaoToken.decimals) : '0';
  };

  if (!isConnected) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Connectez votre portefeuille pour voir les soldes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Soldes du portefeuille</h3>
          {showRefresh && (
            <Button
              onClick={refreshBalances}
              disabled={isLoadingBalances}
              variant="outline"
              size="sm"
            >
              {isLoadingBalances ? 'Actualisation...' : 'Actualiser'}
            </Button>
          )}
        </div>

        {isLoadingBalances ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Chargement des soldes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HBAR Balance */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">HBAR</p>
                  <p className="text-2xl font-bold">
                    {balances ? formatBalance(balances.hbar, 2) : '0'}
                  </p>
                </div>
                <div className="text-purple-200">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* USDC Balance */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">USDC</p>
                  <p className="text-2xl font-bold">
                    {getUSDCBalance()}
                  </p>
                </div>
                <div className="text-green-200">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* MazaoToken Balance */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">MazaoTokens</p>
                  <p className="text-2xl font-bold">
                    {getMazaoTokenBalance()}
                  </p>
                </div>
                <div className="text-orange-200">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Token List */}
        {balances && balances.tokens.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tous les tokens</h4>
            <div className="space-y-2">
              {balances.tokens.map((token) => (
                <div key={token.tokenId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{token.symbol}</p>
                    <p className="text-sm text-gray-500">{token.name}</p>
                    <p className="text-xs text-gray-400">ID: {token.tokenId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatBalance(token.balance, token.decimals)}
                    </p>
                    <p className="text-sm text-gray-500">{token.symbol}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}