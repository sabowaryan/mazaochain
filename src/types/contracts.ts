/**
 * TypeScript interfaces for MazaoChain smart contracts
 */

export interface CropData {
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
  isActive: boolean;
  totalSupply: number;
  createdAt: number;
}

export interface Loan {
  borrower: string;
  lender: string;
  principal: number;
  collateralAmount: number;
  collateralTokenId: number;
  interestRate: number;
  dueDate: number;
  outstandingBalance: number;
  status: LoanStatus;
  createdAt: number;
  approvedAt: number;
}

export interface CollateralInfo {
  tokenId: number;
  amount: number;
  value: number;
  isLocked: boolean;
}

export enum LoanStatus {
  PENDING = 0,
  ACTIVE = 1,
  REPAID = 2,
  DEFAULTED = 3,
  LIQUIDATED = 4
}

export interface ContractAddresses {
  MazaoTokenFactory: string;
  LoanManager: string;
}

export interface DeploymentInfo {
  network: string;
  timestamp: string;
  contracts: ContractAddresses;
}

// Contract function parameters for Hedera SDK
export interface CreateCropTokenParams {
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
}

export interface MintTokensParams {
  tokenId: number;
  amount: number;
}

export interface CreateLoanParams {
  loanAmount: number;
  collateralTokenId: number;
  collateralAmount: number;
  interestRate: number;
  loanDuration: number;
}

export interface ContractCallResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  data?: any;
}

// Event interfaces for contract events
export interface CropTokenCreatedEvent {
  tokenId: number;
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
}

export interface TokensMintedEvent {
  farmer: string;
  amount: number;
  tokenId: number;
}

export interface LoanCreatedEvent {
  loanId: number;
  borrower: string;
  lender: string;
  principal: number;
  collateralAmount: number;
  interestRate: number;
  dueDate: number;
}

export interface LoanApprovedEvent {
  loanId: number;
  lender: string;
}

export interface LoanRepaidEvent {
  loanId: number;
  amount: number;
  remainingBalance: number;
}

export interface CollateralLiquidatedEvent {
  loanId: number;
  collateralAmount: number;
  liquidationValue: number;
}

// Contract interaction utilities
export interface ContractConfig {
  COLLATERAL_RATIO: number;
  BASIS_POINTS: number;
  MIN_INTEREST_RATE: number;
  MAX_INTEREST_RATE: number;
  MIN_LOAN_DURATION: number;
  MAX_LOAN_DURATION: number;
}

export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  COLLATERAL_RATIO: 200,
  BASIS_POINTS: 10000,
  MIN_INTEREST_RATE: 10,
  MAX_INTEREST_RATE: 5000,
  MIN_LOAN_DURATION: 24 * 60 * 60,
  MAX_LOAN_DURATION: 2 * 365 * 24 * 60 * 60
};