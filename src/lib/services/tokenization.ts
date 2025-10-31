import { createClient } from '@/lib/supabase/client'
// import { hederaTokenService } from './hedera-token' // Converti en importation dynamique conditionnelle
// import { CropEvaluationService } from './crop-evaluation' // Removed to avoid circular dependency
import type { 
  TokenizationRequest, 
  TokenizationResult, 
  FarmerPortfolio, 
  PortfolioToken,
  PortfolioSummary 
} from '@/types/tokenization'
import type { Tables } from '@/lib/supabase/database.types'

export class TokenizationService {
  private supabase = createClient()
  // private cropEvaluationService = new CropEvaluationService() // Removed to avoid circular dependency

  /**
   * Start tokenization process for an approved evaluation
   */
  async tokenizeEvaluation(request: TokenizationRequest): Promise<TokenizationResult> {
    try {
      console.log(`Starting tokenization for evaluation ${request.evaluationId}`)

      // Create tokenization record
      const { data: tokenizationRecord, error: recordError } = await this.supabase
        .from('tokenization_records')
        .insert({
          evaluation_id: request.evaluationId,
          status: 'pending',
          transaction_ids: [],
        })
        .select()
        .single()

      if (recordError) {
        throw new Error(`Failed to create tokenization record: ${recordError.message}`)
      }

      // Update status to minting
      await this.updateTokenizationStatus(tokenizationRecord.id, 'minting')

      // Execute tokenization on Hedera
      let tokenizationResult = { success: false, error: 'Tokenization skipped: Not running in client environment.' };

      if (typeof window !== 'undefined') {
        const { mazaoContractsService } = await import('./mazao-contracts');
        tokenizationResult = await mazaoContractsService.tokenizeApprovedEvaluation(
          request.evaluationId,
          request.cropType,
          request.farmerId,
          request.farmerAccountId,
          request.estimatedValue,
          request.harvestDate
        )
      } else {
        console.warn('Tokenization skipped on server/build environment for evaluation:', request.evaluationId);
      }

      if (tokenizationResult.success) {
        // Update record with success
        await this.supabase
          .from('tokenization_records')
          .update({
            token_id: tokenizationResult.tokenId,
            status: 'completed',
            transaction_ids: tokenizationResult.transactionIds || [],
            completed_at: new Date().toISOString(),
          })
          .eq('id', tokenizationRecord.id)

        console.log(`Tokenization completed for evaluation ${request.evaluationId}`)

        return {
          success: true,
          tokenId: tokenizationResult.tokenId,
          transactionIds: tokenizationResult.transactionIds,
        }
      } else {
        // Update record with failure
        await this.supabase
          .from('tokenization_records')
          .update({
            status: 'failed',
            error_message: tokenizationResult.error,
          })
          .eq('id', tokenizationRecord.id)

        return {
          success: false,
          error: tokenizationResult.error,
        }
      }
    } catch (error) {
      console.error('Error in tokenization process:', error)
      return {
        success: false,
        error: `Tokenization failed: ${error}`,
      }
    }
  }

  /**
   * Update tokenization status
   */
  private async updateTokenizationStatus(
    recordId: string, 
    status: 'pending' | 'minting' | 'completed' | 'failed'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('tokenization_records')
      .update({ status })
      .eq('id', recordId)

    if (error) {
      console.error('Failed to update tokenization status:', error)
    }
  }

  /**
   * Get farmer's portfolio with all tokens
   */
  async getFarmerPortfolio(farmerId: string, farmerAccountId?: string): Promise<FarmerPortfolio> {
    try {
      // Get all tokenized evaluations for the farmer
      const { data: tokenizedEvaluations, error } = await this.supabase
        .from('tokenization_records')
        .select(`
          *,
          evaluation:crop_evaluations(*)
        `)
        .eq('status', 'completed')
        .not('token_id', 'is', null)

      if (error) {
        throw new Error(`Failed to fetch tokenized evaluations: ${error.message}`)
      }

      const tokens: PortfolioToken[] = []
      let totalValue = 0

      // Process each tokenized evaluation
      for (const record of tokenizedEvaluations || []) {
        if (!record.evaluation || !record.token_id) continue

        const evaluation = record.evaluation as Tables<'crop_evaluations'>
        
        // Skip if not this farmer's evaluation
        if (evaluation.farmer_id !== farmerId) continue

        // Get token info from Hedera
        let tokenInfo = null;
        if (typeof window !== 'undefined') {
          const { hederaTokenService } = await import('./hedera-token');
          tokenInfo = await hederaTokenService.getTokenInfo(record.token_id)
        }
        
        if (tokenInfo) {
          const portfolioToken: PortfolioToken = {
            tokenId: record.token_id,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            balance: tokenInfo.totalSupply,
            decimals: tokenInfo.decimals,
            cropType: evaluation.crop_type,
            estimatedValue: evaluation.valeur_estimee,
            currentValue: evaluation.valeur_estimee, // For now, use estimated value
            harvestDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now (placeholder)
            isActive: evaluation.status === 'approved',
            evaluationId: evaluation.id,
          }

          tokens.push(portfolioToken)
          totalValue += portfolioToken.currentValue
        }
      }

      return {
        farmerId,
        totalValue,
        tokens,
      }
    } catch (error) {
      console.error('Error fetching farmer portfolio:', error)
      return {
        farmerId,
        totalValue: 0,
        tokens: [],
      }
    }
  }

