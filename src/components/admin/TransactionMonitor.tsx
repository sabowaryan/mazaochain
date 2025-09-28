'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useTransactionMonitoring } from '@/hooks/useTransactionMonitoring';

interface Transaction {
  id: string;
  type: 'mint' | 'burn' | 'loan' | 'repayment' | 'transfer';
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType: 'MAZAO' | 'USDC';
  hederaTransactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  gasUsed?: number;
  errorMessage?: string;
}

export function TransactionMonitor() {
  const { transactions, analytics, loading, error, refreshTransactions } = useTransactionMonitoring();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Transaction['type']>('all');

  const filteredTransactions = transactions?.filter(tx => {
    const statusMatch = filter === 'all' || tx.status === filter;
    const typeMatch = typeFilter === 'all' || tx.type === typeFilter;
    return statusMatch && typeMatch;
  }) || [];

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'mint': return '🪙';
      case 'burn': return '🔥';
      case 'loan': return '💰';
      case 'repayment': return '💳';
      case 'transfer': return '↔️';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{analytics?.totalTransactions || 0}</div>
          <div className="text-sm text-gray-600">Total Transactions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{analytics?.successRate || 0}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{analytics?.pendingCount || 0}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">${analytics?.totalVolume?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">24h Volume</div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="mint">Mint</option>
              <option value="burn">Burn</option>
              <option value="loan">Loan</option>
              <option value="repayment">Repayment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          
          <button
            onClick={refreshTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </Card>

      {/* Transaction List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        
        {error && (
          <div className="text-red-600 mb-4">Error loading transactions: {error.message}</div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From/To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hedera TX
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getTypeIcon(tx.type)}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tx.amount} {tx.tokenType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="truncate w-32" title={tx.fromAddress}>
                        From: {tx.fromAddress.slice(0, 8)}...
                      </div>
                      <div className="truncate w-32" title={tx.toAddress}>
                        To: {tx.toAddress.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://hashscan.io/testnet/transaction/${tx.hederaTransactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate block w-24"
                      title={tx.hederaTransactionId}
                    >
                      {tx.hederaTransactionId.slice(0, 8)}...
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching the current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}