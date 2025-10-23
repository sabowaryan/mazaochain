'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loanService } from '@/lib/services/loan'
import { tokenizationService } from '@/lib/services/tokenization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { LoanEligibility, LoanRequest } from '@/types/loan'
import type { FarmerPortfolio } from '@/types/tokenization'
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  DocumentTextIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import {
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid'

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
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du portefeuille...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Votre Collatéral Disponible</h3>
            <p className="text-sm text-gray-600">Tokens disponibles pour garantir votre prêt</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <div className="flex items-center space-x-2 mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
              <p className="text-sm font-medium text-primary-700">Valeur totale</p>
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {portfolio.totalValue.toFixed(2)} USDC
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl border border-secondary-200">
            <div className="flex items-center space-x-2 mb-2">
              <BanknotesIcon className="w-5 h-5 text-secondary-600" />
              <p className="text-sm font-medium text-secondary-700">Tokens actifs</p>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {portfolio.tokens.filter(t => t.isActive).length}
            </p>
          </div>
        </div>
        
        {portfolio.tokens.length === 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Tokens requis</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Vous devez avoir des tokens de récolte pour demander un prêt. 
                  Veuillez d'abord faire évaluer vos récoltes.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Loan Request Form */}
      <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
            <DocumentTextIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Demande de Prêt</h3>
            <p className="text-sm text-gray-600">Remplissez les détails de votre demande de prêt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requested Amount */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Montant demandé (USDC) *
              </label>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.requestedAmount}
              onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              placeholder="0.00"
            />
            {errors.requestedAmount && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{errors.requestedAmount}</span>
              </p>
            )}
          </div>

          {/* Eligibility Check */}
          {eligibility && formData.requestedAmount && (
            <div className={`p-6 rounded-xl border-2 ${
              eligibility.isEligible 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${
                  eligibility.isEligible ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {eligibility.isEligible ? (
                    <CheckCircleIconSolid className="h-5 w-5 text-white" />
                  ) : (
                    <ExclamationTriangleIconSolid className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    eligibility.isEligible ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {eligibility.isEligible ? '✅ Éligible pour ce prêt' : '❌ Non éligible'}
                  </h3>
                  <div className={`space-y-2 text-sm ${
                    eligibility.isEligible ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white/50 rounded-lg">
                        <p className="font-medium">Montant maximum</p>
                        <p className="text-lg font-bold">{eligibility.maxLoanAmount.toFixed(2)} USDC</p>
                      </div>
                      <div className="p-3 bg-white/50 rounded-lg">
                        <p className="font-medium">Collatéral requis (200%)</p>
                        <p className="text-lg font-bold">{eligibility.requiredCollateral.toFixed(2)} USDC</p>
                      </div>
                    </div>
                    {eligibility.reasons && eligibility.reasons.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Détails:</p>
                        <ul className="space-y-1">
                          {eligibility.reasons.map((reason, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Objectif du prêt *
              </label>
            </div>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none"
              placeholder="Décrivez l'utilisation prévue des fonds (ex: achat de semences, équipement agricole, frais de récolte...)"
            />
            {errors.purpose && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{errors.purpose}</span>
              </p>
            )}
          </div>

          {/* Repayment Period */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Période de remboursement *
              </label>
            </div>
            <select
              value={formData.repaymentPeriodMonths}
              onChange={(e) => handleInputChange('repaymentPeriodMonths', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="3">📅 3 mois</option>
              <option value="6">📅 6 mois (recommandé)</option>
              <option value="9">📅 9 mois</option>
              <option value="12">📅 12 mois</option>
            </select>
            {errors.repaymentPeriodMonths && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{errors.repaymentPeriodMonths}</span>
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={loading || !eligibility?.isEligible || portfolio.tokens.length === 0}
                className="flex-1 group bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Soumission...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircleIconSolid className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Soumettre la demande</span>
                  </div>
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="sm:w-auto"
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}