  /**
   * Get portfolio summary for dashboard
   */
  async getPortfolioSummary(farmerId: string): Promise<PortfolioSummary> {
    try {
      // Get tokenization records for the farmer
      const { data: records, error } = await this.supabase
        .from('tokenization_records')
        .select(`
          *,
          evaluation:crop_evaluations!inner(farmer_id)
        `)
        .eq('evaluation.farmer_id', farmerId)

      if (error) {
        throw new Error(`Failed to fetch tokenization records: ${error.message}`)
      }

      const totalTokenizations = records?.length || 0
      const completedTokenizations = records?.filter(r => r.status === 'completed').length || 0
      const pendingTokenizations = records?.filter(r => r.status === 'pending' || r.status === 'minting').length || 0
      const failedTokenizations = records?.filter(r => r.status === 'failed').length || 0

      // Get portfolio for total value calculation
      const portfolio = await this.getFarmerPortfolio(farmerId)

      return {
        totalTokens: totalTokenizations,
        totalValue: portfolio.totalValue,
        activeTokens: portfolio.tokens.filter(t => t.isActive).length,
        pendingTokenizations,
        completedTokenizations,
        failedTokenizations,
      }
    } catch (error) {
      console.error('Error fetching portfolio summary:', error)
      return {
        totalTokens: 0,
        totalValue: 0,
        activeTokens: 0,
        pendingTokenizations: 0,
        completedTokenizations: 0,
        failedTokenizations: 0,
      }
    }
  }

  /**
   * Get tokenization status for an evaluation
   */
  async getTokenizationStatus(evaluationId: string): Promise<{
    status: 'not_started' | 'pending' | 'minting' | 'completed' | 'failed'
    tokenId?: string
    transactionIds?: string[]
    error?: string
  }> {
    try {
      const { data: record, error } = await this.supabase
        .from('tokenization_records')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { status: 'not_started' }
        }
        throw error
      }

      return {
        status: record.status as 'pending' | 'minting' | 'completed' | 'failed' | 'not_started',
        tokenId: record.token_id || undefined,
        transactionIds: record.transaction_ids || undefined,
        error: record.error_message || undefined,
      }
    } catch (error) {
      console.error('Error fetching tokenization status:', error)
      return { status: 'not_started' }
    }
  }

  /**
   * Retry failed tokenization
   */
  async retryTokenization(evaluationId: string): Promise<TokenizationResult> {
    try {
      // Get the evaluation details
      // Get the evaluation details directly from database to avoid circular dependency
      const { data: evaluation } = await this.supabase
        .from('crop_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single()
      
      if (!evaluation) {
        throw new Error('Evaluation not found')
      }

      if (evaluation.status !== 'approved') {
        throw new Error('Evaluation must be approved before tokenization')
      }

      // Get farmer's wallet address (this would come from the user profile)
      // For now, we'll use a placeholder - this should be fetched from the farmer's profile
      const farmerAccountId = '0.0.123456' // Placeholder

      const request: TokenizationRequest = {
        evaluationId: evaluation.id,
        cropType: evaluation.crop_type,
        farmerId: evaluation.farmer_id || '',
        farmerAccountId,
        estimatedValue: evaluation.valeur_estimee,
        harvestDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
      }

      return await this.tokenizeEvaluation(request)
    } catch (error) {
      console.error('Error retrying tokenization:', error)
      return {
        success: false,
        error: `Retry failed: ${error}`,
      }
    }
  }
}

// Export singleton instance
export const tokenizationService = new TokenizationService()