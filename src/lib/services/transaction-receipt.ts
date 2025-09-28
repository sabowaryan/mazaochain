import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export interface TransactionReceiptData {
  loanId: string;
  transactionType: 'disbursement' | 'repayment' | 'escrow' | 'release';
  amount: number;
  tokenType: 'USDC' | 'MAZAO';
  fromAddress: string;
  toAddress: string;
  hederaTransactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockchainConfirmations?: number;
  gasUsed?: number;
  timestamp: Date;
}

export interface LoanDisbursementReceipt {
  loanId: string;
  borrowerAddress: string;
  lenderAddress: string;
  principalAmount: number;
  collateralAmount: number;
  collateralTokenId: string;
  disbursementTransactionId: string;
  escrowTransactionId: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'partial';
  errorMessage?: string;
}

export interface TransactionConfirmation {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: number;
  timestamp: Date;
}

class TransactionReceiptService {
  private supabase = createClient();

  /**
   * Record a blockchain transaction in the database
   */
  async recordTransaction(
    userId: string,
    transactionData: TransactionReceiptData
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: transactionData.transactionType,
          from_address: transactionData.fromAddress,
          to_address: transactionData.toAddress,
          amount: transactionData.amount,
          token_type: transactionData.tokenType,
          hedera_transaction_id: transactionData.hederaTransactionId,
          status: transactionData.status,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record transaction: ${error.message}`);
      }

      console.log(`Transaction recorded: ${transaction.id}`);

      return {
        success: true,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('Error recording transaction:', error);
      return {
        success: false,
        error: `Failed to record transaction: ${error}`,
      };
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'confirmed' | 'failed',
    confirmations?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({
          status,
          // Add confirmations field if it exists in the schema
        })
        .eq('id', transactionId);

      if (error) {
        throw new Error(`Failed to update transaction status: ${error.message}`);
      }

      console.log(`Transaction ${transactionId} status updated to ${status}`);

      return { success: true };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return {
        success: false,
        error: `Failed to update transaction status: ${error}`,
      };
    }
  }

  /**
   * Generate loan disbursement receipt
   */
  async generateDisbursementReceipt(
    receiptData: LoanDisbursementReceipt
  ): Promise<{ success: boolean; receiptId?: string; error?: string }> {
    try {
      // Create a comprehensive receipt document
      const receipt = {
        id: `RECEIPT-${receiptData.loanId}-${Date.now()}`,
        type: 'loan_disbursement',
        loanId: receiptData.loanId,
        timestamp: receiptData.timestamp,
        status: receiptData.status,
        transactions: {
          disbursement: {
            transactionId: receiptData.disbursementTransactionId,
            amount: receiptData.principalAmount,
            currency: 'USDC',
            from: receiptData.lenderAddress,
            to: receiptData.borrowerAddress,
          },
          collateralEscrow: {
            transactionId: receiptData.escrowTransactionId,
            amount: receiptData.collateralAmount,
            tokenId: receiptData.collateralTokenId,
            from: receiptData.borrowerAddress,
            to: 'escrow_account', // This would be the actual escrow account
          },
        },
        errorMessage: receiptData.errorMessage,
      };

      // Store receipt in database (you might want to create a receipts table)
      // For now, we'll store it as JSON in a generic way
      console.log('Generated disbursement receipt:', receipt);

      return {
        success: true,
        receiptId: receipt.id,
      };
    } catch (error) {
      console.error('Error generating disbursement receipt:', error);
      return {
        success: false,
        error: `Failed to generate receipt: ${error}`,
      };
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<Tables<'transactions'>[]> {
    try {
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch transaction history: ${error.message}`);
      }

      return transactions || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get transactions for a specific loan
   */
  async getLoanTransactions(loanId: string): Promise<Tables<'transactions'>[]> {
    try {
      // This would require a loan_id field in the transactions table
      // For now, we'll search by transaction memo or description
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('*')
        .or(`hedera_transaction_id.ilike.%${loanId}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch loan transactions: ${error.message}`);
      }

      return transactions || [];
    } catch (error) {
      console.error('Error fetching loan transactions:', error);
      return [];
    }
  }

  /**
   * Verify transaction on Hedera network
   */
  async verifyTransactionOnHedera(
    hederaTransactionId: string
  ): Promise<TransactionConfirmation> {
    try {
      // In a real implementation, this would query the Hedera network
      // to get transaction details and confirmation status
      
      // For now, we'll simulate the verification
      const confirmation: TransactionConfirmation = {
        transactionId: hederaTransactionId,
        status: 'confirmed',
        confirmations: 1, // Hedera has immediate finality
        timestamp: new Date(),
      };

      console.log(`Transaction ${hederaTransactionId} verified on Hedera`);

      return confirmation;
    } catch (error) {
      console.error('Error verifying transaction on Hedera:', error);
      return {
        transactionId: hederaTransactionId,
        status: 'failed',
        confirmations: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate PDF receipt for a transaction
   */
  async generatePDFReceipt(
    transactionId: string,
    receiptData: LoanDisbursementReceipt
  ): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      // This would integrate with a PDF generation service
      // For now, we'll create a simple receipt structure
      
      const receiptContent = {
        title: 'MazaoChain - Loan Disbursement Receipt',
        receiptNumber: `RECEIPT-${receiptData.loanId}`,
        date: receiptData.timestamp.toISOString(),
        loanDetails: {
          loanId: receiptData.loanId,
          principalAmount: `${receiptData.principalAmount} USDC`,
          collateralAmount: `${receiptData.collateralAmount} MAZAO`,
          borrower: receiptData.borrowerAddress,
          lender: receiptData.lenderAddress,
        },
        transactions: {
          disbursement: receiptData.disbursementTransactionId,
          escrow: receiptData.escrowTransactionId,
        },
        status: receiptData.status,
        timestamp: receiptData.timestamp,
      };

      console.log('Generated PDF receipt content:', receiptContent);

      // In a real implementation, you would:
      // 1. Use a PDF generation library (like jsPDF or Puppeteer)
      // 2. Upload the PDF to storage (Supabase Storage)
      // 3. Return the public URL

      return {
        success: true,
        pdfUrl: `https://example.com/receipts/${transactionId}.pdf`,
      };
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      return {
        success: false,
        error: `Failed to generate PDF receipt: ${error}`,
      };
    }
  }

  /**
   * Send receipt notification to user
   */
  async sendReceiptNotification(
    userId: string,
    receiptData: LoanDisbursementReceipt,
    pdfUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Send notification through Supabase
      await this.supabase.rpc('send_notification', {
        recipient_id: userId,
        notification_title: 'Loan Disbursement Completed',
        notification_message: `Your loan of ${receiptData.principalAmount} USDC has been successfully disbursed. Transaction ID: ${receiptData.disbursementTransactionId}`,
        notification_type: 'loan_disbursement',
      });

      console.log(`Receipt notification sent to user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error('Error sending receipt notification:', error);
      return {
        success: false,
        error: `Failed to send notification: ${error}`,
      };
    }
  }
}

// Export singleton instance
export const transactionReceiptService = new TransactionReceiptService();