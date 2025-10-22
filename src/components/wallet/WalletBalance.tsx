// Wallet balance display component
'use client';

import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import { useState } from 'react';
import {
  CurrencyDollarIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  BanknotesIcon,
  ChartBarIcon,
  WalletIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import {
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';

interface WalletBalanceProps {
  showRefresh?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'cards';
  showDetails?: boolean;
}

export function WalletBalance({ 
  showRefresh = true, 
  className = '', 
  variant = 'full',
  showDetails = true 
}: WalletBalanceProps) {
  const {
    isConnected,
    balances,
    isLoadingBalances,
    refreshBalances,
  } = useWallet();

  const { triggerHaptic } = useHapticFeedback();
  const [showAllTokens, setShowAllTokens] = useState(false);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('light');
    // You could add a toast notification here
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <WalletIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium mb-2">
            Wallet non connecté
          </p>
          <p className="text-sm text-gray-400">
            Connectez votre portefeuille pour voir les soldes
          </p>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <CurrencyDollarIconSolid className="w-5 h-5 text-emerald-600" />
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-bold text-gray-900">
              {balances ? formatBalance(balances.hbar, 2) : '0'}
            </span>
            <span className="text-gray-500 ml-1">HBAR</span>
          </div>
          <div className="text-sm">
            <span className="font-bold text-gray-900">
              {getUSDCBalance()}
            </span>
            <span className="text-gray-500 ml-1">USDC</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-xl ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CurrencyDollarIconSolid className="w-6 h-6 text-emerald-600" />
            Soldes du Wallet
          </h3>
          <div className="flex items-center gap-2">
            {showDetails && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAllTokens(!showAllTokens);
                }}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {showAllTokens ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4" />
                    Masquer
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    Détails
                  </>
                )}
              </button>
            )}
            {showRefresh && (
              <Button
                onClick={() => {
                  triggerHaptic('medium');
                  refreshBalances();
                }}
                disabled={isLoadingBalances}
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {isLoadingBalances ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="animate-spin h-4 w-4" />
                    Actualisation...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4" />
                    Actualiser
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {isLoadingBalances ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex justify-center mb-4">
              <ArrowPathIcon className="animate-spin h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-gray-600 font-medium">Chargement des soldes...</p>
            <div className="flex justify-center mt-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        ) : variant === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HBAR Balance Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">HBAR</p>
                  <p className="text-3xl font-bold mt-1">
                    {balances ? formatBalance(balances.hbar, 2) : '0'}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">Hedera Hashgraph</p>
                </div>
                <div className="text-blue-200">
                  <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold">ℏ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* USDC Balance Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">USDC</p>
                  <p className="text-3xl font-bold mt-1">
                    {getUSDCBalance()}
                  </p>
                  <p className="text-green-200 text-xs mt-1">USD Coin</p>
                </div>
                <div className="text-green-200">
                  <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* MazaoToken Balance Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">MAZAO</p>
                  <p className="text-3xl font-bold mt-1">
                    {getMazaoTokenBalance()}
                  </p>
                  <p className="text-orange-200 text-xs mt-1">MazaoChain Token</p>
                </div>
                <div className="text-orange-200">
                  <div className="w-12 h-12 bg-orange-400/20 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // List view
          <div className="space-y-3">
            {/* HBAR Balance */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">ℏ</span>
                </div>
                <div>
                  <span className="text-base font-bold text-gray-900 block">HBAR</span>
                  <span className="text-xs text-blue-600 font-medium">Hedera Hashgraph</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900 block">
                  {balances ? formatBalance(balances.hbar, 2) : '0'}
                </span>
                <span className="text-xs text-gray-500">HBAR</span>
              </div>
            </div>

            {/* Token Balances */}
            {balances?.tokens.slice(0, showAllTokens ? undefined : 3).map((token) => (
              <div
                key={token.tokenId}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    token.symbol === 'USDC' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    token.symbol === 'MAZAO' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <span className="text-white text-xs font-bold">
                      {token.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">
                        {token.symbol}
                      </span>
                      {showAllTokens && (
                        <button
                          onClick={() => copyToClipboard(token.tokenId, 'Token ID')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ClipboardDocumentIcon className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{token.name}</p>
                    {showAllTokens && (
                      <p className="text-xs text-gray-400 font-mono truncate mt-1">
                        ID: {token.tokenId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900 block">
                    {formatBalance(token.balance, token.decimals)}
                  </span>
                  <span className="text-xs text-gray-500">{token.symbol}</span>
                </div>
              </div>
            ))}

            {/* Show more button */}
            {balances && balances.tokens.length > 3 && !showAllTokens && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAllTokens(true);
                }}
                className="w-full p-3 text-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-300 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <EyeIcon className="w-4 h-4" />
                  Voir {balances.tokens.length - 3} token(s) de plus
                </span>
              </button>
            )}

            {/* No tokens message */}
            {balances && balances.tokens.length === 0 && (
              <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <BanknotesIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">Aucun token trouvé</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les tokens apparaîtront ici une fois ajoutés à votre wallet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}