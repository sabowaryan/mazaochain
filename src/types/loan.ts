import { Tables, TablesInsert } from '@/lib/supabase/database.types'

// Database types for loans
export type Loan = Tables<'loans'>
export type LoanInsert = TablesInsert<'loans'>

export interface LoanRequest {
  borrowerId: string
  requestedAmount: number
  purpose: string
  repaymentPeriodMonths: number
  collateralTokenIds: string[]
}

export interface LoanEligibility {
  isEligible: boolean
  maxLoanAmount: number
  availableCollateral: number
  collateralRatio: number
  requiredCollateral: number
  reasons?: string[]
}

export interface CollateralToken {
  tokenId: string
  symbol: string
  name: string
  currentValue: number
  cropType: string
  harvestDate: number
  isActive: boolean
  evaluationId: string
}

export interface LoanDetails extends Loan {
  borrower?: {
    id: string
    nom: string
    email: string
  }
  lender?: {
    id: string
    institution_name: string
  }
  collateralTokens?: CollateralToken[]
  repaymentSchedule?: RepaymentSchedule[]
}

export interface RepaymentSchedule {
  id: string
  loanId: string
  installmentNumber: number
  dueDate: string
  principalAmount: number
  interestAmount: number
  totalAmount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
  paidAmount?: number
}

export interface LoanSummary {
  totalLoans: number
  activeLoans: number
  totalBorrowed: number
  totalRepaid: number
  totalOutstanding: number
  overdueLoans: number
}

export interface LoanApprovalRequest {
  loanId: string
  cooperativeId: string
  approved: boolean
  comments?: string
  lenderId?: string
}

export interface LoanDisbursement {
  loanId: string
  amount: number
  recipientAddress: string
  transactionId?: string
}

export interface LoanRepayment {
  loanId: string
  amount: number
  paymentType: 'partial' | 'full'
  transactionId?: string
}

// Loan status enum
export type LoanStatus = 'pending' | 'approved' | 'active' | 'repaid' | 'defaulted' | 'rejected'

// Interest rate calculation
export interface InterestCalculation {
  principal: number
  annualRate: number
  termMonths: number
  monthlyPayment: number
  totalInterest: number
  totalAmount: number
}