import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  })
}))

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}))

describe('LenderService Integration', () => {
  it('should have all required methods', async () => {
    const { lenderService } = await import('../lender')
    
    // Check that all required methods exist
    expect(typeof lenderService.getAvailableLoanOpportunities).toBe('function')
    expect(typeof lenderService.getLenderPortfolio).toBe('function')
    expect(typeof lenderService.commitFundsToLoan).toBe('function')
    expect(typeof lenderService.distributeRepaymentToLender).toBe('function')
    expect(typeof lenderService.liquidateCollateralForLender).toBe('function')
    expect(typeof lenderService.getLenderDashboardStats).toBe('function')
  })

  it('should handle empty loan opportunities gracefully', async () => {
    const { lenderService } = await import('../lender')
    
    // This will return empty array if no loans are available
    const opportunities = await lenderService.getAvailableLoanOpportunities()
    expect(Array.isArray(opportunities)).toBe(true)
  })

  it('should handle portfolio request for non-existent lender', async () => {
    const { lenderService } = await import('../lender')
    
    // This should return default portfolio structure
    const portfolio = await lenderService.getLenderPortfolio('non-existent-lender')
    expect(portfolio).toHaveProperty('lenderId')
    expect(portfolio).toHaveProperty('availableFunds')
    expect(portfolio).toHaveProperty('activeInvestments')
    expect(portfolio).toHaveProperty('totalReturns')
    expect(portfolio).toHaveProperty('returnRate')
    expect(Array.isArray(portfolio.activeLoans)).toBe(true)
    expect(Array.isArray(portfolio.completedLoans)).toBe(true)
  })
})