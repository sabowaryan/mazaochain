import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { LoanRepayment } from '@/types/loan'

// Mock all external dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => ({ 
            data: { 
              wallet_address: '0.0.123456',
              outstanding_balance: 1000,
              total_repaid: 0 
            }, 
            error: null 
          }),
          order: () => ({ data: [], error: null })
        }) 
      }),
      insert: () => ({ select: () => ({ single: () => ({ data: { id: 'test-id' }, error: null }) }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) })
    }),
    rpc: () => ({ data: null, error: null })
  })
}))

vi.mock('../notification', () => ({
  notificationService: {
    sendNotification: vi.fn(() => Promise.resolve({ success: true }))
  }
}))

vi.mock('../notification-helpers', () => ({
  sendRepaymentNotification: vi.fn(() => Promise.resolve({ success: true }))
}))

vi.mock('../tokenization', () => ({
  tokenizationService: {
    getFarmerPortfolio: () => Promise.resolve({ totalValue: 2000, tokens: [] })
  }
}))

vi.mock('../usdc-transfer', () => ({
  usdcTransferService: {
    receiveUSDCPayment: () => Promise.resolve({ success: true, transactionId: 'tx-123' }),
    releaseCollateral: () => Promise.resolve({ success: true, transactionId: 'tx-456' })
  }
}))

vi.mock('../transaction-receipt', () => ({
  transactionReceiptService: {
    recordTransaction: () => Promise.resolve(),
    getLoanTransactions: () => Promise.resolve([])
  }
}))

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_HEDERA_ACCOUNT_ID', '0.0.123456')

// Import after mocking
const { loanService } = await import('../loan')

describe('Loan Repayment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('repayLoan', () => {
    it('should process full repayment successfully', async () => {
      const mockRepayment: LoanRepayment = {
        loanId: 'loan-123',
        amount: 1000,
        paymentType: 'full'
      }

      // Mock the loan service methods
      const mockLoan = {
        id: 'loan-123',
        borrower_id: 'borrower-123',
        principal: 1000,
        collateral_amount: 2000,
        interest_rate: 0.12,
        status: 'active',
        due_date: '2024-12-31',
        created_at: '2024-01-01'
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as any)
      
      const result = await loanService.repayLoan(mockRepayment)

      expect(result.success).toBe(true)
      expect(result.repaymentTransactionId).toBeDefined()
    })

    it('should process partial repayment successfully', async () => {
      const mockRepayment: LoanRepayment = {
        loanId: 'loan-123',
        amount: 500,
        paymentType: 'partial'
      }

      const mockLoan = {
        id: 'loan-123',
        borrower_id: 'borrower-123',
        principal: 1000,
        collateral_amount: 2000,
        interest_rate: 0.12,
        status: 'active',
        due_date: '2024-12-31',
        created_at: '2024-01-01'
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as any)
      
      const result = await loanService.repayLoan(mockRepayment)

      expect(result.success).toBe(true)
      expect(result.repaymentTransactionId).toBeDefined()
      expect(result.collateralReleaseTransactionId).toBeUndefined() // No collateral release for partial
    })

    it('should handle repayment errors gracefully', async () => {
      const mockRepayment: LoanRepayment = {
        loanId: 'invalid-loan',
        amount: 1000,
        paymentType: 'full'
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(null)
      
      const result = await loanService.repayLoan(mockRepayment)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Loan not found')
    })
  })

  describe('getOutstandingBalance', () => {
    it('should calculate outstanding balance correctly', async () => {
      const mockLoan = {
        id: 'loan-123',
        borrower_id: 'borrower-123',
        principal: 1000,
        interest_rate: 0.12,
        created_at: '2024-01-01'
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as unknown)
      
      const balance = await loanService.getOutstandingBalance('loan-123')

      expect(balance.principal).toBeGreaterThan(0)
      expect(balance.interest).toBeGreaterThan(0)
      expect(balance.total).toBe(balance.principal + balance.interest)
    })
  })

  describe('generateRepaymentSchedule', () => {
    it('should generate repayment schedule successfully', async () => {
      const mockLoan = {
        id: 'loan-123',
        principal: 1000,
        interest_rate: 0.12
      }

      vi.spyOn(loanService, 'getLoanById').mockResolvedValue(mockLoan as unknown)
      
      const result = await loanService.generateRepaymentSchedule('loan-123')

      expect(result.success).toBe(true)
    })
  })

  describe('getRepaymentSchedule', () => {
    it('should return repayment schedule for a loan', async () => {
      const schedule = await loanService.getRepaymentSchedule('loan-123')

      expect(Array.isArray(schedule)).toBe(true)
    })
  })
})