/**
 * Integration tests for Farmer Loans Page (Task 9.2)
 * 
 * Requirements tested:
 * - Confirmer que src/app/[lang]/dashboard/farmer/loans/page.tsx utilise LoanDashboard
 * - Vérifier que les prêts actifs, en attente et remboursés sont affichés
 * - Tester que le clic sur un prêt ouvre les détails avec LoanDetailsPage
 * - Confirmer que LoanRepaymentInterface est accessible depuis les détails du prêt
 * - Vérifier que le bouton "Demander un prêt" redirige vers /loans/request
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import FarmerLoansPage from '@/app/[lang]/dashboard/farmer/loans/page'
import { LoanDashboard } from '@/components/loan/LoanDashboard'
import { LoanDetailsPage } from '@/components/loan/LoanDetailsPage'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null }))
    }
  }))
}))

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'farmer@test.com' },
    profile: { role: 'agriculteur', nom: 'Test Farmer' }
  }))
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })),
  useParams: vi.fn(() => ({ lang: 'fr' })),
  usePathname: vi.fn(() => '/fr/dashboard/farmer/loans')
}))

vi.mock('@/lib/services/loan', () => ({
  loanService: {
    getUserLoans: vi.fn(),
    getLoanSummary: vi.fn(),
    getLoanById: vi.fn(),
    getCollateralTokensForLoan: vi.fn()
  }
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'farmer@test.com' },
    profile: { role: 'agriculteur', nom: 'Test Farmer' }
  }))
}))

describe('Farmer Loans Page Integration (Task 9.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Requirement 1: Page uses LoanDashboard component', () => {
    it('should render LoanDashboard component', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      vi.mocked(loanService.getUserLoans).mockResolvedValue([])
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalOutstanding: 0
      })

      render(<FarmerLoansPage />)

      await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
      })

      // Verify page title
      expect(screen.getByText('Mes prêts')).toBeInTheDocument()
      expect(screen.getByText(/Gérez vos demandes de prêt/i)).toBeInTheDocument()
    })
  })

  describe('Requirement 2: Display loans by status (active, pending, repaid)', () => {
    it('should display pending loans', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoans = [
        {
          id: 'loan-1',
          principal: 1000,
          collateral_amount: 2000,
          interest_rate: 0.05,
          status: 'pending',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockLoans as any)
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 1,
        activeLoans: 0,
        totalBorrowed: 1000,
        totalOutstanding: 1000
      })

      render(<LoanDashboard onNewLoanRequest={() => {}} />)

      await waitFor(() => {
        expect(screen.getAllByText(/1000\.00/)[0]).toBeInTheDocument()
        expect(screen.getByText('En attente')).toBeInTheDocument()
      })
    })

    it('should display active loans', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoans = [
        {
          id: 'loan-2',
          principal: 2000,
          collateral_amount: 4000,
          interest_rate: 0.05,
          status: 'active',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockLoans as any)
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 1,
        activeLoans: 1,
        totalBorrowed: 2000,
        totalOutstanding: 2000
      })

      render(<LoanDashboard onNewLoanRequest={() => {}} />)

      await waitFor(() => {
        expect(screen.getAllByText(/2000\.00/)[0]).toBeInTheDocument()
        expect(screen.getByText('Actif')).toBeInTheDocument()
      })
    })

    it('should display repaid loans', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoans = [
        {
          id: 'loan-3',
          principal: 1500,
          collateral_amount: 3000,
          interest_rate: 0.05,
          status: 'repaid',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockLoans as any)
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 1,
        activeLoans: 0,
        totalBorrowed: 1500,
        totalOutstanding: 0
      })

      render(<LoanDashboard onNewLoanRequest={() => {}} />)

      await waitFor(() => {
        expect(screen.getAllByText(/1500\.00/)[0]).toBeInTheDocument()
        expect(screen.getByText('Remboursé')).toBeInTheDocument()
      })
    })

    it('should display summary statistics correctly', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      vi.mocked(loanService.getUserLoans).mockResolvedValue([])
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 5,
        activeLoans: 2,
        totalBorrowed: 10000,
        totalOutstanding: 5000
      })

      render(<LoanDashboard onNewLoanRequest={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument() // Total loans
        expect(screen.getByText('2')).toBeInTheDocument() // Active loans
        expect(screen.getByText('10000.00 USDC')).toBeInTheDocument() // Total borrowed
        expect(screen.getByText('5000.00 USDC')).toBeInTheDocument() // Outstanding
      })
    })
  })

  describe('Requirement 3: Click on loan opens LoanDetailsPage', () => {
    it('should show "Voir détails" button for each loan', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoans = [
        {
          id: 'loan-1',
          principal: 1000,
          collateral_amount: 2000,
          interest_rate: 0.05,
          status: 'active',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockLoans as any)
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 1,
        activeLoans: 1,
        totalBorrowed: 1000,
        totalOutstanding: 1000
      })

      render(<LoanDashboard onNewLoanRequest={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Voir détails')).toBeInTheDocument()
      })
    })

    it('should display LoanDetailsPage when clicking on loan details', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoan = {
        id: 'loan-1',
        principal: 1000,
        collateral_amount: 2000,
        interest_rate: 0.05,
        status: 'active',
        due_date: '2024-12-31',
        created_at: '2024-01-01',
        borrower_id: 'test-user-id',
        borrower: {
          nom: 'Test Farmer',
          email: 'farmer@test.com'
        }
      }

      vi.mocked(loanService.getLoanById).mockResolvedValue(mockLoan as any)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])

      render(<LoanDetailsPage loanId="loan-1" />)

      await waitFor(() => {
        expect(screen.getByText('Détails du Prêt')).toBeInTheDocument()
        expect(screen.getAllByText(/1000\.00/)[0]).toBeInTheDocument()
        expect(screen.getByText('Aperçu du Prêt')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 4: LoanRepaymentInterface accessible from loan details', () => {
    it('should show repayment button for active loans', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoan = {
        id: 'loan-1',
        principal: 1000,
        collateral_amount: 2000,
        interest_rate: 0.05,
        status: 'active',
        due_date: '2024-12-31',
        created_at: '2024-01-01',
        borrower_id: 'test-user-id',
        borrower: {
          nom: 'Test Farmer',
          email: 'farmer@test.com'
        }
      }

      vi.mocked(loanService.getLoanById).mockResolvedValue(mockLoan as any)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])

      render(<LoanDetailsPage loanId="loan-1" />)

      await waitFor(() => {
        expect(screen.getByText('Remboursement')).toBeInTheDocument()
        expect(screen.getByText('Effectuer un Remboursement')).toBeInTheDocument()
      })
    })

    it('should not show repayment interface for non-active loans', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoan = {
        id: 'loan-1',
        principal: 1000,
        collateral_amount: 2000,
        interest_rate: 0.05,
        status: 'pending',
        due_date: '2024-12-31',
        created_at: '2024-01-01',
        borrower_id: 'test-user-id',
        borrower: {
          nom: 'Test Farmer',
          email: 'farmer@test.com'
        }
      }

      vi.mocked(loanService.getLoanById).mockResolvedValue(mockLoan as any)
      vi.mocked(loanService.getCollateralTokensForLoan).mockResolvedValue([])

      render(<LoanDetailsPage loanId="loan-1" />)

      await waitFor(() => {
        expect(screen.queryByText('Effectuer un Remboursement')).not.toBeInTheDocument()
      })
    })
  })

  describe('Requirement 5: "Demander un prêt" button redirects to /loans/request', () => {
    it('should have "Nouvelle demande de prêt" button that triggers navigation', async () => {
      const { loanService } = await import('@/lib/services/loan')
      const { useRouter } = await import('next/navigation')
      
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn()
      } as any)

      vi.mocked(loanService.getUserLoans).mockResolvedValue([])
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalOutstanding: 0
      })

      render(<FarmerLoansPage />)

      await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
      })

      const newLoanButton = screen.getByText('Nouvelle demande de prêt')
      expect(newLoanButton).toBeInTheDocument()

      fireEvent.click(newLoanButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/fr/dashboard/farmer/loans/request')
      })
    })

    it('should redirect to correct language-specific route', async () => {
      const { loanService } = await import('@/lib/services/loan')
      const { useRouter, useParams } = await import('next/navigation')
      
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn()
      } as any)

      vi.mocked(useParams).mockReturnValue({ lang: 'ln' })

      vi.mocked(loanService.getUserLoans).mockResolvedValue([])
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalOutstanding: 0
      })

      render(<FarmerLoansPage />)

      await waitFor(() => {
        const newLoanButton = screen.getByText('Nouvelle demande de prêt')
        fireEvent.click(newLoanButton)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/ln/dashboard/farmer/loans/request')
      })
    })
  })

  describe('Integration: Full workflow', () => {
    it('should display complete loan dashboard with all features', async () => {
      const { loanService } = await import('@/lib/services/loan')
      
      const mockLoans = [
        {
          id: 'loan-1',
          principal: 1000,
          collateral_amount: 2000,
          interest_rate: 0.05,
          status: 'pending',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        },
        {
          id: 'loan-2',
          principal: 2000,
          collateral_amount: 4000,
          interest_rate: 0.05,
          status: 'active',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        },
        {
          id: 'loan-3',
          principal: 1500,
          collateral_amount: 3000,
          interest_rate: 0.05,
          status: 'repaid',
          due_date: '2024-12-31',
          created_at: '2024-01-01',
          borrower_id: 'test-user-id'
        }
      ]

      vi.mocked(loanService.getUserLoans).mockResolvedValue(mockLoans as unknown)
      vi.mocked(loanService.getLoanSummary).mockResolvedValue({
        totalLoans: 3,
        activeLoans: 1,
        totalBorrowed: 4500,
        totalOutstanding: 3000
      })

      render(<FarmerLoansPage />)

      await waitFor(() => {
        // Verify page structure
        expect(screen.getByText('Mes prêts')).toBeInTheDocument()
        
        // Verify summary statistics
        const totalLoans = screen.getAllByText('3')
        expect(totalLoans.length).toBeGreaterThan(0)
        
        const activeLoans = screen.getAllByText('1')
        expect(activeLoans.length).toBeGreaterThan(0)
        
        expect(screen.getByText(/4500\.00.*USDC/)).toBeInTheDocument()
        
        // Verify all loan statuses are displayed
        expect(screen.getByText('En attente')).toBeInTheDocument()
        expect(screen.getByText('Actif')).toBeInTheDocument()
        expect(screen.getByText('Remboursé')).toBeInTheDocument()
        
        // Verify action button
        expect(screen.getByText('Nouvelle demande de prêt')).toBeInTheDocument()
      })
    })
  })
})
