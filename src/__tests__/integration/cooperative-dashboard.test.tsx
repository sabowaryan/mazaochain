/**
 * Integration Test: Cooperative Dashboard Main Page
 * 
 * Tests for task 13.1: Vérifier l'intégration complète du dashboard principal coopérative
 * 
 * Requirements tested:
 * - 7.1: Dashboard displays counters (farmers, evaluations, pending loans)
 * - 7.2: Data is loaded via useEffect
 * - Statistics cards are clickable and redirect to detailed pages
 * - Components PendingFarmersValidation, PendingEvaluationsReview, LoanApprovalList are integrated
 * - Loading spinner is displayed during initial load
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CooperativeDashboard from '@/app/[lang]/dashboard/cooperative/page'

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'coop-123', email: 'coop@test.com' },
    profile: {
      role: 'cooperative',
      cooperative_profiles: { nom: 'Test Cooperative' }
    },
    loading: false
  }))
}))

// Mock the wallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    isConnected: true,
    accountId: '0.0.123456',
    connect: vi.fn(),
    disconnect: vi.fn()
  }))
}))

// Mock the contracts hook
vi.mock('@/hooks/useMazaoContracts', () => ({
  useMazaoContracts: vi.fn(() => ({
    loading: false,
    tokenizeEvaluation: vi.fn()
  }))
}))

// Mock the translation provider
vi.mock('@/components/TranslationProvider', () => ({
  useTranslations: vi.fn(() => (key: string) => key)
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Cooperative Dashboard - Task 13.1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default fetch responses
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/crop-evaluations')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            {
              id: 'eval-1',
              farmer_id: 'farmer-1',
              crop_type: 'manioc',
              superficie: 2,
              valeur_estimee: 1000,
              status: 'pending',
              created_at: new Date().toISOString(),
              farmer_profiles: { nom: 'Jean Mukendi' }
            },
            {
              id: 'eval-2',
              farmer_id: 'farmer-2',
              crop_type: 'mais',
              superficie: 3,
              valeur_estimee: 1500,
              status: 'pending',
              created_at: new Date().toISOString(),
              farmer_profiles: { nom: 'Marie Kabila' }
            }
          ])
        })
      }
      
      if (url.includes('/api/loans')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            {
              id: 'loan-1',
              borrower_id: 'farmer-1',
              principal: 500,
              collateral_amount: 1000,
              status: 'pending',
              created_at: new Date().toISOString(),
              profiles: {
                farmer_profiles: { nom: 'Jean Mukendi' }
              }
            }
          ])
        })
      }
      
      if (url.includes('/api/farmers')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { id: 'farmer-1', nom: 'Jean Mukendi' },
            { id: 'farmer-2', nom: 'Marie Kabila' },
            { id: 'farmer-3', nom: 'Paul Tshisekedi' }
          ])
        })
      }
      
      return Promise.resolve({ json: () => Promise.resolve([]) })
    })
  })

  it('should display loading spinner initially', () => {
    render(<CooperativeDashboard />)
    
    // Should show loading spinner while data is being fetched
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('should load and display statistics counters correctly', async () => {
    render(<CooperativeDashboard />)
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Verify counters are displayed
    expect(screen.getByText('Membres actifs')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // 3 farmers
    
    expect(screen.getByText('Évaluations en attente')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // 2 pending evaluations
    
    expect(screen.getByText('Prêts en attente')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // 1 pending loan
    
    expect(screen.getByText('Valeur gérée')).toBeInTheDocument()
  })

  it('should call API endpoints with correct parameters', async () => {
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/crop-evaluations?status=pending&cooperative_id=coop-123')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/loans?status=pending&cooperative_id=coop-123')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/farmers?cooperative_id=coop-123')
      )
    })
  })

  it('should display tab navigation', async () => {
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Verify all tabs are present
    expect(screen.getByRole('button', { name: /Vue d'ensemble/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Évaluations/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Prêts/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Membres/i })).toBeInTheDocument()
  })

  it('should switch between tabs when clicked', async () => {
    const user = userEvent.setup()
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Click on Evaluations tab
    const evaluationsTab = screen.getByRole('button', { name: /Évaluations/i })
    await user.click(evaluationsTab)
    
    // Should show evaluations content
    await waitFor(() => {
      expect(screen.getByText('Évaluations en attente de validation')).toBeInTheDocument()
    })
    
    // Click on Loans tab
    const loansTab = screen.getByRole('button', { name: /Prêts/i })
    await user.click(loansTab)
    
    // Should show loans content
    await waitFor(() => {
      expect(screen.getByText('Demandes de prêt en attente')).toBeInTheDocument()
    })
  })

  it('should display urgent actions when there are pending items', async () => {
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Should show urgent actions
    expect(screen.getByText(/2 évaluation\(s\) en attente de validation/i)).toBeInTheDocument()
    expect(screen.getByText(/1 demande\(s\) de prêt en attente/i)).toBeInTheDocument()
  })

  it('should navigate to evaluations tab when clicking urgent action button', async () => {
    const user = userEvent.setup()
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Find and click the "Examiner maintenant" button for evaluations
    const examineButtons = screen.getAllByText('Examiner maintenant')
    await user.click(examineButtons[0])
    
    // Should switch to evaluations tab
    await waitFor(() => {
      expect(screen.getByText('Évaluations en attente de validation')).toBeInTheDocument()
    })
  })

  it('should integrate PendingEvaluationsReview component in evaluations tab', async () => {
    const user = userEvent.setup()
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Switch to evaluations tab
    const evaluationsTab = screen.getByRole('button', { name: /Évaluations/i })
    await user.click(evaluationsTab)
    
    // Verify PendingEvaluationsReview is rendered
    await waitFor(() => {
      expect(screen.getByText('Évaluations en attente de validation')).toBeInTheDocument()
    })
  })

  it('should integrate LoanApprovalList component in loans tab', async () => {
    const user = userEvent.setup()
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Switch to loans tab
    const loansTab = screen.getByRole('button', { name: /Prêts/i })
    await user.click(loansTab)
    
    // Verify LoanApprovalList is rendered
    await waitFor(() => {
      expect(screen.getByText('Demandes de prêt en attente')).toBeInTheDocument()
    })
  })

  it('should display wallet connection prompt when not connected', async () => {
    // Mock wallet as disconnected
    vi.mocked(require('@/hooks/useWallet').useWallet).mockReturnValue({
      isConnected: false,
      accountId: null,
      connect: vi.fn(),
      disconnect: vi.fn()
    })
    
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Should show wallet connection component
    expect(screen.getByText(/WalletConnection/i)).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return error
    ;(global.fetch as any).mockImplementation(() => 
      Promise.reject(new Error('Network error'))
    )
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    // Should still render the page with zero counts
    expect(screen.getByText('Membres actifs')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('should display cooperative name in header', async () => {
    render(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('Tableau de bord - Coopérative')).toBeInTheDocument()
    expect(screen.getByText(/Bienvenue, Test Cooperative/i)).toBeInTheDocument()
  })

  it('should require cooperative role to access', () => {
    // Mock auth with non-cooperative user
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'user@test.com' },
      profile: { role: 'agriculteur' },
      loading: false
    })
    
    render(<CooperativeDashboard />)
    
    // Should show access denied or redirect
    // This depends on the RequireAuth component implementation
    expect(screen.queryByText('Tableau de bord - Coopérative')).not.toBeInTheDocument()
  })
})
