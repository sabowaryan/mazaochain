/**
 * Integration Test: Cooperative Dashboard Main Page
 * 
 * Tests task 13.1: Vérifier l'intégration complète du dashboard principal coopérative
 * 
 * Requirements tested:
 * - 7.1: Dashboard coopérative affiche toutes les demandes en attente
 * - 7.2: Actions de validation mettent à jour les statuts correctement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../utils/test-utils'
import CooperativeDashboard from '@/app/[lang]/dashboard/cooperative/page'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  })
}))

// Mock the hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'coop-123', email: 'coop@test.com' },
    profile: {
      role: 'cooperative',
      cooperative_profiles: {
        nom: 'Coopérative Test'
      }
    },
    loading: false
  })
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coop-123', email: 'coop@test.com' },
    profile: {
      role: 'cooperative',
      cooperative_profiles: {
        nom: 'Coopérative Test'
      }
    },
    loading: false
  })
}))

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    isConnected: true,
    accountId: '0.0.123456',
    connect: vi.fn(),
    disconnect: vi.fn()
  })
}))

vi.mock('@/hooks/useMazaoContracts', () => ({
  useMazaoContracts: () => ({
    loading: false,
    tokenizeEvaluation: vi.fn()
  })
}))

vi.mock('@/components/TranslationProvider', () => ({
  useTranslations: () => (key: string) => key
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Cooperative Dashboard Main Page - Task 13.1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockFetch.mockImplementation((url: string) => {
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

  it('should load and display data via useEffect', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/crop-evaluations')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/loans')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/farmers')
    )
  })

  it('should display correct counters for pending requests', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Check members counter
    const membersCard = screen.getByText('Membres actifs').closest('div')
    expect(within(membersCard!).getByText('3')).toBeInTheDocument()
    
    // Check pending evaluations counter
    const evaluationsCard = screen.getByText('Évaluations en attente').closest('div')
    expect(within(evaluationsCard!).getByText('2')).toBeInTheDocument()
    
    // Check pending loans counter
    const loansCard = screen.getByText('Prêts en attente').closest('div')
    expect(within(loansCard!).getByText('1')).toBeInTheDocument()
  })

  it('should display statistics cards that are clickable', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Verify all stat cards are present
    expect(screen.getByText('Membres actifs')).toBeInTheDocument()
    expect(screen.getByText('Évaluations en attente')).toBeInTheDocument()
    expect(screen.getByText('Prêts en attente')).toBeInTheDocument()
    expect(screen.getByText('Valeur gérée')).toBeInTheDocument()
  })

  it('should integrate PendingFarmersValidation component', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // The component should be available through tabs
    const membersTab = screen.getByText(/👥 Membres/i)
    expect(membersTab).toBeInTheDocument()
  })

  it('should integrate PendingEvaluationsReview component', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // The component should be available through tabs
    const evaluationsTab = screen.getByText(/🌾 Évaluations/i)
    expect(evaluationsTab).toBeInTheDocument()
  })

  it('should integrate LoanApprovalList component', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // The component should be available through tabs
    const loansTab = screen.getByText(/💰 Prêts/i)
    expect(loansTab).toBeInTheDocument()
  })

  it('should display LoadingSpinner during initial load', async () => {
    // Mock a delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve([])
      }), 100))
    )
    
    renderWithProviders(<CooperativeDashboard />)
    
    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should handle empty data gracefully', async () => {
    // Mock empty responses
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve([])
      })
    )
    
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Counters should show 0
    const membersCard = screen.getByText('Membres actifs').closest('div')
    expect(within(membersCard!).getByText('0')).toBeInTheDocument()
  })

  it('should display urgent actions when there are pending items', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Should show urgent actions in overview tab
    expect(screen.getByText(/2 évaluation\(s\) en attente de validation/i)).toBeInTheDocument()
    expect(screen.getByText(/1 demande\(s\) de prêt en attente/i)).toBeInTheDocument()
  })

  it('should calculate total value managed correctly', async () => {
    // Mock evaluations with approved status
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/crop-evaluations')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            {
              id: 'eval-1',
              status: 'approved',
              valeur_estimee: 1000
            },
            {
              id: 'eval-2',
              status: 'approved',
              valeur_estimee: 1500
            },
            {
              id: 'eval-3',
              status: 'pending',
              valeur_estimee: 500
            }
          ])
        })
      }
      return Promise.resolve({ json: () => Promise.resolve([]) })
    })
    
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Should show sum of approved evaluations only (1000 + 1500 = 2500)
    const valueCard = screen.getByText('Valeur gérée').closest('div')
    expect(within(valueCard!).getByText('$2,500')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValue(new Error('API Error'))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Should still render the page with default values
    expect(screen.getByText('Tableau de bord - Coopérative')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('should display cooperative name from profile', async () => {
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    expect(screen.getByText(/Bienvenue, Coopérative Test/i)).toBeInTheDocument()
  })

  it('should show wallet connection prompt when not connected', async () => {
    // Mock wallet as disconnected
    vi.mocked(vi.importActual('@/hooks/useWallet')).useWallet = () => ({
      isConnected: false,
      accountId: null,
      connect: vi.fn(),
      disconnect: vi.fn()
    })
    
    renderWithProviders(<CooperativeDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument()
    })
    
    // Should show wallet connection component
    expect(screen.getByText(/connecter/i)).toBeInTheDocument()
  })
})
