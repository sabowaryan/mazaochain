'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loanService } from '@/lib/services/loan'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { LoanDetails, LoanRepayment } from '@/types/loan'

interface LoanRepaymentInterfaceProps {
  loan: LoanDetails
  onRepaymentSuccess?: () => void
  onCancel?: () => void
}

export function LoanRepaymentInterface({ 
  loan, 
  onRepaymentSuccess, 
  onCancel 
}: LoanRepaymentInterfaceProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [repaymentAmount, setRepaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('full')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [outstandingBalance, setOutstandingBalance] = useState(0)
  const [interestAmount, setInterestAmount] = useState(0)
  const [totalOwed, setTotalOwed] = useState(0)

  const loadOutstandingBalance = async () => {
    setLoadingBalance(true)
    try {
      const balance = await loanService.getOutstandingBalance(loan.id)
      setOutstandingBalance(balance.principal)
      setInterestAmount(balance.interest)
      setTotalOwed(balance.total)
    } catch (error) {
      console.error('Error loading outstanding balance:', error)
      // Fallback to simple calculation
      const principal = loan.principal
      const interest = loan.principal * loan.interest_rate * (1/12)
      setOutstandingBalance(principal)
      setInterestAmount(interest)
      setTotalOwed(principal + interest)
    } finally {
      setLoadingBalance(false)
    }
  }

  // Load outstanding balance
  useEffect(() => {
    loadOutstandingBalance()
  }, [loadOutstandingBalance, loan.id])

  useEffect(() => {
    if (paymentType === 'full') {
      setRepaymentAmount(totalOwed.toFixed(2))
    } else {
      setRepaymentAmount('')
    }
  }, [paymentType, totalOwed])

  const handleRepayment = async () => {
    if (!user?.id) return

    const amount = parseFloat(repaymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Veuillez entrer un montant valide')
      return
    }

    if (amount > totalOwed) {
      setError('Le montant ne peut pas dépasser le solde dû')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const repaymentData: LoanRepayment = {
        loanId: loan.id,
        amount,
        paymentType: amount >= totalOwed ? 'full' : 'partial'
      }

      const result = await loanService.repayLoan(repaymentData)

      if (result.success) {
        setSuccess(
          repaymentData.paymentType === 'full' 
            ? 'Prêt remboursé avec succès! Votre collatéral a été libéré.'
            : `Remboursement partiel de ${amount.toFixed(2)} USDC effectué avec succès.`
        )
        
        if (onRepaymentSuccess) {
          setTimeout(() => {
            onRepaymentSuccess()
          }, 2000)
        }
      } else {
        setError(result.error || 'Erreur lors du remboursement')
      }
    } catch (error) {
      console.error('Repayment error:', error)
      setError('Erreur lors du remboursement. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  if (loadingBalance) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement du solde...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du Prêt</CardTitle>
          <CardDescription>
            Informations sur votre prêt actif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Montant Principal</Label>
              <p className="text-lg font-semibold">{loan.principal.toFixed(2)} USDC</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Taux d'Intérêt</Label>
              <p className="text-lg font-semibold">{(loan.interest_rate * 100).toFixed(1)}% annuel</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Date d'Échéance</Label>
              <p className="text-lg font-semibold">{formatDate(loan.due_date)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Collatéral</Label>
              <p className="text-lg font-semibold">{loan.collateral_amount.toFixed(2)} USDC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Solde Restant</CardTitle>
          <CardDescription>
            Montant total à rembourser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Principal</span>
              <span className="text-lg font-semibold">{outstandingBalance.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Intérêts Accumulés</span>
              <span className="text-lg font-semibold">{interestAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-base font-semibold text-blue-800">Total Dû</span>
              <span className="text-xl font-bold text-blue-800">{totalOwed.toFixed(2)} USDC</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Effectuer un Remboursement</CardTitle>
          <CardDescription>
            Choisissez le type et le montant du remboursement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Payment Type Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Type de Remboursement</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={(e) => setPaymentType(e.target.value as 'full')}
                    className="mr-2"
                  />
                  <span className="text-sm">Remboursement Complet ({totalOwed.toFixed(2)} USDC)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={(e) => setPaymentType(e.target.value as 'partial')}
                    className="mr-2"
                  />
                  <span className="text-sm">Remboursement Partiel</span>
                </label>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="repaymentAmount">Montant (USDC)</Label>
              <Input
                id="repaymentAmount"
                type="number"
                step="0.01"
                min="0"
                max={totalOwed}
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                placeholder="Entrez le montant à rembourser"
                disabled={paymentType === 'full'}
              />
              {paymentType === 'partial' && (
                <p className="mt-1 text-xs text-gray-500">
                  Montant minimum: 1 USDC, Maximum: {totalOwed.toFixed(2)} USDC
                </p>
              )}
            </div>

            {/* Collateral Release Info */}
            {paymentType === 'full' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Libération du Collatéral
                    </h4>
                    <p className="mt-1 text-sm text-green-700">
                      Avec un remboursement complet, votre collatéral de {loan.collateral_amount.toFixed(2)} USDC 
                      sera automatiquement libéré et retourné à votre portefeuille.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Erreur</p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Succès</p>
                    <p className="mt-1 text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleRepayment}
                disabled={loading || !repaymentAmount || parseFloat(repaymentAmount) <= 0}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  `Rembourser ${repaymentAmount ? parseFloat(repaymentAmount).toFixed(2) : '0'} USDC`
                )}
              </Button>
              
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}