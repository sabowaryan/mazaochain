import { supabase } from '@/lib/supabase/client';

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

class TransactionMonitoringService {
  async getRecentTransactions(limit: number = 50): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select(`
          id,
          type,
          from_address,
          to_address,
          amount,
          token_type,
          hedera_transaction_id,
          status,
          created_at,
          gas_used,
          error_message
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        amount: tx.amount,
        tokenType: tx.token_type,
        hederaTransactionId: tx.hedera_transaction_id,
        status: tx.status,
        timestamp: new Date(tx.created_at),
        gasUsed: tx.gas_used,
        errorMessage: tx.error_message
      })) || [];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw new Error('Failed to fetch recent transactions');
    }
  }

  async getTransactionAnalytics(): Promise<TransactionAnalytics> {
    try {
      // Get total transactions count
      const { count: totalTransactions } = await supabase
        .from('blockchain_transactions')
        .select('*', { count: 'exact', head: true });

      // Get confirmed transactions count
      const { count: confirmedTransactions } = await supabase
        .from('blockchain_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      // Get pending transactions count
      const { count: pendingCount } = await supabase
        .from('blockchain_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate success rate
      const successRate = totalTransactions ? 
        Math.round(((confirmedTransactions || 0) / totalTransactions) * 100) : 0;

      // Get 24h volume
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: volumeData } = await supabase
        .from('blockchain_transactions')
        .select('amount, token_type')
        .eq('status', 'confirmed')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      // Calculate total volume in USD (assuming USDC = 1 USD, MAZAO needs price conversion)
      const totalVolume = volumeData?.reduce((sum: number, tx: any) => {
        if (tx.token_type === 'USDC') {
          return sum + tx.amount;
        } else if (tx.token_type === 'MAZAO') {
          // For now, assume 1 MAZAO = 1 USD (this should be dynamic)
          return sum + tx.amount;
        }
        return sum;
      }, 0) || 0;

      return {
        totalTransactions: totalTransactions || 0,
        successRate,
        pendingCount: pendingCount || 0,
        totalVolume: Math.round(totalVolume)
      };
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      throw new Error('Failed to fetch transaction analytics');
    }
  }

  async recordTransaction(transaction: {
    type: string;
    from_address: string;
    to_address: string;
    amount: number;
    token_type: string;
    hedera_transaction_id: string;
    status: string;
    gas_used?: number;
    error_message?: string;
  }) {
    try {
      const { error } = await supabase
        .from('blockchain_transactions')
        .insert(transaction);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(
    hederaTransactionId: string, 
    status: 'confirmed' | 'failed',
    errorMessage?: string
  ) {
    try {
      const updateData: unknown = { status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('blockchain_transactions')
        .update(updateData)
        .eq('hedera_transaction_id', hederaTransactionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }
}

export const transactionMonitoringService = new TransactionMonitoringService();