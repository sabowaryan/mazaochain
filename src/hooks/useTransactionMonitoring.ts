'use client';

import { useState, useEffect } from 'react';
import { transactionMonitoringService } from '@/lib/services/transaction-monitoring';

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

interface TransactionAnalytics {
  totalTransactions: number;
  successRate: number;
  pendingCount: number;
  totalVolume: number;
}

export function useTransactionMonitoring() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transactionsData, analyticsData] = await Promise.all([
        transactionMonitoringService.getRecentTransactions(),
        transactionMonitoringService.getTransactionAnalytics()
      ]);
      
      setTransactions(transactionsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 15 seconds
    const interval = setInterval(fetchData, 15000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    transactions,
    analytics,
    loading,
    error,
    refreshTransactions: fetchData
  };
}