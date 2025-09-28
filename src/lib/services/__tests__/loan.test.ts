import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoanService } from '../loan'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: null })),
        in: vi.fn(() => ({ data: [], error: null }))
      })),
      in: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'test-loan-id' }, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null }))
    }))
  })),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
}

// Mock the imports first
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          in: vi.fn(() => ({ data: [], error: null }))
        })),
        in: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test-loan-id' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
  })
}))

vi.mock('../tokenization', () => ({
  tokenizationService: {
    getFarmerPortfolio: vi.fn(() => Promise.resolve({
      farmerId: 'test-farmer',
      totalValue: 1000,
      tokens: [
        {
          tokenId: 'test-token',
          symbol: 'MAZAO-MANIOC-001',
          name: 'Manioc Token',
          balance: '100',
          decimals: 2,
          cropType: 'manioc',
          estimatedValue: 500,
          currentValue: 500,
          harvestDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
          isActive: true,
          evaluationId: 'test-eval'
        }
      ]
    }))
  }
}))

vi.mock('../usdc-transfer', () => ({
  usdcTransferService: {
    disburseUSDC: vi.fn(() => Promise.resolve({
      success: true,
      transactionId: 'usdc-tx-123',
      amount: 1000
    })),
    receiveUSDCPayment: vi.fn(() => Promise.resolve({
      success: true,
      transactionId: 'repay-tx-456'
    })),
    escrowCollateral: vi.fn(() => Promise.resolve({
      success: true,
      transactionId: 'escrow-tx-789'
    })),
    releaseCollateral: vi.fn(() => Promise.resolve({
      success: true,
      transactionId: 'release-tx-012'
    }))
  }
}))

vi.mock('../transaction-receipt', () => ({
  transactionReceiptService: {
    recordTransaction: vi.fn(() => Promise.resolve({
      success: true,
      transactionId: 'record-tx-345'
    })),
    generateDisbursementReceipt: vi.fn(() => Promise.resolve({
      success: true,
      receiptId: 'receipt-678'
    })),
    sendReceiptNotification: vi.fn(() => Promise.resolve({
      success: true
    })),
    getLoanTransactions: vi.fn(() => Promise.resolve([]))
  }
}))

// Mock tokenization service
const mockTokenizationService = {
  getFarmerPortfolio: vi.fn(() => Promise.resolve({
    farmerId: 'test-farmer',
    totalValue: 1000,
    tokens: [
      {
        tokenId: 'test-token',
        symbol: 'MAZAO-MANIOC-001',
        name: 'Manioc Token',
        balance: '100',
        decimals: 2,
        cropType: 'manioc',
        estimatedValue: 500,
        currentValue: 500,
        harvestDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        isActive: true,
        evaluationId: 'test-eval'
      }
    ]
  }))
}

// Mock USDC transfer service
const mockUSDCTransferService = {
  disburseUSDC: vi.fn(() => Promise.resolve({
    success: true,
    transactionId: 'usdc-tx-123',
    amount: 1000
  })),
  receiveUSDCPayment: vi.fn(() => Promise.resolve({
    success: true,
    transactionId: 'repay-tx-456'
  })),
  escrowCollateral: vi.fn(() => Promise.resolve({
    success: true,
    transactionId: 'escrow-tx-789'
  })),
  releaseCollateral: vi.fn(() => Promise.resolve({
    success: true,
    transactionId: 'release-tx-012'
  }))
}

// Mock transaction receipt service
const mockTransactionReceiptService = {
  recordTransaction: vi.fn(() => Promise.resolve({
    success: true,
    transactionId: 'record-tx-345'
  })),
  generateDisbursementReceipt: vi.fn(() => Promise.resolve({
    success: true,
    receiptId: 'receipt-678'
  })),
  sendReceiptNotification: vi.fn(() => Promise.resolve({
    success: true
  })),
  getLoanTransactions: vi.fn(() => Promise.resolve([]))
}

