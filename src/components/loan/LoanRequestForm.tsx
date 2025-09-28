'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loanService } from '@/lib/services/loan'
import { tokenizationService } from '@/lib/services/tokenization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { LoanEligibility, LoanRequest } from '@/types/loan'
import type { FarmerPortfolio } from '@/types/tokenization'

interface LoanRequestFormProps {
  onSuccess?: (loanId: string) => void
  onCancel?: () => void
}

export function LoanRequestForm({ onSuccess, onCancel }: LoanRequestFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<FarmerPortfolio | null>(null)
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null)
  const [formData, setFormData] = useState({
    requestedAmount: '',
    purpose: '',
    repaymentPeriodMonths: '6'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load farmer's portfolio on component mount
  useEffect(() => {
    if (user?.id) {
      loadPortfolio()
    }
  }, [user?.id])

  // Check eligibility when requested amount changes
  useEffect(() => {
    if (user?.id && formData.requestedAmount) {
      const amount = parseFloat(formData.requestedAmount)
      if (amount > 0) {
        checkEligibility(amount)
      }
    }
  }, [user?.id, formData.requestedAmount])

  const loadPortfolio = async () => {
    if (!user?.id) return
    
    try {
      const portfolioData = await tokenizationService.getFarmerPortfolio(user.id)
      setPortfolio(portfolioData)
    } catch (error) {
      console.error('Error loading portfolio:', error)
    }
  }

  const checkEligibility = async (amount: number) => {
    if (!user?.id) return
    
    try {
      const eligibilityData = await loanService.checkLoanEligibility(user.id, amount)
      setEligibility(eligibilityData)
    } catch (error) {
      console.error('Error checking eligibility:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.requestedAmount || parseFloat(formData.requestedAmount) <= 0) {
      newErrors.requestedAmount = 'Montant requis'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Objectif du prêt requis'
    }

    if (!formData.repaymentPeriodMonths || parseInt(formData.repaymentPeriodMonths) <= 0) {
      newErrors.repaymentPeriodMonths = 'Période de remboursement requise'
    }

    if (eligibility && !eligibility.isEligible) {
      newErrors.eligibility = 'Vous n\'êtes pas éligible pour ce montant'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user?.id) return

    setLoading(true)
    
    try {
      const request: LoanRequest = {
        borrowerId: user.id,
        requestedAmount: parseFloat(formData.requestedAmount),
        purpose: formData.purpose,
        repaymentPeriodMonths: parseInt(formData.repaymentPeriodMonths),
        collateralTokenIds: portfolio?.tokens.map(t => t.tokenId) || []
      }

      const result = await loanService.createLoanRequest(request)
      
      if (result.success && result.loanId) {
        onSuccess?.(result.loanId)
      } else {
        setErrors({ submit: result.error || 'Erreur lors de la création du prêt' })
      }
    } catch (error) {
      console.error('Error submitting loan request:', error)
      setErrors({ submit: 'Erreur lors de la soumission' })
    } finally {
      setLoading(false)
    }
  }

  if (!portfolio) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement du portefeuille...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Votre Collatéral Disponible</CardTitle>
          <CardDescription>
            Tokens disponibles pour garantir votre prêt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-green-600">
                {portfolio.totalValue.toFixed(2)} USDC
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tokens actifs</p>
              <p className="text-2xl font-bold">
                {portfolio.tokens.filter(t => t.isActive).length}
              </p>
            </div>
          </div>
          
          {portfolio.tokens.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                Vous devez avoir des tokens de récolte pour demander un prêt. 
                Veuillez d'abord faire évaluer vos récoltes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Demande de Prêt</CardTitle>
          <CardDescription>
            Remplissez les détails de votre demande de prêt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Requested Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant demandé (USDC)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.requestedAmount}
                onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
              {errors.requestedAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.requestedAmount}</p>
              )}
            </div>

            {/* Eligibility Check */}
            {eligibility && formData.requestedAmount && (
              <div className={`p-4 rounded-md ${
                eligibility.isEligible 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${
                    eligibility.isEligible ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {eligibility.isEligible ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      eligibility.isEligible ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {eligibility.isEligible ? 'Éligible' : 'Non éligible'}
                    </h3>
                    <div className={`mt-1 text-sm ${
                      eligibility.isEligible ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <p>Montant maximum: {eligibility.maxLoanAmount.toFixed(2)} USDC</p>
                      <p>Collatéral requis: {eligibility.requiredCollateral.toFixed(2)} USDC (200%)</p>
                      {eligibility.reasons && (
                        <ul className="mt-1 list-disc list-inside">
                          {eligibility.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif du prêt
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Décrivez l'utilisation prévue des fonds..."
              />
              {errors.purpose && (
                <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
              )}
            </div>

            {/* Repayment Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période de remboursement (mois)
              </label>
              <select
                value={formData.repaymentPeriodMonths}
                onChange={(e) => handleInputChange('repaymentPeriodMonths', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="3">3 mois</option>
                <option value="6">6 mois</option>
                <option value="9">9 mois</option>
                <option value="12">12 mois</option>
              </select>
              {errors.repaymentPeriodMonths && (
                <p className="mt-1 text-sm text-red-600">{errors.repaymentPeriodMonths}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !eligibility?.isEligible || portfolio.tokens.length === 0}
                className="flex-1"
              >
                {loading ? 'Soumission...' : 'Soumettre la demande'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}