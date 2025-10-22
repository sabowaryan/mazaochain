import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { usdcTransferService } from './usdc-transfer'
import { transactionReceiptService } from './transaction-receipt'
import type { 
  LoanOpportunity,
  LenderPortfolio,
  LenderLoan,
  FundCommitment,
  RiskAssessment,
  LenderInvestmentSummary,
  InterestDistribution,
  CollateralLiquidation,
  LenderDashboardStats
} from '@/types/lender'

export class LenderService {
  private async getSupabaseClient() {
    // Use server client during build/server-side, browser client on client-side
    if (typeof window === 'undefined') {
      return await createServerClient()
    }
    return createBrowserClient()
  }

  /**
   * Get available loan opportunities for lenders
   */
  async getAvailableLoanOpportunities(): Promise<LoanOpportunity[]> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get approved loans that don't have a lender yet
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          *,
          borrower:profiles!loans_borrower_id_fkey(
            id,
            farmer_profiles!farmer_profiles_user_id_fkey(
              nom,
              superficie,
              localisation,
              crop_type,
              cooperative_id
            )
          )
        `)
        .eq('status', 'approved')
        .is('lender_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch loan opportunities: ${error.message}`)
      }

      if (!loans) return []

      // Transform the data into LoanOpportunity format
      const opportunities: LoanOpportunity[] = await Promise.all(
        loans.map(async (loan) => {
          const farmerProfile = (loan.borrower as any)?.farmer_profiles
          
          // Get the most recent evaluation for this farmer
          const { data: evaluations } = await supabase
            .from('crop_evaluations')
            .select('*')
            .eq('farmer_id', loan.borrower_id!)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const evaluation = evaluations?.[0];

          // Get cooperative info if cooperative_id exists
          let cooperativeName = 'Non affilié';
          if (farmerProfile?.cooperative_id) {
            const { data: coopProfile } = await supabase
              .from('cooperative_profiles')
              .select('nom')
              .eq('user_id', farmerProfile.cooperative_id)
              .single();
            
            if (coopProfile) {
              cooperativeName = coopProfile.nom;
            }
          }

          // Calculate risk assessment
          const riskAssessment = await this.calculateRiskAssessment(loan.borrower_id || '', evaluation)

          // Calculate expected return
          const expectedReturn = this.calculateExpectedReturn(
            loan.principal,
            loan.interest_rate,
            12 // Assuming 12 months term
          )

          return {
            loanId: loan.id,
            farmerName: farmerProfile?.nom || 'Agriculteur Inconnu',
            farmerId: loan.borrower_id || '',
            cropType: evaluation?.crop_type || farmerProfile?.crop_type || 'Non spécifié',
            region: farmerProfile?.localisation || 'Non spécifiée',
            requestedAmount: loan.principal,
            collateralValue: loan.collateral_amount,
            collateralRatio: Math.round((loan.collateral_amount / loan.principal) * 100),
            interestRate: loan.interest_rate * 100, // Convert to percentage
            termMonths: 12, // Default term
            expectedReturn,
            harvestDate: new Date(Date.now() + (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(), // 6 months from now
            farmSize: evaluation?.superficie || farmerProfile?.superficie || 0,
            farmingExperience: 5, // Default experience
            riskAssessment,
            cooperativeApproved: true, // Since status is approved
            cooperativeName, // Add cooperative name
            createdAt: loan.created_at || new Date().toISOString()
          }
        })
      )

      return opportunities
    } catch (error) {
      console.error('Error fetching loan opportunities:', error)
      return []
    }
  }

  /**
   * Get lender portfolio information
   */
  async getLenderPortfolio(lenderId: string): Promise<LenderPortfolio> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get lender profile
      const { data: lenderProfile, error: profileError } = await supabase
        .from('lender_profiles')
        .select('*')
        .eq('user_id', lenderId)
        .single()

      if (profileError) {
        throw new Error(`Failed to fetch lender profile: ${profileError.message}`)
      }

      // Get active loans
      const { data: activeLoans, error: activeError } = await supabase
        .from('loans')
        .select(`
          *,
          borrower:profiles!loans_borrower_id_fkey(
            farmer_profiles!farmer_profiles_user_id_fkey(nom)
          )
        `)
        .eq('lender_id', lenderId)
        .eq('status', 'active')

      if (activeError) {
        throw new Error(`Failed to fetch active loans: ${activeError.message}`)
      }

      // Get completed loans
      const { data: completedLoans, error: completedError } = await supabase
        .from('loans')
        .select(`
          *,
          borrower:profiles!loans_borrower_id_fkey(
            farmer_profiles!farmer_profiles_user_id_fkey(nom)
          )
        `)
        .eq('lender_id', lenderId)
        .eq('status', 'repaid')

      if (completedError) {
        throw new Error(`Failed to fetch completed loans: ${completedError.message}`)
      }

      // Calculate portfolio metrics
      const activeInvestments = (activeLoans || []).reduce((sum, loan) => sum + loan.principal, 0)
      const totalInvested = [...(activeLoans || []), ...(completedLoans || [])]
        .reduce((sum, loan) => sum + loan.principal, 0)
      
      // Calculate total returns (simplified - would need more complex calculation in real scenario)
      const totalReturns = (completedLoans || []).reduce((sum, loan) => {
        const expectedReturn = this.calculateExpectedReturn(loan.principal, loan.interest_rate, 12)
        return sum + (expectedReturn - loan.principal)
      }, 0)

      const returnRate = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

      // Transform loans to LenderLoan format
      const activeLenderLoans: LenderLoan[] = (activeLoans || []).map(loan => ({
        loanId: loan.id,
        farmerName: (loan.borrower as any)?.farmer_profiles?.nom || 'Inconnu',
        cropType: 'Non spécifié', // Would need to join with crop_evaluations
        principalAmount: loan.principal,
        interestRate: loan.interest_rate * 100,
        termMonths: 12,
        startDate: loan.created_at || new Date().toISOString(),
        dueDate: loan.due_date,
        status: 'active',
        amountRepaid: 0, // Would need repayment tracking
        remainingBalance: loan.principal,
        expectedReturn: this.calculateExpectedReturn(loan.principal, loan.interest_rate, 12),
        riskLevel: 'MEDIUM' // Default risk level
      }))

      const completedLenderLoans: LenderLoan[] = (completedLoans || []).map(loan => ({
        loanId: loan.id,
        farmerName: (loan.borrower as any)?.farmer_profiles?.nom || 'Inconnu',
        cropType: 'Non spécifié',
        principalAmount: loan.principal,
        interestRate: loan.interest_rate * 100,
        termMonths: 12,
        startDate: loan.created_at || new Date().toISOString(),
        dueDate: loan.due_date,
        status: 'repaid',
        amountRepaid: loan.principal,
        remainingBalance: 0,
        expectedReturn: this.calculateExpectedReturn(loan.principal, loan.interest_rate, 12),
        actualReturn: this.calculateExpectedReturn(loan.principal, loan.interest_rate, 12),
        riskLevel: 'MEDIUM'
      }))

      return {
        lenderId,
        institutionName: lenderProfile.institution_name,
        availableFunds: lenderProfile.available_funds || 0,
        activeInvestments,
        totalInvested,
        totalReturns,
        returnRate,
        activeLoans: activeLenderLoans,
        completedLoans: completedLenderLoans
      }
    } catch (error) {
      console.error('Error fetching lender portfolio:', error)
      return {
        lenderId,
        institutionName: 'Institution Inconnue',
        availableFunds: 0,
        activeInvestments: 0,
        totalInvested: 0,
        totalReturns: 0,
        returnRate: 0,
        activeLoans: [],
        completedLoans: []
      }
    }
  }

  /**
   * Commit funds to a loan opportunity
   */
  async commitFundsToLoan(
    loanId: string, 
    lenderId: string, 
    amount: number
  ): Promise<{ success: boolean; error?: string; commitmentId?: string }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Check if lender has sufficient funds
      const { data: lenderProfile } = await supabase
        .from('lender_profiles')
        .select('available_funds, institution_name')
        .eq('user_id', lenderId)
        .single()

      if (!lenderProfile || (lenderProfile.available_funds || 0) < amount) {
        return {
          success: false,
          error: 'Fonds insuffisants pour cet investissement'
        }
      }

      // Get lender's wallet address
      const { data: lenderWallet } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', lenderId)
        .single()

      if (!lenderWallet?.wallet_address) {
        return {
          success: false,
          error: 'Adresse de portefeuille non trouvée'
        }
      }

      // Escrow the funds
      const escrowResult = await usdcTransferService.escrowLenderFunds({
        amount,
        fromAccountId: lenderWallet.wallet_address,
        escrowAccountId: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
        loanId,
        lenderId
      })

      if (!escrowResult.success) {
        return {
          success: false,
          error: `Échec de la mise en séquestre: ${escrowResult.error}`
        }
      }

      // Update loan with lender information
      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update({ lender_id: lenderId })
        .eq('id', loanId)

      if (loanUpdateError) {
        // Try to release escrowed funds if loan update fails
        await usdcTransferService.releaseLenderFunds(
          amount,
          process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
          lenderWallet.wallet_address,
          loanId
        )
        
        return {
          success: false,
          error: 'Échec de la mise à jour du prêt'
        }
      }

      // Update lender's available funds
      const { error: fundsUpdateError } = await supabase
        .from('lender_profiles')
        .update({ 
          available_funds: (lenderProfile.available_funds || 0) - amount 
        })
        .eq('user_id', lenderId)

      if (fundsUpdateError) {
        console.error('Failed to update lender funds:', fundsUpdateError)
      }

      // Record the fund commitment transaction
      await transactionReceiptService.recordTransaction(lenderId, {
        loanId,
        transactionType: 'escrow',
        amount,
        tokenType: 'USDC',
        fromAddress: lenderWallet.wallet_address,
        toAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
        hederaTransactionId: escrowResult.transactionId!,
        status: 'confirmed',
        timestamp: new Date(),
      })

      // Send notification to borrower
      const { data: loan } = await supabase
        .from('loans')
        .select('borrower_id, principal')
        .eq('id', loanId)
        .single()

      if (loan) {
        await supabase.rpc('send_notification', {
          recipient_id: loan.borrower_id || '',
          notification_title: 'Financement sécurisé',
          notification_message: `Votre prêt de ${loan.principal} USDC a été financé par ${lenderProfile.institution_name}`,
          notification_type: 'loan_funded'
        })
      }

      return {
        success: true,
        commitmentId: escrowResult.transactionId
      }
    } catch (error) {
      console.error('Error committing funds to loan:', error)
      return {
        success: false,
        error: `Erreur lors de l'engagement des fonds: ${error}`
      }
    }
  }

  /**
   * Distribute interest and principal to lender when loan is repaid
   */
  async distributeRepaymentToLender(
    loanId: string,
    repaymentAmount: number
  ): Promise<{ success: boolean; error?: string; distributionId?: string }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get loan details
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (loanError || !loan?.lender_id) {
        return {
          success: false,
          error: 'Prêt ou prêteur non trouvé'
        }
      }

      // Get lender's wallet address
      const { data: lenderWallet } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', loan.lender_id)
        .single()

      if (!lenderWallet?.wallet_address) {
        return {
          success: false,
          error: 'Adresse de portefeuille du prêteur non trouvée'
        }
      }

      // Transfer repayment to lender
      const transferResult = await usdcTransferService.transferUSDCToLender(
        lenderWallet.wallet_address,
        repaymentAmount,
        loanId
      )

      if (!transferResult.success) {
        return {
          success: false,
          error: `Échec du transfert: ${transferResult.error}`
        }
      }

      // Update lender's available funds
      const { data: lenderProfile } = await supabase
        .from('lender_profiles')
        .select('available_funds')
        .eq('user_id', loan.lender_id)
        .single()

      if (lenderProfile) {
        await supabase
          .from('lender_profiles')
          .update({ 
            available_funds: (lenderProfile.available_funds || 0) + repaymentAmount 
          })
          .eq('user_id', loan.lender_id)
      }

      // Record the distribution transaction
      await transactionReceiptService.recordTransaction(loan.lender_id, {
        loanId,
        transactionType: 'repayment',
        amount: repaymentAmount,
        tokenType: 'USDC',
        fromAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
        toAddress: lenderWallet.wallet_address,
        hederaTransactionId: transferResult.transactionId!,
        status: 'confirmed',
        timestamp: new Date(),
      })

      // Send notification to lender
      await supabase.rpc('send_notification', {
        recipient_id: loan.lender_id,
        notification_title: 'Remboursement reçu',
        notification_message: `Remboursement de ${repaymentAmount} USDC reçu pour le prêt ${loanId}`,
        notification_type: 'repayment_received'
      })

      return {
        success: true,
        distributionId: transferResult.transactionId
      }
    } catch (error) {
      console.error('Error distributing repayment to lender:', error)
      return {
        success: false,
        error: `Erreur lors de la distribution: ${error}`
      }
    }
  }

  /**
   * Handle collateral liquidation for defaulted loans
   */
  async liquidateCollateralForLender(
    loanId: string
  ): Promise<{ success: boolean; error?: string; liquidationAmount?: number }> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get loan details
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (loanError || !loan?.lender_id) {
        return {
          success: false,
          error: 'Prêt ou prêteur non trouvé'
        }
      }

      // Get collateral tokens
      const collateralTokens = await this.getCollateralTokens(loanId)
      
      if (collateralTokens.length === 0) {
        return {
          success: false,
          error: 'Aucun collatéral trouvé pour ce prêt'
        }
      }

      // Calculate liquidation value (simplified - would use market prices in real scenario)
      const liquidationValue = Math.min(loan.collateral_amount, loan.principal * 1.1) // Principal + 10% penalty

      // Get lender's wallet address
      const { data: lenderWallet } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', loan.lender_id)
        .single()

      if (!lenderWallet?.wallet_address) {
        return {
          success: false,
          error: 'Adresse de portefeuille du prêteur non trouvée'
        }
      }

      // Transfer liquidated collateral value to lender
      const liquidationResult = await usdcTransferService.liquidateCollateralToLender(
        lenderWallet.wallet_address,
        liquidationValue,
        loanId,
        (collateralTokens as any)[0]?.tokenId
      )

      if (!liquidationResult.success) {
        return {
          success: false,
          error: `Échec de la liquidation: ${liquidationResult.error}`
        }
      }

      // Update loan status to defaulted
      await supabase
        .from('loans')
        .update({ status: 'defaulted' })
        .eq('id', loanId)

      // Update lender's available funds
      const { data: lenderProfile } = await supabase
        .from('lender_profiles')
        .select('available_funds')
        .eq('user_id', loan.lender_id)
        .single()

      if (lenderProfile) {
        await supabase
          .from('lender_profiles')
          .update({ 
            available_funds: (lenderProfile.available_funds || 0) + liquidationValue 
          })
          .eq('user_id', loan.lender_id)
      }

      // Record the liquidation transaction
      await transactionReceiptService.recordTransaction(loan.lender_id, {
        loanId,
        transactionType: 'release',
        amount: liquidationValue,
        tokenType: 'USDC',
        fromAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
        toAddress: lenderWallet.wallet_address,
        hederaTransactionId: liquidationResult.transactionId!,
        status: 'confirmed',
        timestamp: new Date(),
      })

      // Send notification to lender
      await supabase.rpc('send_notification', {
        recipient_id: loan.lender_id,
        notification_title: 'Collatéral liquidé',
        notification_message: `Collatéral liquidé pour ${liquidationValue} USDC suite au défaut de paiement`,
        notification_type: 'collateral_liquidated'
      })

      return {
        success: true,
        liquidationAmount: liquidationValue
      }
    } catch (error) {
      console.error('Error liquidating collateral:', error)
      return {
        success: false,
        error: `Erreur lors de la liquidation: ${error}`
      }
    }
  }

  /**
   * Get lender dashboard statistics
   */
  async getLenderDashboardStats(lenderId: string): Promise<LenderDashboardStats> {
    try {
      const portfolio = await this.getLenderPortfolio(lenderId)
      const opportunities = await this.getAvailableLoanOpportunities()

      // Calculate risk distribution
      const riskDistribution = portfolio.activeLoans.reduce(
        (acc, loan) => {
          const riskLevel = loan.riskLevel.toLowerCase() as 'low' | 'medium' | 'high'
          if (riskLevel in acc) {
            acc[riskLevel]++
          }
          return acc
        },
        { low: 0, medium: 0, high: 0 }
      )

      // Calculate performance metrics (simplified)
      const totalLoans = portfolio.activeLoans.length + portfolio.completedLoans.length
      const onTimeRepayments = portfolio.completedLoans.length // Simplified
      const defaults = 0 // Would need to track defaults
      
      return {
        totalPortfolioValue: portfolio.activeInvestments + portfolio.availableFunds,
        monthlyIncome: portfolio.totalReturns / 12, // Simplified
        averageROI: portfolio.returnRate,
        activeInvestments: portfolio.activeLoans.length,
        pendingOpportunities: opportunities.length,
        riskDistribution,
        performanceMetrics: {
          onTimeRepaymentRate: totalLoans > 0 ? (onTimeRepayments / totalLoans) * 100 : 0,
          defaultRate: totalLoans > 0 ? (defaults / totalLoans) * 100 : 0,
          averageLoanTerm: 12 // Default term
        }
      }
    } catch (error) {
      console.error('Error fetching lender dashboard stats:', error)
      return {
        totalPortfolioValue: 0,
        monthlyIncome: 0,
        averageROI: 0,
        activeInvestments: 0,
        pendingOpportunities: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        performanceMetrics: {
          onTimeRepaymentRate: 0,
          defaultRate: 0,
          averageLoanTerm: 0
        }
      }
    }
  }

  /**
   * Calculate risk assessment for a farmer and crop
   */
  private async calculateRiskAssessment(farmerId: string, evaluation: unknown): Promise<RiskAssessment> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get farmer's history
      const { data: farmerLoans } = await supabase
        .from('loans')
        .select('status')
        .eq('borrower_id', farmerId)

      // Calculate credit score based on loan history
      const totalLoans = farmerLoans?.length || 0
      const repaidLoans = farmerLoans?.filter(l => l.status === 'repaid').length || 0
      const farmerCreditScore = totalLoans > 0 ? (repaidLoans / totalLoans) * 100 : 75 // Default score

      // Risk factors
      const riskFactors: string[] = []
      
      if (farmerCreditScore < 70) {
        riskFactors.push('Historique de crédit faible')
      }
      
      if (!evaluation || (evaluation as any).rendement_historique < 1000) {
        riskFactors.push('Rendement historique faible')
      }

      // Determine overall risk
      let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
      
      if (farmerCreditScore >= 80 && riskFactors.length === 0) {
        overallRisk = 'LOW'
      } else if (farmerCreditScore < 60 || riskFactors.length > 2) {
        overallRisk = 'HIGH'
      }

      return {
        farmerCreditScore,
        cropHistoricalYield: (evaluation as any)?.rendement_historique || 1000,
        marketPriceVolatility: 15, // Default volatility
        collateralizationRatio: 200, // 200% collateral ratio
        overallRisk,
        riskFactors
      }
    } catch (error) {
      console.error('Error calculating risk assessment:', error)
      return {
        farmerCreditScore: 75,
        cropHistoricalYield: 1000,
        marketPriceVolatility: 15,
        collateralizationRatio: 200,
        overallRisk: 'MEDIUM',
        riskFactors: []
      }
    }
  }

  /**
   * Calculate expected return for a loan
   */
  private calculateExpectedReturn(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 12
    const totalReturn = principal * (1 + (monthlyRate * termMonths))
    return Math.round(totalReturn * 100) / 100
  }

  /**
   * Get collateral tokens for a loan
   */
  private async getCollateralTokens(loanId: string): Promise<unknown[]> {
    try {
      // This would need to be implemented based on how collateral tokens are tracked
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error getting collateral tokens:', error)
      return []
    }
  }
}

export const lenderService = new LenderService()