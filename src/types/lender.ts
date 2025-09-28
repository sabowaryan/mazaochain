import { Tables } from '@/lib/supabase/database.types'

// Database types for lender profiles
export type LenderProfile = Tables<'lender_profiles'>

export interface LoanOpportunity {
  loanId: string
  farmerName: string
  farmerId: string
  cropType: string
  region: string
  requestedAmount: number
  collateralValue: number
  collateralRatio: number
  interestRate: number
  termMonths: number
  expectedReturn: number
  harvestDate: string
  farmSize: number
  farmingExperience: number
  riskAssessment: RiskAssessment
  cooperativeApproved: boolean
  createdAt: string
}

export interface RiskAssessment {
  farmerCreditScore: number
  cropHistoricalYield: number
  marketPriceVolatility: number
  collateralizationRatio: number
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors: string[]
}

export interface LenderPortfolio {
  lenderId: string
  institutionName: string
  availableFunds: number
  activeInvestments: number
  totalInvested: number
  totalReturns: number
  returnRate: number
  activeLoans: LenderLoan[]
  completedLoans: LenderLoan[]
}

export interface LenderLoan {
  loanId: string
  farmerName: string
  cropType: string
  principalAmount: number
  interestRate: number
  termMonths: number
  startDate: string
  dueDate: string
  status: 'active' | 'repaid' | 'defaulted'
  amountRepaid: number
  remainingBalance: number
  expectedReturn: number
  actualReturn?: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface FundCommitment {
  loanId: string
  lenderId: string
  amount: number
  escrowTransactionId?: string
  status: 'pending' | 'escrowed' | 'disbursed' | 'cancelled'
  createdAt: string
}

export interface LenderInvestmentSummary {
  totalOpportunities: number
  totalInvestmentAmount: number
  averageInterestRate: number
  averageRiskLevel: string
  expectedMonthlyReturn: number
  portfolioDiversification: {
    cropTypes: { [key: string]: number }
    regions: { [key: string]: number }
    riskLevels: { [key: string]: number }
  }
}

export interface InterestDistribution {
  loanId: string
  lenderId: string
  principalAmount: number
  interestAmount: number
  distributionDate: string
  transactionId: string
  status: 'pending' | 'completed' | 'failed'
}

export interface CollateralLiquidation {
  loanId: string
  lenderId: string
  collateralTokenId: string
  liquidationAmount: number
  marketPrice: number
  liquidationDate: string
  transactionId: string
  recoveryRate: number
}

export interface LenderDashboardStats {
  totalPortfolioValue: number
  monthlyIncome: number
  averageROI: number
  activeInvestments: number
  pendingOpportunities: number
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  performanceMetrics: {
    onTimeRepaymentRate: number
    defaultRate: number
    averageLoanTerm: number
  }
}

// Investment criteria for lenders
export interface InvestmentCriteria {
  minLoanAmount: number
  maxLoanAmount: number
  preferredCropTypes: string[]
  maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  minCollateralRatio: number
  preferredRegions: string[]
  maxLoanTerm: number
  minFarmerCreditScore: number
}

// Automated distribution settings
export interface AutoDistributionSettings {
  lenderId: string
  enableAutomaticReinvestment: boolean
  reinvestmentPercentage: number
  enableInterestCompounding: boolean
  distributionFrequency: 'monthly' | 'quarterly' | 'annually'
  minimumDistributionAmount: number
}