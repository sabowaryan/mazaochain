'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'contract';
  amount: string;
  token: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  from?: string;
  to?: string;
  hash?: string;
}

interface WalletTransactionsProps {
  className?: string;
  limit?: number;
}

export function WalletTransactions({ 
  className = '', 
  limit = 10 
}: WalletTransactionsProps) {
  const { isConnected, connection } = useWallet();
  const { triggerHaptic } = useHapticFeedback();
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock transactions data - replace with real API call
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'receive',
      amount: '100.00',
      token: 'USDC',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      from: '0.0.123456',
      hash: '0x1234567890abcdef'
    },
    {
      id: '2',
      type: 'send',
      amount: '50.00',
      token: 'HBAR',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      to: '0.0.789012',
      hash: '0xabcdef1234567890'
    },
    {
      id: '3',
      type: 'contract',
      amount: '25.00',
      token: 'MAZAO',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      hash: '0x567890abcdef1234'
    }
  ]);

  const formatAmount = (amount: string, token: string) => {
    const num = parseFloat(amount);
    return `${num.toFixed(2)} ${token}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return `Il y a ${days}j`;
    }
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
    if (status === 'failed') {
      return <XCircleIconSolid className="w-5 h-5 text-red-500" />;
    }
    
    switch (type) {
      case 'send':
        return <ArrowUpIcon className="w-5 h-5 text-red-500" />;
      case 'receive':
        return <ArrowDownIcon className="w-5 h-5 text-green-500" />;
      case 'contract':
        return <CheckCircleIconSolid className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'pending') return 'border-yellow-200 bg-yellow-50';
    if (status === 'failed') return 'border-red-200 bg-red-50';
    
    switch (type) {
      case 'send':
        return 'border-red-200 bg-red-50';
      case 'receive':
        return 'border-green-200 bg-green-50';
      case 'contract':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const refreshTransactions = async () => {
    setIsLoading(true);
    triggerHaptic('medium');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium mb-2">
            Wallet non connecté
          </p>
          <p className="text-sm text-gray-400">
            Connectez votre wallet pour voir l'historique des transactions
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-xl ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-emerald-600" />
            Historique des Transactions
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowDetails(!showDetails);
              }}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {showDetails ? (
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
            <Button
              onClick={refreshTransactions}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {isLoading ? (
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
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="animate-spin h-10 w-10 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement des transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, limit).map((tx) => (
              <div
                key={tx.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getTransactionColor(tx.type, tx.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm">
                      {getTransactionIcon(tx.type, tx.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 capitalize">
                          {tx.type === 'send' ? 'Envoi' : 
                           tx.type === 'receive' ? 'Réception' : 'Contrat'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          tx.status === 'success' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status === 'success' ? 'Confirmé' :
                           tx.status === 'pending' ? 'En attente' : 'Échoué'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                      {showDetails && (
                        <div className="mt-2 space-y-1">
                          {tx.from && (
                            <p className="text-xs text-gray-500">
                              De: <span className="font-mono">{tx.from}</span>
                            </p>
                          )}
                          {tx.to && (
                            <p className="text-xs text-gray-500">
                              Vers: <span className="font-mono">{tx.to}</span>
                            </p>
                          )}
                          {tx.hash && (
                            <p className="text-xs text-gray-500">
                              Hash: <span className="font-mono">{tx.hash.slice(0, 20)}...</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      tx.type === 'send' ? 'text-red-600' : 
                      tx.type === 'receive' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {tx.type === 'send' ? '-' : '+'}
                      {formatAmount(tx.amount, tx.token)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
            <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Aucune transaction trouvée</p>
            <p className="text-xs text-gray-400 mt-1">
              Les transactions apparaîtront ici une fois effectuées
            </p>
          </div>
        )}

        {/* View More Button */}
        {transactions.length > limit && (
          <div className="text-center">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Voir plus de transactions
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}