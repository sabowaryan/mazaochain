// Core type definitions for MazaoChain MVP

export enum UserRole {
  AGRICULTEUR = 'agriculteur',
  COOPERATIVE = 'cooperative',
  PRETEUR = 'preteur'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  profile: FarmerProfile | CooperativeProfile | LenderProfile;
  isValidated: boolean;
  createdAt: Date;
}

export interface FarmerProfile {
  userId: string;
  nom: string;
  superficie: number;
  culturesHistoriques: CropHistory[];
  localisation: string;
  cooperativeId: string;
  isValidated: boolean;
}

export interface CooperativeProfile {
  userId: string;
  nom: string;
  region: string;
  membersCount: number;
  validatedFarmers: string[];
}

export interface LenderProfile {
  userId: string;
  institutionName: string;
  availableFunds: number;
  investmentCriteria: InvestmentCriteria;
  activeLoans: string[];
}

export interface CropHistory {
  year: number;
  cropType: 'manioc' | 'cafe';
  superficie: number;
  rendement: number;
  valeur: number;
}

export interface InvestmentCriteria {
  minLoanAmount: number;
  maxLoanAmount: number;
  preferredCropTypes: string[];
  maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CropEvaluation {
  id: string;
  farmerId: string;
  cropType: 'manioc' | 'cafe';
  superficie: number;
  rendementHistorique: number;
  prixReference: number;
  valeurEstimee: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: 'mint' | 'burn' | 'loan' | 'repayment';
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType: 'MAZAO' | 'USDC';
  hederaTransactionId: string;
  timestamp: Date;
}

// Export wallet types
export * from './wallet';