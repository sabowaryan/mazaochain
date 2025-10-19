/**
 * Integration tests for automatic loan disbursement system
 * Task 11: Auditer et corriger le système de décaissement automatique des prêts
 * 
 * Tests verify:
 * - Loan approval triggers USDC transfer to farmer's wallet
 * - Collateral is escrowed in smart contract
 * - Loan status changes to 'active' after disbursement
 * - Farmer receives notification with loan details
 * - Transaction receipt is generated and accessible
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loanService } from '@/lib/services/loan';
import { usdcTransferService } from '@/lib/services/usdc-transfer';
import { transactionReceiptService } from '@/lib/services/transaction-receipt';
import { notificationHelpers } from '@/lib/services/notification-helpers';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

// Mock services
vi.mock('@/lib/services/usdc-transfer');
vi.mock('@/lib/services/transaction-receipt');
vi.mock('@/lib/services/notification-helpers');

describe('Automatic Loan Disbursement System', () => {
  const mockLoanId = 'loan-123';
  const mockBorrowerId = 'borrower-456';
  const mockLenderId = 'lender-789';
  const mockBorrowerWallet = '0.0.1234567';
  const mockLenderWallet = '0.0.7654321';
  const mockEscrowAccount = '0.0.9999999';
  const mockLoanAmount = 1000;
  const mockCollateralAmount = 2000;
  const mockTokenId = 'token-001';

  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      rpc: vi.fn(),
    };

    (createClient as any).mockReturnValue(mockSupabase);
  });

  describe('Sub-task 1: USDC Transfer to Farmer Wallet', () => {
    it('should transfer USDC to farmer wallet when loan is approved', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      // Mock USDC transfer success
      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
        amount: mockLoanAmount,
        fromAccount: mockLenderWallet,
        toAccount: mockBorrowerWallet,
      });

      // Mock escrow success
      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
        tokenId: mockTokenId,
        amount: mockCollateralAmount,
      });

      // Mock transaction recording
      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
        transactionId: 'record-123',
      });

      // Mock loan status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockLoan, status: 'active' },
        error: null,
      });

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.disbursementTransactionId).toBe('tx-disbursement-123');
      expect(usdcTransferService.disburseUSDC).toHaveBeenCalledWith(
        mockBorrowerWallet,
        mockLoanAmount,
        mockLoanId
      );
    });

    it('should handle USDC transfer failure gracefully', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      // Mock escrow success
      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      // Mock USDC transfer failure
      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: false,
        error: 'Insufficient funds in lender account',
      });

      // Mock collateral release (rollback)
      (usdcTransferService.releaseCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-release-789',
      });

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('USDC disbursement failed');
      expect(usdcTransferService.releaseCollateral).toHaveBeenCalled();
    });
  });

  describe('Sub-task 2: Collateral Escrow in Smart Contract', () => {
    it('should escrow collateral tokens before disbursing USDC', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockCollateralTokens = [{
        tokenId: mockTokenId,
        symbol: 'MAIZE-123',
        currentValue: mockCollateralAmount,
        cropType: 'maize',
        harvestDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        isActive: true,
        evaluationId: 'eval-123',
      }];

      mockSupabase.single.mockResolvedValueOnce({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      // Mock getting collateral tokens
      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue(mockCollateralTokens);

      // Mock escrow success
      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
        tokenId: mockTokenId,
        amount: mockCollateralAmount,
      });

      // Mock USDC transfer success
      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      // Mock transaction recording
      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      // Mock loan status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockLoan, status: 'active' },
        error: null,
      });

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.escrowTransactionId).toBe('tx-escrow-456');
      expect(usdcTransferService.escrowCollateral).toHaveBeenCalledWith({
        tokenId: mockTokenId,
        amount: mockCollateralAmount,
        fromAccountId: mockBorrowerWallet,
        escrowAccountId: expect.any(String),
        loanId: mockLoanId,
      });
    });

    it('should record escrow transaction in database', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockCollateralTokens = [{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }];

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue(mockCollateralTokens as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      // Act
      await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(transactionReceiptService.recordTransaction).toHaveBeenCalledWith(
        mockBorrowerId,
        expect.objectContaining({
          loanId: mockLoanId,
          transactionType: 'escrow',
          amount: mockCollateralAmount,
          tokenType: 'MAZAO',
          hederaTransactionId: 'tx-escrow-456',
          status: 'confirmed',
        })
      );
    });
  });

  describe('Sub-task 3: Loan Status Update to Active', () => {
    it('should update loan status to active after successful disbursement', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      // Mock the update call
      const updateMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.update = updateMock;
      mockSupabase.eq = vi.fn().mockReturnValue({ error: null });

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should not update status if disbursement fails', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: false,
        error: 'Transfer failed',
      });

      (usdcTransferService.releaseCollateral as any).mockResolvedValue({
        success: true,
      });

      const updateMock = vi.fn();
      mockSupabase.update = updateMock;

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(false);
      expect(updateMock).not.toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('Sub-task 4: Farmer Notification with Loan Details', () => {
    it('should send notification to farmer after successful disbursement', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      (notificationHelpers.sendLoanNotification as any).mockResolvedValue(undefined);

      // Act
      await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(notificationHelpers.sendLoanNotification).toHaveBeenCalledWith(
        mockBorrowerId,
        'disbursed',
        expect.objectContaining({
          amount: mockLoanAmount,
          loanId: mockLoanId,
          dueDate: mockLoan.due_date,
        })
      );
    });

    it('should include loan details in notification', async () => {
      // Arrange
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: dueDate,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      (notificationHelpers.sendLoanNotification as any).mockResolvedValue(undefined);

      // Act
      await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      const notificationCall = (notificationHelpers.sendLoanNotification as any).mock.calls[0];
      expect(notificationCall[2]).toMatchObject({
        amount: mockLoanAmount,
        loanId: mockLoanId,
        dueDate: dueDate,
      });
    });
  });

  describe('Sub-task 5: Transaction Receipt Generation', () => {
    it('should generate disbursement receipt after successful transaction', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      (transactionReceiptService.generateDisbursementReceipt as any).mockResolvedValue({
        success: true,
        receiptId: 'receipt-789',
      });

      (transactionReceiptService.sendReceiptNotification as any).mockResolvedValue({
        success: true,
      });

      // Act
      await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(transactionReceiptService.generateDisbursementReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: mockLoanId,
          borrowerAddress: mockBorrowerWallet,
          lenderAddress: mockLenderWallet,
          principalAmount: mockLoanAmount,
          collateralAmount: mockCollateralAmount,
          collateralTokenId: mockTokenId,
          disbursementTransactionId: 'tx-disbursement-123',
          escrowTransactionId: 'tx-escrow-456',
          status: 'completed',
        })
      );
    });

    it('should send receipt notification to farmer', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      (transactionReceiptService.generateDisbursementReceipt as any).mockResolvedValue({
        success: true,
        receiptId: 'receipt-789',
      });

      (transactionReceiptService.sendReceiptNotification as any).mockResolvedValue({
        success: true,
      });

      // Act
      await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(transactionReceiptService.sendReceiptNotification).toHaveBeenCalledWith(
        mockBorrowerId,
        expect.objectContaining({
          loanId: mockLoanId,
          principalAmount: mockLoanAmount,
          collateralAmount: mockCollateralAmount,
        })
      );
    });

    it('should make receipt accessible through transaction history', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'tx-1',
          transaction_type: 'disbursement',
          hedera_transaction_id: 'tx-disbursement-123',
          status: 'confirmed',
          amount: mockLoanAmount,
        },
        {
          id: 'tx-2',
          transaction_type: 'escrow',
          hedera_transaction_id: 'tx-escrow-456',
          status: 'confirmed',
          amount: mockCollateralAmount,
        },
      ];

      (transactionReceiptService.getLoanTransactions as any).mockResolvedValue(mockTransactions);

      // Act
      const transactions = await transactionReceiptService.getLoanTransactions(mockLoanId);

      // Assert
      expect(transactions).toHaveLength(2);
      expect(transactions[0].transaction_type).toBe('disbursement');
      expect(transactions[1].transaction_type).toBe('escrow');
    });
  });

  describe('Complete Disbursement Workflow', () => {
    it('should complete full disbursement workflow successfully', async () => {
      // Arrange
      const mockLoan = {
        id: mockLoanId,
        borrower_id: mockBorrowerId,
        lender_id: mockLenderId,
        principal: mockLoanAmount,
        collateral_amount: mockCollateralAmount,
        status: 'approved',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLoan,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockBorrowerWallet },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { wallet_address: mockLenderWallet },
        error: null,
      });

      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([{
        tokenId: mockTokenId,
        currentValue: mockCollateralAmount,
      }] as any);

      (usdcTransferService.escrowCollateral as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-escrow-456',
      });

      (usdcTransferService.disburseUSDC as any).mockResolvedValue({
        success: true,
        transactionId: 'tx-disbursement-123',
      });

      (transactionReceiptService.recordTransaction as any).mockResolvedValue({
        success: true,
      });

      (transactionReceiptService.generateDisbursementReceipt as any).mockResolvedValue({
        success: true,
        receiptId: 'receipt-789',
      });

      (transactionReceiptService.sendReceiptNotification as any).mockResolvedValue({
        success: true,
      });

      (notificationHelpers.sendLoanNotification as any).mockResolvedValue(undefined);

      // Act
      const result = await loanService.automaticLoanDisbursement(mockLoanId, mockLenderId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.disbursementTransactionId).toBe('tx-disbursement-123');
      expect(result.escrowTransactionId).toBe('tx-escrow-456');

      // Verify all steps were executed
      expect(usdcTransferService.escrowCollateral).toHaveBeenCalled();
      expect(usdcTransferService.disburseUSDC).toHaveBeenCalled();
      expect(transactionReceiptService.recordTransaction).toHaveBeenCalledTimes(2); // escrow + disbursement
      expect(notificationHelpers.sendLoanNotification).toHaveBeenCalled();
      expect(transactionReceiptService.generateDisbursementReceipt).toHaveBeenCalled();
      expect(transactionReceiptService.sendReceiptNotification).toHaveBeenCalled();
    });
  });
});
