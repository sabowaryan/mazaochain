import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanRepaymentInterface } from '@/components/loan/LoanRepaymentInterface'
import { RepaymentHistory } from '@/components/loan/RepaymentHistory'
import { LoanDetailsPage } from '@/components/loan/LoanDetailsPage'
import { loanService } from '@/lib/services/loan'
import { transactionReceiptService } from '@/lib/services/transaction-receipt'
import type { LoanDetails } from '@/types/loan'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    })
  })
}))

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'farmer-123', email: 'farmer@test.com' },
    profile: { role: 'agriculteur' }
  })
}))

vi.mock('@/lib/services/loan')
vi.mock('@/lib/services/transaction-receipt')

describe('Loan Repayment System Integration', () => {
  const mockActiveLoan: LoanDetails = {
    id: 'loan-123',
    borrower_id: 'farmer-123',
    lender_id: 'lender-456',
    principal: 1000,
    collateral_amount: 2000,
    interest_rate: 0.12,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    created_at: new Date().toISOString(),
    borrower: {
      id: 'farmer-123',
      nom: 'Jean Farmer',
      email: 'farmer@test.com'
    },
    lender: {
      id: 'lender-456',
      institution_name: 'Test Bank'
    }
  }

  const mockRepaymentTransactions = [
    {
      id: 'tx-1',
      loan_id: 'loan-123',
      transaction_type: 'repayment',
      amount: 500,
      token_type: 'USDC',
      from_address: '0.0.123',
      to_address: '0.0.456',
      hedera_transaction_id: '0.0.123@1234567890.123456789',
      status: 'confirmed',
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LoanRepaymentInterface Component', () => {
    it('should display loan details and outstanding balance', async () => {
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Détails du Prêt')).toBeInTheDocument()
        expect(screen.getByText('1000.00 USDC')).toBeInTheDocument()
        expect(screen.getByText('12.0% annuel')).toBeInTheDocument()
      })

      // Check outstanding balance display
      await waitFor(() => {
        expect(screen.getByText('Solde Restant')).toBeInTheDocument()
        expect(screen.getByText('1010.00 USDC')).toBeInTheDocument()
      })
    })

    it('should display due date correctly', async () => {
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Date d\'Échéance')).toBeInTheDocument()
      })
    })

    it('should allow selecting full repayment', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Remboursement Complet (1010.00 USDC)')).toBeInTheDocument()
      })

      const fullRepaymentRadio = screen.getByLabelText(/Remboursement Complet/i)
      expect(fullRepaymentRadio).toBeChecked()

      // Check that amount is pre-filled
      const amountInput = screen.getByLabelText('Montant (USDC)') as HTMLInputElement
      expect(amountInput.value).toBe('1010.00')
      expect(amountInput).toBeDisabled()
    })

    it('should allow selecting partial repayment', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Remboursement Partiel')).toBeInTheDocument()
      })

      const partialRepaymentRadio = screen.getByLabelText(/Remboursement Partiel/i)
      await user.click(partialRepaymentRadio)

      expect(partialRepaymentRadio).toBeChecked()

      // Check that amount input is enabled and empty
      const amountInput = screen.getByLabelText('Montant (USDC)') as HTMLInputElement
      expect(amountInput).not.toBeDisabled()
      expect(amountInput.value).toBe('')
    })

    it('should validate repayment amount', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      // Switch to partial repayment
      const partialRepaymentRadio = screen.getByLabelText(/Remboursement Partiel/i)
      await user.click(partialRepaymentRadio)

      const amountInput = screen.getByLabelText('Montant (USDC)')
      
      // Try to enter amount exceeding total owed
      await user.clear(amountInput)
      await user.type(amountInput, '2000')

      const repayButton = screen.getByRole('button', { name: /Rembourser/i })
      await user.click(repayButton)

      await waitFor(() => {
        expect(screen.getByText(/Le montant ne peut pas dépasser le solde dû/i)).toBeInTheDocument()
      })
    })

    it('should process full repayment successfully', async () => {
      const user = userEvent.setup()
      const onRepaymentSuccess = vi.fn()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123',
        collateralReleaseTransactionId: 'tx-release-456'
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
          onRepaymentSuccess={onRepaymentSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Remboursement Complet (1010.00 USDC)')).toBeInTheDocument()
      })

      const repayButton = screen.getByRole('button', { name: /Rembourser 1010.00 USDC/i })
      await user.click(repayButton)

      await waitFor(() => {
        expect(loanService.repayLoan).toHaveBeenCalledWith({
          loanId: 'loan-123',
          amount: 1010,
          paymentType: 'full'
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/Prêt remboursé avec succès! Votre collatéral a été libéré./i)).toBeInTheDocument()
      })

      // Check that success callback is called after delay
      await waitFor(() => {
        expect(onRepaymentSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should process partial repayment successfully', async () => {
      const user = userEvent.setup()
      const onRepaymentSuccess = vi.fn()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123'
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
          onRepaymentSuccess={onRepaymentSuccess}
        />
      )

      // Switch to partial repayment
      const partialRepaymentRadio = screen.getByLabelText(/Remboursement Partiel/i)
      await user.click(partialRepaymentRadio)

      const amountInput = screen.getByLabelText('Montant (USDC)')
      await user.type(amountInput, '500')

      const repayButton = screen.getByRole('button', { name: /Rembourser 500.00 USDC/i })
      await user.click(repayButton)

      await waitFor(() => {
        expect(loanService.repayLoan).toHaveBeenCalledWith({
          loanId: 'loan-123',
          amount: 500,
          paymentType: 'partial'
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/Remboursement partiel de 500.00 USDC effectué avec succès./i)).toBeInTheDocument()
      })
    })

    it('should show collateral release info for full repayment', async () => {
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Libération du Collatéral')).toBeInTheDocument()
        expect(screen.getByText(/votre collatéral de 2000.00 USDC sera automatiquement libéré/i)).toBeInTheDocument()
      })
    })

    it('should handle repayment errors gracefully', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: false,
        error: 'Insufficient USDC balance'
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rembourser 1010.00 USDC/i })).toBeInTheDocument()
      })

      const repayButton = screen.getByRole('button', { name: /Rembourser 1010.00 USDC/i })
      await user.click(repayButton)

      await waitFor(() => {
        expect(screen.getByText(/Insufficient USDC balance/i)).toBeInTheDocument()
      })
    })

    it('should update outstanding balance after loading', async () => {
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 800,
        interest: 8,
        total: 808
      })

      render(
        <LoanRepaymentInterface 
          loan={mockActiveLoan}
        />
      )

      // Should show loading state first
      expect(screen.getByText('Chargement du solde...')).toBeInTheDocument()

      // Then show the balance
      await waitFor(() => {
        expect(screen.getByText('808.00 USDC')).toBeInTheDocument()
      })
    })
  })

  describe('RepaymentHistory Component', () => {
    it('should display repayment history', async () => {
      vi.mocked(transactionReceiptService.getLoanTransactions).mockResolvedValue(mockRepaymentTransactions)

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Historique des Remboursements')).toBeInTheDocument()
        expect(screen.getByText('1 transaction trouvée')).toBeInTheDocument()
      })

      // Check transaction details
      expect(screen.getByText('Remboursement')).toBeInTheDocument()
      expect(screen.getByText('500.00 USDC')).toBeInTheDocument()
      expect(screen.getByText('Confirmé')).toBeInTheDocument()
    })

    it('should display empty state when no repayments', async () => {
      vi.mocked(transactionReceiptService.getLoanTransactions).mockResolvedValue([])

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Aucune transaction de remboursement trouvée')).toBeInTheDocument()
        expect(screen.getByText(/Aucune transaction de remboursement n'a encore été effectuée/i)).toBeInTheDocument()
      })
    })

    it('should display collateral release transactions', async () => {
      const transactionsWithRelease = [
        ...mockRepaymentTransactions,
        {
          id: 'tx-2',
          loan_id: 'loan-123',
          transaction_type: 'release',
          amount: 2000,
          token_type: 'MAZAO',
          from_address: '0.0.456',
          to_address: '0.0.123',
          hedera_transaction_id: '0.0.456@1234567890.123456789',
          status: 'confirmed',
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(transactionReceiptService.getLoanTransactions).mockResolvedValue(transactionsWithRelease)

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Libération Collatéral')).toBeInTheDocument()
        expect(screen.getByText('2000.00 MAZAO')).toBeInTheDocument()
      })
    })

    it('should show Hedera explorer link for transactions', async () => {
      vi.mocked(transactionReceiptService.getLoanTransactions).mockResolvedValue(mockRepaymentTransactions)

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('ID Transaction Hedera')).toBeInTheDocument()
        expect(screen.getByText('0.0.123@1234567890.123456789')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Voir sur Hedera/i })).toBeInTheDocument()
      })
    })

    it('should handle loading state', () => {
      vi.mocked(transactionReceiptService.getLoanTransactions).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      expect(screen.getByText('Chargement de l\'historique...')).toBeInTheDocument()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(transactionReceiptService.getLoanTransactions).mockRejectedValue(
        new Error('Database connection failed')
      )

      render(
        <RepaymentHistory 
          loanId="loan-123"
          borrowerId="farmer-123"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Erreur de chargement')).toBeInTheDocument()
        expect(screen.getByText(/Erreur lors du chargement de l'historique/i)).toBeInTheDocument()
      })

      // Should have retry button
      expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument()
    })
  })

  describe('LoanDetailsPage Integration', () => {
    it('should integrate repayment interface and history', async () => {
      vi.mocked(loanService.getLoanById).mockResolvedValue(mockActiveLoan)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])
      vi.mocked(transactionReceiptService.getLoanTransactions).mockResolvedValue(mockRepaymentTransactions)

      render(
        <LoanDetailsPage loanId="loan-123" />
      )

      await waitFor(() => {
        expect(screen.getByText('Détails du Prêt')).toBeInTheDocument()
      })

      // Should show repayment section for active loans
      expect(screen.getByText('Remboursement')).toBeInTheDocument()
      expect(screen.getByText('Prêt Actif')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Effectuer un Remboursement/i })).toBeInTheDocument()

      // Should show repayment history
      expect(screen.getByText('Historique des Remboursements')).toBeInTheDocument()
    })

    it('should show repayment interface when button clicked', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getLoanById).mockResolvedValue(mockActiveLoan)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })

      render(
        <LoanDetailsPage loanId="loan-123" />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Effectuer un Remboursement/i })).toBeInTheDocument()
      })

      const repayButton = screen.getByRole('button', { name: /Effectuer un Remboursement/i })
      await user.click(repayButton)

      await waitFor(() => {
        expect(screen.getByText('Solde Restant')).toBeInTheDocument()
        expect(screen.getByText('Remboursement Complet (1010.00 USDC)')).toBeInTheDocument()
      })
    })

    it('should not show repayment interface for non-active loans', async () => {
      const repaidLoan = { ...mockActiveLoan, status: 'repaid' as const }
      
      vi.mocked(loanService.getLoanById).mockResolvedValue(repaidLoan)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])

      render(
        <LoanDetailsPage loanId="loan-123" />
      )

      await waitFor(() => {
        expect(screen.getByText('Détails du Prêt')).toBeInTheDocument()
      })

      // Should not show repayment section
      expect(screen.queryByText('Effectuer un Remboursement')).not.toBeInTheDocument()
    })

    it('should reload loan details after successful repayment', async () => {
      const user = userEvent.setup()
      
      vi.mocked(loanService.getLoanById).mockResolvedValue(mockActiveLoan)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])
      vi.mocked(loanService.getOutstandingBalance).mockResolvedValue({
        principal: 1000,
        interest: 10,
        total: 1010
      })
      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-123'
      })

      render(
        <LoanDetailsPage loanId="loan-123" />
      )

      // Open repayment interface
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Effectuer un Remboursement/i })).toBeInTheDocument()
      })

      const openRepayButton = screen.getByRole('button', { name: /Effectuer un Remboursement/i })
      await user.click(openRepayButton)

      // Process repayment
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rembourser 1010.00 USDC/i })).toBeInTheDocument()
      })

      const repayButton = screen.getByRole('button', { name: /Rembourser 1010.00 USDC/i })
      await user.click(repayButton)

      // Should reload loan details
      await waitFor(() => {
        expect(loanService.getLoanById).toHaveBeenCalledTimes(2) // Initial load + reload after repayment
      }, { timeout: 3000 })
    })
  })

  describe('Database Integration', () => {
    it('should update loan status to repaid after full repayment', async () => {
      const repaymentData = {
        loanId: 'loan-123',
        amount: 1010,
        paymentType: 'full' as const
      }

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123',
        collateralReleaseTransactionId: 'tx-release-456'
      })

      const result = await loanService.repayLoan(repaymentData)

      expect(result.success).toBe(true)
      expect(result.repaymentTransactionId).toBeDefined()
      expect(result.collateralReleaseTransactionId).toBeDefined()
    })

    it('should record repayment transaction in database', async () => {
      const repaymentData = {
        loanId: 'loan-123',
        amount: 500,
        paymentType: 'partial' as const
      }

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123'
      })

      await loanService.repayLoan(repaymentData)

      // Verify transaction was recorded
      expect(loanService.repayLoan).toHaveBeenCalledWith(repaymentData)
    })
  })

  describe('Collateral Release', () => {
    it('should automatically release collateral on full repayment', async () => {
      const repaymentData = {
        loanId: 'loan-123',
        amount: 1010,
        paymentType: 'full' as const
      }

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123',
        collateralReleaseTransactionId: 'tx-release-456'
      })

      const result = await loanService.repayLoan(repaymentData)

      expect(result.success).toBe(true)
      expect(result.collateralReleaseTransactionId).toBe('tx-release-456')
    })

    it('should not release collateral on partial repayment', async () => {
      const repaymentData = {
        loanId: 'loan-123',
        amount: 500,
        paymentType: 'partial' as const
      }

      vi.mocked(loanService.repayLoan).mockResolvedValue({
        success: true,
        repaymentTransactionId: 'tx-repay-123'
      })

      const result = await loanService.repayLoan(repaymentData)

      expect(result.success).toBe(true)
      expect(result.collateralReleaseTransactionId).toBeUndefined()
    })
  })
})