describe.skip('LoanService', () => {
  let loanService: LoanService

  beforeEach(() => {
    loanService = new LoanService()
    vi.clearAllMocks()
  })

  describe('checkLoanEligibility', () => {
    it('should return eligible when collateral is sufficient', async () => {
      const result = await loanService.checkLoanEligibility('test-farmer', 400)
      
      expect(result.isEligible).toBe(true)
      expect(result.maxLoanAmount).toBe(500) // 1000 / 2
      expect(result.availableCollateral).toBe(1000)
      expect(result.requiredCollateral).toBe(800) // 400 * 2
    })

    it('should return not eligible when collateral is insufficient', async () => {
      const result = await loanService.checkLoanEligibility('test-farmer', 600)
      
      expect(result.isEligible).toBe(false)
      expect(result.reasons).toContain('Collatéral insuffisant. Requis: 1200 USDC, Disponible: 1000 USDC')
    })

    it('should return not eligible when no tokens available', async () => {
      mockTokenizationService.getFarmerPortfolio.mockResolvedValueOnce({
        farmerId: 'test-farmer',
        totalValue: 0,
        tokens: []
      })

      const result = await loanService.checkLoanEligibility('test-farmer', 100)
      
      expect(result.isEligible).toBe(false)
      expect(result.reasons).toContain('Aucun token de collatéral disponible')
    })
  })

  describe('createLoanRequest', () => {
    it('should create loan request when eligible', async () => {
      const request = {
        borrowerId: 'test-farmer',
        requestedAmount: 400,
        purpose: 'Agricultural equipment',
        repaymentPeriodMonths: 6,
        collateralTokenIds: ['test-token']
      }

      const result = await loanService.createLoanRequest(request)
      
      expect(result.success).toBe(true)
      expect(result.loanId).toBe('test-loan-id')
      expect(mockSupabase.from).toHaveBeenCalledWith('loans')
    })

    it('should reject loan request when not eligible', async () => {
      const request = {
        borrowerId: 'test-farmer',
        requestedAmount: 600, // Too high
        purpose: 'Agricultural equipment',
        repaymentPeriodMonths: 6,
        collateralTokenIds: ['test-token']
      }

      const result = await loanService.createLoanRequest(request)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Collatéral insuffisant')
    })
  })

  describe('automaticLoanDisbursement', () => {
    const mockLoan = {
      id: 'test-loan',
      borrower_id: 'test-farmer',
      principal: 1000,
      collateral_amount: 2000,
      status: 'approved'
    }

    beforeEach(() => {
      // Mock getLoanById
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockLoan,
        error: null
      })

      // Mock profile queries for wallet addresses
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: { wallet_address: '0.0.123456' }, error: null }) // borrower
        .mockResolvedValueOnce({ data: { wallet_address: '0.0.789012' }, error: null }) // lender

      // Mock getCollateralTokensForLoan
      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([
        {
          tokenId: '0.0.555555',
          symbol: 'MAZAO-MANIOC',
          name: 'MazaoToken-manioc',
          currentValue: 2000,
          cropType: 'manioc',
          harvestDate: Date.now() + 86400000,
          isActive: true,
          evaluationId: 'eval1'
        }
      ])
    })

    it('should successfully disburse loan with collateral escrow', async () => {
      const result = await loanService.automaticLoanDisbursement('test-loan', 'test-lender')

      expect(result.success).toBe(true)
      expect(result.disbursementTransactionId).toBe('usdc-tx-123')
      expect(result.escrowTransactionId).toBe('escrow-tx-789')

      // Verify escrow was called
      expect(mockUSDCTransferService.escrowCollateral).toHaveBeenCalledWith({
        tokenId: '0.0.555555',
        amount: 2000,
        fromAccountId: '0.0.123456',
        escrowAccountId: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID,
        loanId: 'test-loan'
      })

      // Verify disbursement was called
      expect(mockUSDCTransferService.disburseUSDC).toHaveBeenCalledWith(
        '0.0.123456',
        1000,
        'test-loan'
      )

      // Verify transactions were recorded
      expect(mockTransactionReceiptService.recordTransaction).toHaveBeenCalledTimes(2)

      // Verify receipt was generated
      expect(mockTransactionReceiptService.generateDisbursementReceipt).toHaveBeenCalled()
    })

    it('should handle escrow failure', async () => {
      mockUSDCTransferService.escrowCollateral.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient token balance'
      })

      const result = await loanService.automaticLoanDisbursement('test-loan', 'test-lender')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Collateral escrow failed')

      // Verify disbursement was not called
      expect(mockUSDCTransferService.disburseUSDC).not.toHaveBeenCalled()
    })

    it('should handle disbursement failure and release collateral', async () => {
      mockUSDCTransferService.disburseUSDC.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient USDC balance'
      })

      const result = await loanService.automaticLoanDisbursement('test-loan', 'test-lender')

      expect(result.success).toBe(false)
      expect(result.error).toContain('USDC disbursement failed')

      // Verify collateral release was attempted
      expect(mockUSDCTransferService.releaseCollateral).toHaveBeenCalled()
    })
  })

  describe('repayLoan', () => {
    const mockLoan = {
      id: 'test-loan',
      borrower_id: 'test-farmer',
      principal: 1000,
      collateral_amount: 2000,
      status: 'active'
    }

    beforeEach(() => {
      // Mock getLoanById
      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as never)

      // Mock borrower profile query
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { wallet_address: '0.0.123456' },
        error: null
      })

      // Mock getCollateralTokensForLoan
      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([
        {
          tokenId: '0.0.555555',
          symbol: 'MAZAO-MANIOC',
          name: 'MazaoToken-manioc',
          currentValue: 2000,
          cropType: 'manioc',
          harvestDate: Date.now() + 86400000,
          isActive: true,
          evaluationId: 'eval1'
        }
      ])
    })

    it('should successfully process full repayment and release collateral', async () => {
      const repayment = {
        loanId: 'test-loan',
        amount: 1000,
        paymentType: 'full' as const
      }

      const result = await loanService.repayLoan(repayment)

      expect(result.success).toBe(true)
      expect(result.repaymentTransactionId).toBe('repay-tx-456')
      expect(result.collateralReleaseTransactionId).toBe('release-tx-012')

      // Verify repayment was processed
      expect(mockUSDCTransferService.receiveUSDCPayment).toHaveBeenCalledWith(
        '0.0.123456',
        1000,
        'test-loan'
      )

      // Verify collateral was released
      expect(mockUSDCTransferService.releaseCollateral).toHaveBeenCalled()

      // Verify loan status was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('loans')
    })

    it('should handle partial repayment without releasing collateral', async () => {
      const repayment = {
        loanId: 'test-loan',
        amount: 500,
        paymentType: 'partial' as const
      }

      const result = await loanService.repayLoan(repayment)

      expect(result.success).toBe(true)
      expect(result.repaymentTransactionId).toBe('repay-tx-456')
      expect(result.collateralReleaseTransactionId).toBeUndefined()

      // Verify collateral was not released
      expect(mockUSDCTransferService.releaseCollateral).not.toHaveBeenCalled()
    })

    it('should handle repayment failure', async () => {
      mockUSDCTransferService.receiveUSDCPayment.mockResolvedValueOnce({
        success: false,
        error: 'Transaction failed'
      })

      const repayment = {
        loanId: 'test-loan',
        amount: 1000,
        paymentType: 'full' as const
      }

      const result = await loanService.repayLoan(repayment)

      expect(result.success).toBe(false)
      expect(result.error).toContain('USDC repayment failed')
    })
  })

  describe('validateLoanForDisbursement', () => {
    it('should return valid for properly configured loan', async () => {
      const mockLoan = {
        id: 'test-loan',
        borrower_id: 'test-farmer',
        principal: 1000,
        status: 'approved',
        lender: { id: 'test-lender' }
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as never)
      vi.spyOn(loanService, 'getCollateralTokensForLoan').mockResolvedValue([
        { tokenId: 'token1' } as never
      ])
      vi.spyOn(loanService, 'checkLoanEligibility').mockResolvedValue({
        isEligible: true,
        maxLoanAmount: 1000,
        availableCollateral: 2000,
        collateralRatio: 2,
        requiredCollateral: 2000
      })

      // Mock profile queries
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: { wallet_address: '0.0.123456' }, error: null })
        .mockResolvedValueOnce({ data: { wallet_address: '0.0.789012' }, error: null })

      const result = await loanService.validateLoanForDisbursement('test-loan')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for missing loan', async () => {
      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(null)

      const result = await loanService.validateLoanForDisbursement('test-loan')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Loan not found')
    })

    it('should return invalid for loan with wrong status', async () => {
      const mockLoan = {
        id: 'test-loan',
        borrower_id: 'test-farmer',
        principal: 1000,
        status: 'pending',
        lender: { id: 'test-lender' }
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as never)

      const result = await loanService.validateLoanForDisbursement('test-loan')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Loan status is pending, expected 'approved'")
    })
  })

  describe('calculateInterest', () => {
    it('should calculate interest correctly', () => {
      // Access private method through any cast for testing
      const calculation = (loanService as never).calculateInterest(1000, 0.12, 12)
      
      expect(calculation.principal).toBe(1000)
      expect(calculation.annualRate).toBe(0.12)
      expect(calculation.termMonths).toBe(12)
      expect(calculation.monthlyPayment).toBeGreaterThan(0)
      expect(calculation.totalAmount).toBeGreaterThan(1000)
      expect(calculation.totalInterest).toBeGreaterThan(0)
    })
  })
})