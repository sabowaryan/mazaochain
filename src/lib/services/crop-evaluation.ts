import { createClient } from '@/lib/supabase/client'
import { CropEvaluationForm, CropEvaluationWithCalculation } from '@/types/crop-evaluation'
import type { Tables } from '@/lib/supabase/database.types'
import { tokenizationService } from './tokenization'
import type { TokenizationRequest } from '@/types/tokenization'
import { priceOracleService } from './price-oracle'

export class CropEvaluationService {
  private supabase = createClient()

  /**
   * Calculate crop valuation using the formula: superficie × rendement × prix référence
   * Uses current market price from price oracle if prix_reference is not provided
   */
  async calculateValuation(evaluation: CropEvaluationForm): Promise<number> {
    let referencePrice = evaluation.prix_reference
    
    // If no reference price provided, get current market price
    if (!referencePrice || referencePrice === 0) {
      try {
        const currentPrice = await priceOracleService.getCurrentPrice(evaluation.crop_type)
        if (currentPrice) {
          referencePrice = currentPrice.price
        } else {
          // Fallback to default prices if oracle price not available
          const defaultPrices = { manioc: 0.5, cafe: 2.0 }
          referencePrice = defaultPrices[evaluation.crop_type]
        }
      } catch (error) {
        console.error('Error getting current price from oracle:', error)
        // Fallback to default prices
        const defaultPrices = { manioc: 0.5, cafe: 2.0 }
        referencePrice = defaultPrices[evaluation.crop_type]
      }
    }
    
    return evaluation.superficie * evaluation.rendement_historique * referencePrice
  }

  /**
   * Create a new crop evaluation
   */
  async createEvaluation(
    farmerId: string, 
    evaluationData: CropEvaluationForm
  ): Promise<Tables<'crop_evaluations'>> {
    const valeur_estimee = await this.calculateValuation(evaluationData)
    
    const { data, error } = await this.supabase
      .from('crop_evaluations')
      .insert({
        farmer_id: farmerId,
        crop_type: evaluationData.crop_type,
        superficie: evaluationData.superficie,
        rendement_historique: evaluationData.rendement_historique,
        prix_reference: evaluationData.prix_reference,
        valeur_estimee,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de l'évaluation: ${error.message}`)
    }

    return data
  }

  /**
   * Get all evaluations for a farmer
   */
  async getFarmerEvaluations(farmerId: string): Promise<Tables<'crop_evaluations'>[]> {
    try {
      const response = await fetch(`/api/crop-evaluations?farmer_id=${farmerId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      // L'API retourne { data: [...], message: '...', timestamp: '...' }
      const evaluations = Array.isArray(result) ? result : (result?.data || [])
      
      if (!Array.isArray(evaluations)) {
        console.error('Evaluations data is not an array:', evaluations)
        return []
      }
      
      return evaluations
    } catch (error) {
      console.error('Error fetching farmer evaluations:', error)
      throw new Error(`Erreur lors de la récupération des évaluations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Get a specific evaluation by ID
   */
  async getEvaluationById(evaluationId: string): Promise<Tables<'crop_evaluations'> | null> {
    const { data, error } = await this.supabase
      .from('crop_evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows found
      }
      throw new Error(`Erreur lors de la récupération de l'évaluation: ${error.message}`)
    }

    return data
  }

  /**
   * Update evaluation status and trigger tokenization if approved
   */
  async updateEvaluationStatus(
    evaluationId: string, 
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<Tables<'crop_evaluations'>> {
    const { data, error } = await this.supabase
      .from('crop_evaluations')
      .update({ status })
      .eq('id', evaluationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`)
    }

    // If evaluation is approved, trigger tokenization
    if (status === 'approved' && data) {
      try {
        await this.triggerTokenization(data)
      } catch (tokenizationError) {
        console.error('Failed to trigger tokenization:', tokenizationError)
        // Don't throw here - evaluation update succeeded, tokenization can be retried
      }
    }

    return data
  }

  /**
   * Trigger tokenization for approved evaluation
   */
  private async triggerTokenization(evaluation: Tables<'crop_evaluations'>): Promise<void> {
    try {
      // Get farmer's profile to get wallet address
      const { data: farmerProfile, error: profileError } = await this.supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', evaluation.farmer_id!)
        .single()

      if (profileError || !farmerProfile?.wallet_address) {
        throw new Error('Farmer wallet address not found')
      }

      const tokenizationRequest: TokenizationRequest = {
        evaluationId: evaluation.id,
        cropType: evaluation.crop_type,
        farmerId: evaluation.farmer_id!,
        farmerAccountId: farmerProfile.wallet_address,
        estimatedValue: evaluation.valeur_estimee,
        harvestDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
      }

      // Start tokenization process
      const result = await tokenizationService.tokenizeEvaluation(tokenizationRequest)
      
      if (!result.success) {
        console.error('Tokenization failed:', result.error)
      } else {
        console.log('Tokenization started successfully for evaluation:', evaluation.id)
      }
    } catch (error) {
      console.error('Error triggering tokenization:', error)
      throw error
    }
  }

  /**
   * Get pending evaluations for cooperative review
   */
  async getPendingEvaluations(cooperativeId?: string): Promise<Tables<'crop_evaluations'>[]> {
    try {
      let url = '/api/crop-evaluations?status=pending'
      if (cooperativeId) {
        url += `&cooperative_id=${cooperativeId}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      // L'API retourne { data: [...], message: '...', timestamp: '...' }
      const evaluations = Array.isArray(result) ? result : (result?.data || [])
      
      if (!Array.isArray(evaluations)) {
        console.error('Pending evaluations data is not an array:', evaluations)
        return []
      }
      
      return evaluations
    } catch (error) {
      console.error('Error fetching pending evaluations:', error)
      throw new Error(`Erreur lors de la récupération des évaluations en attente: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }
}