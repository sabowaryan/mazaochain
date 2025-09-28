import { Tables, TablesInsert } from '@/lib/supabase/database.types'

// Database types for tokenization records
export type TokenizationRecord = Tables<'tokenization_records'>
export type TokenizationRecordInsert = TablesInsert<'tokenization_records'>

export interface TokenizationStatus {
  id: string
  evaluation_id: string
  token_id: string | null
  status: 'pending' | 'minting' | 'completed' | 'failed'
  transaction_ids: string[]
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface FarmerPortfolio {
  farmerId: string
  totalValue: number
  tokens: PortfolioToken[]
}

export interface PortfolioToken {
  tokenId: string
  symbol: string
  name: string
  balance: string
  decimals: number
  cropType: string
  estimatedValue: number
  currentValue: number
  harvestDate: number
  isActive: boolean
  evaluationId: string
}

export interface TokenizationRequest {
  evaluationId: string
  cropType: string
  farmerId: string
  farmerAccountId: string
  estimatedValue: number
  harvestDate: number
}

export interface TokenizationResult {
  success: boolean
  tokenId?: string
  transactionIds?: string[]
  error?: string
}

// Token metadata for display purposes
export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image?: string
  properties: {
    cropType: string
    farmerId: string
    harvestDate: number
    estimatedValue: number
    region?: string
  }
}

// Portfolio summary for dashboard
export interface PortfolioSummary {
  totalTokens: number
  totalValue: number
  activeTokens: number
  pendingTokenizations: number
  completedTokenizations: number
  failedTokenizations: number
}