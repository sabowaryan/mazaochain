/**
 * Integration test for Loan Request Page
 * Task 9.1: Verify complete integration of loan request form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoanRequestPage from '@/app/[lang]/dashboard/farmer/loans/request/page'

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-farmer-id', email: 'farmer@test.com' },
    role: 'agriculteur'
  }))
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn()
  })),
  useParams: vi.fn(() => ({
    lang: 'fr'
  }))
}))

vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    isConnected: true,
    balances: {
      hbar: 100,
      usdc: 500,
      mazao: 1000,
      tokens: [
        {
          tokenId: '0.0.123456',
          symbol: 'MAZAO',
          name: 'Mazao Token',
          balance: 1000,
          decimals: 2
        },
        {
          tokenId: '0.0.789012',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 500,
          decimals: 6
        }
      ]
    },
    connection: {
      accountId: '0.0.12345',
      network: 'testnet'
    },
    isConnecting: false,
    isLoadingBalances: false,
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    refreshBalances: vi.fn(),
    error: null,
    clearError: vi.fn()
  }))
}))

vi.mock('@/lib/services/loan', () => ({
  loanService: {
    checkLoanEligibility: vi.fn(() => Promise.resolve({
      isEligible: true,
      maxLoanAmount: 500,
      availableCollateral: 1000,
      collateralRatio: 2,
      requiredCollateral: 200
    })),
    createLoanRequest: vi.fn(() => Promise.resolve({
      success: true,
      loanId: 'test-loan-id'
    }))
  }
}))

vi.mock('@/lib/services/tokenization', () => ({
  tokenizationService: {
    getFarmerPortfolio: vi.fn(() => Promise.resolve({
      totalValue: 1000,
      tokens: [
        {
          tokenId: 'token-1',
          symbol: 'MAZAO',
          name: 'Mazao Token',
          currentValue: 1000,
          cropType: 'manioc',
          harvestDate: new Date().toISOString(),
          isActive: true,
          evaluationId: 'eval-1'
        }
      ]
    }))
  }
}))

describe('Loan Request Page Integration - Task 9.1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render LoanRequestForm component', async () => {
    render(<LoanRequestPage />)
    
    await waitFor(() => {
      // Use a more specific selector - check for the main heading
      expect(screen.getByRole('heading', { name: /Demande de prêt/i, level: 1 })).toBeInTheDocument()
      // Also verify the form card title is present
      expect(screen.getByRole('heading', { name: /Votre Collatéral Disponible/i })).toBeInTheDocument()
    })
  })

  it('should display WalletBalance component when wallet is connected', async () => {
    render(<LoanRequestPage />)
    
    await waitFor(() => {
      // WalletBalance component should be rendered
      expect(screen.getByText(/Votre Collatéral Disponible/i)).toBeInTheDocument()
    })
  })

  it('should show wallet connection prompt when wallet is not connected', async () => {
    const { useWallet } = await import('@/hooks/useWallet')
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      balances: null,
      connection: null,
      isConnecting: false,
      isLoadingBalances: false,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      refreshBalances: vi.fn(),
      error: null,
      clearError: vi.fn()
    })

    render(<LoanRequestPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Connexion wallet requise/i)).toBeInTheDocument()
    })
  })

  it('should retrieve token balances via useWallet hook', async () => {
    const { useWallet } = await import('@/hooks/useWallet')
    const mockUseWallet = vi.mocked(useWallet)
    
    render(<LoanRequestPage />)
    
    await waitFor(() => {
      expect(mockUseWallet).toHaveBeenCalled()
    })
  })

  it('should call loan API with correct data on form submission', async () => {
    const { loanService } = await import('@/lib/services/loan')
    const mockCreateLoanRequest = vi.mocked(loanService.createLoanRequest)
    
    render(<LoanRequestPage />)
    
    // Wait for form to load - use a more specific selector
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Demande de prêt/i, level: 1 })).toBeInTheDocument()
    })

    // Fill in the form
    const amountInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(amountInput, { target: { value: '100' } })

    // Wait for eligibility check to complete
    await waitFor(() => {
      expect(screen.getByText(/Éligible/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const purposeTextarea = screen.getByPlaceholderText(/Décrivez l'utilisation/i)
    fireEvent.change(purposeTextarea, { target: { value: 'Achat de semences' } })

    // Wait for submit button to be enabled
    const submitButton = screen.getByRole('button', { name: /Soumettre la demande/i })
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    // Submit the form
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateLoanRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          borrowerId: 'test-farmer-id',
          requestedAmount: 100,
          purpose: 'Achat de semences'
        })
      )
    }, { timeout: 3000 })
  })

  it('should redirect to /loans page after successful submission', async () => {
    const { useRouter } = await import('next/navigation')
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn()
    } as unknown)

    render(<LoanRequestPage />)
    
    // Wait for form to load - use a more specific selector
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Demande de prêt/i, level: 1 })).toBeInTheDocument()
    })

    // Fill and submit form
    const amountInput = screen.getByPlaceholderText('0.00')
    fireEvent.change(amountInput, { target: { value: '100' } })

    // Wait for eligibility check to complete
    await waitFor(() => {
      expect(screen.getByText(/Éligible/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const purposeTextarea = screen.getByPlaceholderText(/Décrivez l'utilisation/i)
    fireEvent.change(purposeTextarea, { target: { value: 'Achat de semences' } })

    // Wait for submit button to be enabled
    const submitButton = screen.getByRole('button', { name: /Soumettre la demande/i })
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    // Submit the form
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fr/dashboard/farmer/loans')
    }, { timeout: 3000 })
  })

  it('should display loan conditions information', async () => {
    render(<LoanRequestPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Conditions du prêt/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Collatéral requis: 200%/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Décaissement automatique/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Libération du collatéral/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Approbation coopérative/i })).toBeInTheDocument()
    })
  })
})
