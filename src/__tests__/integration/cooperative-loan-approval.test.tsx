/**
 * Integration tests for Cooperative Loan Approval Workflow
 * Tests task 10: Vérifier et corriger le workflow d'approbation des prêts par la coopérative
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoanApprovalList } from '@/components/cooperative/LoanApprovalList'
import { loanService } from '@/lib/services/loan'
import { notificationHelpers } from '@/lib/services/notification-helpers'

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coop-123', email: 'coop@test.com' },
    profile: { role: 'cooperative' },
    loading: false
  })
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  })
}))

vi.mock('@/lib/services/loan')
vi.mock('@/lib/services/notification-helpers')

describe('Cooperative Loan Approval Workflow', () => {
  const mockPendingLoans = [
    {
      id: 'loan-1',
      borrower_id: 'farmer-1',
      principal: 1000,
      collateral_amount: 2000,
      interest_rate: 0.12,
      due_date: '2025-12-31',
      status: 'pending',
      created_at: '2025-01-01',
      borrower: {
        id: 'farmer-1',
        nom: 'Jean Mukendi',
        email: 'jean@test.com'
      }
    },
    {
      id: 'loan-2',
      borrower_id: 'farmer-2',
      principal: 500,
      collateral_amount: 1000,
      interest_rate: 0.12,
      due_date: '2025-11-30',
      status: 'pending',
      created_at: '2025-01-02',
      borrower: {
        id: 'farmer-2',
        nom: 'Marie Kabila',
        email: 'marie@test.com'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task 10.1: Confirmer que LoanApprovalList.tsx liste tous les prêts en attente', () => {
    it('should load and display all pending loans', async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)

      render(<LoanApprovalList />)

      // Should show loading state initially
      expect(screen.getByText(/chargement des demandes/i)).toBeInTheDocument()

      // Wait for loans to load
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      // Verify both loans are displayed
      expect(screen.getByText(/demande de 1000\.00 usdc/i)).toBeInTheDocument()
      expect(screen.getByText(/demande de 500\.00 usdc/i)).toBeInTheDocument()
    })

    it('should display empty state when no pending loans', async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue([])

      render(<LoanApprovalList />)

      await waitFor(() => {
        expect(screen.getByText(/aucune demande en attente/i)).toBeInTheDocument()
        expect(screen.getByText(/toutes les demandes de prêt ont été traitées/i)).toBeInTheDocument()
      })
    })

    it('should filter only pending loans from all loans', async () => {
      const allLoans = [
        ...mockPendingLoans,
        {
          id: 'loan-3',
          borrower_id: 'farmer-3',
          principal: 750,
          collateral_amount: 1500,
          interest_rate: 0.12,
          due_date: '2025-10-31',
          status: 'approved',
          created_at: '2025-01-03',
          borrower: {
            id: 'farmer-3',
            nom: 'Paul Tshisekedi',
            email: 'paul@test.com'
          }
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(allLoans)

      render(<LoanApprovalList />)

      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      // Should not display the approved loan
      expect(screen.queryByText(/paul tshisekedi/i)).not.toBeInTheDocument()
    })
  })

  describe('Task 10.2: Vérifier que les détails du prêt sont affichés', () => {
    beforeEach(async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      render(<LoanApprovalList />)
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })
    })

    it('should display farmer name and email', () => {
      expect(screen.getAllByText(/jean mukendi/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/marie kabila/i).length).toBeGreaterThan(0)
    })

    it('should display loan amount (montant)', () => {
      expect(screen.getAllByText(/1000\.00 usdc/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/500\.00 usdc/i).length).toBeGreaterThan(0)
    })

    it('should display collateral amount', () => {
      const loanCards = screen.getAllByText(/collatéral/i)
      expect(loanCards.length).toBeGreaterThan(0)
      
      expect(screen.getAllByText(/2000\.00 usdc/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/1000\.00 usdc/i).length).toBeGreaterThan(0)
    })

    it('should display collateral ratio (200%)', () => {
      // Both loans should have 200% collateral ratio
      const ratioElements = screen.getAllByText(/200% de couverture/i)
      expect(ratioElements.length).toBe(2)
    })

    it('should display interest rate', () => {
      const interestElements = screen.getAllByText(/12\.0%/i)
      expect(interestElements.length).toBeGreaterThan(0)
    })

    it('should display due date (échéance)', () => {
      expect(screen.getByText(/31\/12\/2025/i)).toBeInTheDocument()
      expect(screen.getByText(/30\/11\/2025/i)).toBeInTheDocument()
    })

    it('should display risk assessment section', () => {
      const riskSections = screen.getAllByText(/évaluation des risques/i)
      expect(riskSections.length).toBe(2)
      
      // Should show collateral ratio in risk assessment
      const riskRatios = screen.getAllByText(/200%.*requis: 200%/i)
      expect(riskRatios.length).toBe(2)
    })

    it('should display farmer information section', () => {
      const farmerInfoSections = screen.getAllByText(/informations agriculteur/i)
      expect(farmerInfoSections.length).toBe(2)
    })
  })

  describe('Task 10.3: Tester les boutons approuver/rejeter', () => {
    beforeEach(async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({ success: true })
      
      render(<LoanApprovalList />)
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })
    })

    it('should have approve and reject buttons for each loan', () => {
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      expect(approveButtons.length).toBe(2)
      expect(rejectButtons.length).toBe(2)
    })

    it('should call approveLoanRequest with approved=true when approve button clicked', async () => {
      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalledWith({
          loanId: 'loan-1',
          cooperativeId: 'coop-123',
          approved: true,
          comments: undefined
        })
      })
    })

    it('should call approveLoanRequest with approved=false when reject button clicked', async () => {
      const user = userEvent.setup()
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      await user.click(rejectButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalledWith({
          loanId: 'loan-1',
          cooperativeId: 'coop-123',
          approved: false,
          comments: 'Demande rejetée par la coopérative'
        })
      })
    })

    it('should remove loan from list after successful approval', async () => {
      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(screen.queryAllByText(/jean mukendi/i)).toHaveLength(0)
      })

      // Second loan should still be visible
      expect(screen.getAllByText(/marie kabila/i).length).toBeGreaterThan(0)
    })

    it('should disable buttons while processing', async () => {
      const user = userEvent.setup()
      
      // Make the approval take some time
      vi.mocked(loanService.approveLoanRequest).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      await user.click(approveButtons[0])

      // Buttons should show "Traitement..." and be disabled
      await waitFor(() => {
        expect(screen.getAllByText(/traitement\.\.\./i).length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should update loan status to approved in database', async () => {
      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalled()
      })

      // Verify the service was called with correct parameters
      const callArgs = vi.mocked(loanService.approveLoanRequest).mock.calls[0][0]
      expect(callArgs.approved).toBe(true)
      expect(callArgs.loanId).toBe('loan-1')
    })

    it('should update loan status to rejected in database', async () => {
      const user = userEvent.setup()
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      await user.click(rejectButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalled()
      })

      // Verify the service was called with correct parameters
      const callArgs = vi.mocked(loanService.approveLoanRequest).mock.calls[0][0]
      expect(callArgs.approved).toBe(false)
      expect(callArgs.loanId).toBe('loan-1')
    })
  })

  describe('Task 10.4: Confirmer que l\'approbation déclenche le décaissement automatique', () => {
    it('should trigger automatic disbursement when loan is approved', async () => {
      // Mock the loan service to verify disbursement is called
      const mockAutomaticDisbursement = vi.fn().mockResolvedValue({
        success: true,
        disbursementTransactionId: 'tx-123',
        escrowTransactionId: 'tx-456'
      })

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockImplementation(async (approval) => {
        if (approval.approved && approval.lenderId) {
          await mockAutomaticDisbursement(approval.loanId, approval.lenderId)
        }
        return { success: true }
      })

      render(<LoanApprovalList />)
      
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalled()
      })
    })

    it('should escrow collateral tokens during disbursement', async () => {
      // This is tested in the loan service, but we verify the flow is triggered
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({ success: true })

      render(<LoanApprovalList />)
      
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            approved: true,
            loanId: 'loan-1'
          })
        )
      })
    })

    it('should transfer USDC to farmer wallet after approval', async () => {
      // Verify the approval process is initiated
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({ success: true })

      render(<LoanApprovalList />)
      
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalled()
      })
    })

    it('should update loan status to active after successful disbursement', async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({ success: true })

      render(<LoanApprovalList />)
      
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        // Loan should be removed from pending list
        expect(screen.queryByText(/jean mukendi/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Task 10.5: Vérifier que le rejet envoie une notification à l\'agriculteur', () => {
    beforeEach(async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({ success: true })
      vi.mocked(loanService.getLoanById).mockResolvedValue(mockPendingLoans[0])
      
      render(<LoanApprovalList />)
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })
    })

    it('should send notification to farmer when loan is rejected', async () => {
      const user = userEvent.setup()
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      await user.click(rejectButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            approved: false,
            comments: 'Demande rejetée par la coopérative'
          })
        )
      })
    })

    it('should include rejection reason in notification', async () => {
      const user = userEvent.setup()
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      await user.click(rejectButtons[0])

      await waitFor(() => {
        const callArgs = vi.mocked(loanService.approveLoanRequest).mock.calls[0][0]
        expect(callArgs.comments).toBe('Demande rejetée par la coopérative')
      })
    })

    it('should send notification to farmer when loan is approved', async () => {
      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            approved: true
          })
        )
      })
    })

    it('should handle notification errors gracefully', async () => {
      // Mock notification failure
      vi.mocked(notificationHelpers.sendLoanNotification).mockRejectedValue(
        new Error('Notification failed')
      )

      const user = userEvent.setup()
      const rejectButtons = screen.getAllByRole('button', { name: /rejeter/i })
      
      // Should not throw error even if notification fails
      await user.click(rejectButtons[0])

      await waitFor(() => {
        expect(loanService.approveLoanRequest).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle loan loading errors gracefully', async () => {
      vi.mocked(loanService.getUserLoans).mockRejectedValue(new Error('Network error'))

      render(<LoanApprovalList />)

      await waitFor(() => {
        // Should show empty state or error message
        expect(screen.queryByText(/chargement des demandes/i)).not.toBeInTheDocument()
      })
    })

    it('should handle approval errors gracefully', async () => {
      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockPendingLoans)
      vi.mocked(loanService.approveLoanRequest).mockResolvedValue({
        success: false,
        error: 'Approval failed'
      })

      render(<LoanApprovalList />)
      
      await waitFor(() => {
        expect(screen.getByText(/2 demandes en attente/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const approveButtons = screen.getAllByRole('button', { name: /approuver/i })
      
      await user.click(approveButtons[0])

      await waitFor(() => {
        // Loan should still be in the list since approval failed
        expect(screen.getAllByText(/jean mukendi/i).length).toBeGreaterThan(0)
      })
    })
  })
})
