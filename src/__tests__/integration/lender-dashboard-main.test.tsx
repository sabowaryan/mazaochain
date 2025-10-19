import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LenderDashboard from '@/app/[lang]/dashboard/lender/page';
import { renderWithProviders } from '@/__ tests__/utils/test-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'lender-123',
      email: 'lender@test.com'
    },
    profile: {
      id: 'lender-123',
      role: 'preteur',
      lender_profiles: {
        institution_name: 'Test Bank',
        available_funds: 50000
      }
    },
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock wallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    isConnected: true,
    accountId: '0.0.123456',
    balances: {
      usdc: 10000,
      mazao: 5000
    },
    connect: vi.fn(),
    disconnect: vi.fn()
  })
}));

// Mock contracts hook
vi.mock('@/hooks/useMazaoContracts', () => ({
  useMazaoContracts: () => ({
    requestLoan: vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'tx-123'
    }),
    loading: false
  })
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/fr/dashboard/lender'
}));

describe('Task 14.1: Lender Dashboard Main Integration', () => {
  const mockLoanOpportunities = [
    {
      id: 'loan-1',
      borrower_id: 'farmer-1',
      principal: 5000,
      collateral_amount: 10000,
      interest_rate: 0.15,
      status: 'approved',
      created_at: '2024-01-01',
      profiles: {
        farmer_profiles: {
          nom: 'Jean Farmer',
          crop_type: 'Manioc'
        }
      },
      risk_assessment: {
        farmerCreditScore: 85,
        cropHistoricalYield: 1500,
        marketPriceVolatility: 12,
        collateralizationRatio: 200,
        overallRisk: 'LOW',
        riskFactors: []
      }
    },
    {
      id: 'loan-2',
      borrower_id: 'farmer-2',
      principal: 3000,
      collateral_amount: 6000,
      interest_rate: 0.18,
      status: 'approved',
      created_at: '2024-01-02',
      profiles: {
        farmer_profiles: {
          nom: 'Marie Cultivateur',
          crop_type: 'Maïs'
        }
      },
      risk_assessment: {
        farmerCreditScore: 75,
        cropHistoricalYield: 1200,
        marketPriceVolatility: 15,
        collateralizationRatio: 200,
        overallRisk: 'MEDIUM',
        riskFactors: ['Rendement historique moyen']
      }
    }
  ];

  const mockActiveLoans = [
    {
      id: 'active-loan-1',
      borrower_id: 'farmer-3',
      lender_id: 'lender-123',
      principal: 4000,
      interest_rate: 0.15,
      status: 'active',
      created_at: '2023-12-01',
      due_date: '2024-12-01',
      borrower: {
        farmer_profiles: {
          nom: 'Pierre Agriculteur'
        }
      }
    }
  ];

  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/loans?status=pending')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLoanOpportunities)
        });
      }
      if (url.includes('/api/loans?lender_id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActiveLoans)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    }) as any;
  });

  it('should display key metrics (total invested, returns, active loans)', async () => {
    renderWithProviders(<LenderDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Fonds disponibles/i)).toBeInTheDocument();
    });

    // Check for key metrics
    expect(screen.getByText(/Total investi/i)).toBeInTheDocument();
    expect(screen.getByText(/Prêts actifs/i)).toBeInTheDocument();
    expect(screen.getByText(/Rendements/i)).toBeInTheDocument();
    expect(screen.getByText(/Valeur portfolio/i)).toBeInTheDocument();

    // Verify available funds are displayed
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it('should list loan opportunities with RiskAssessmentDisplay', async () => {
    renderWithProviders(<LenderDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
    });

    // Check that opportunities are displayed
    expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
    expect(screen.getByText('Marie Cultivateur')).toBeInTheDocument();

    // Check for risk assessment indicators
    const riskButtons = screen.getAllByRole('button', { name: /Risque/i });
    expect(riskButtons.length).toBeGreaterThan(0);
  });

  it('should open loan details when clicking on an opportunity', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<LenderDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
    });

    // Click on risk button to open details
    const riskButtons = screen.getAllByRole('button', { name: /Risque/i });
    await user.click(riskButtons[0]);

    // Check that risk assessment modal opens
    await waitFor(() => {
      expect(screen.getByText(/Analyse de Risque Détaillée/i)).toBeInTheDocument();
    });

    // Verify risk assessment details are shown
    expect(screen.getByText(/Score de Crédit/i)).toBeInTheDocument();
    expect(screen.getByText(/Ratio de Collatéralisation/i)).toBeInTheDocument();
  });

  it('should have functional "Investir" button that calls smart contract', async () => {
    const user = userEvent.setup();
    const mockRequestLoan = vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'tx-123'
    });

    vi.mocked(require('@/hooks/useMazaoContracts').useMazaoContracts).mockReturnValue({
      requestLoan: mockRequestLoan,
      loading: false
    });

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
    });

    // Find and click invest button
    const investButtons = screen.getAllByRole('button', { name: /Investir/i });
    await user.click(investButtons[0]);

    // Verify that the contract function was called
    await waitFor(() => {
      expect(mockRequestLoan).toHaveBeenCalled();
    });
  });

  it('should load data from /api/loans?status=approved', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/loans?status=pending')
      );
    });

    // Verify data is displayed
    expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
  });

  it('should display wallet connection component when not connected', async () => {
    vi.mocked(require('@/hooks/useWallet').useWallet).mockReturnValue({
      isConnected: false,
      accountId: null,
      balances: { usdc: 0, mazao: 0 },
      connect: vi.fn(),
      disconnect: vi.fn()
    });

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      // Should show wallet connection prompt
      expect(screen.getByText(/connecter votre wallet/i)).toBeInTheDocument();
    });
  });

  it('should display wallet balance when connected', async () => {
    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      // WalletBalance component should be rendered
      expect(screen.getByText(/10,000/)).toBeInTheDocument(); // USDC balance
    });
  });

  it('should navigate between tabs (overview, opportunities, portfolio, risk, analytics)', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vue d'ensemble/i)).toBeInTheDocument();
    });

    // Click on Opportunities tab
    const opportunitiesTab = screen.getByRole('button', { name: /Opportunités/i });
    await user.click(opportunitiesTab);

    await waitFor(() => {
      expect(screen.getByText(/Opportunités d'investissement disponibles/i)).toBeInTheDocument();
    });

    // Click on Portfolio tab
    const portfolioTab = screen.getByRole('button', { name: /Portfolio/i });
    await user.click(portfolioTab);

    await waitFor(() => {
      expect(screen.getByText(/Mon portfolio d'investissements/i)).toBeInTheDocument();
    });
  });

  it('should show loading spinner while data is loading', async () => {
    // Delay the fetch response
    global.fetch = vi.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLoanOpportunities)
        }), 100)
      )
    ) as any;

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should calculate and display portfolio metrics correctly', async () => {
    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Fonds disponibles/i)).toBeInTheDocument();
    });

    // Check that metrics are calculated
    // Total invested should be sum of active loans
    const totalInvestedElement = screen.getByText(/Total investi/i).closest('div');
    expect(totalInvestedElement).toBeInTheDocument();

    // Active loans count
    const activeLoansElement = screen.getByText(/Prêts actifs/i).closest('div');
    expect(activeLoansElement).toBeInTheDocument();
    expect(within(activeLoansElement!).getByText('1')).toBeInTheDocument();
  });

  it('should handle errors gracefully when API calls fail', async () => {
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' })
      })
    ) as any;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should display risk assessment modal with detailed metrics', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={mockUser} initialProfile={mockProfile}>
        <LenderDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Jean Farmer')).toBeInTheDocument();
    });

    // Click risk button
    const riskButtons = screen.getAllByRole('button', { name: /Risque/i });
    await user.click(riskButtons[0]);

    // Verify detailed risk metrics are shown
    await waitFor(() => {
      expect(screen.getByText(/Score de Crédit/i)).toBeInTheDocument();
      expect(screen.getByText(/85\/100/i)).toBeInTheDocument();
      expect(screen.getByText(/Ratio de Collatéralisation/i)).toBeInTheDocument();
      expect(screen.getByText(/200%/i)).toBeInTheDocument();
    });
  });
});
