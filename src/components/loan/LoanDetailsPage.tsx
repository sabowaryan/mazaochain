'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loanService } from '@/lib/services/loan'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoanRepaymentInterface } from './LoanRepaymentInterface'
import { RepaymentHistory } from './RepaymentHistory'
import { LoanDisbursementStatus } from './LoanDisbursementStatus'
import type { LoanDetails, CollateralToken } from '@/types/loan'

interface LoanDetailsPageProps {
  loanId: string
  onBack?: () => void
}

export function LoanDetailsPage({ loanId, onBack }: LoanDetailsPageProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loan, setLoan] = useState<LoanDetails | null>(null)
  const [collateralTokens, setCollateralTokens] = useState<CollateralToken[]>([])
  const [showRepaymentInterface, setShowRepaymentInterface] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLoanDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [loanData, collateralData] = await Promise.all([
        loanService.getLoanById(loanId),
        loanService.getCollateralTokensForLoan(loanId)
      ])
      
      if (!loanData) {
        setError('Prêt non trouvé')
        return
      }
      
      setLoan(loanData)
      setCollateralTokens(collateralData)
    } catch (error) {
      console.error('Error loading loan details:', error)
      setError('Erreur lors du chargement des détails du prêt')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLoanDetails()
  }, [loanId])

  const handleRepaymentSuccess = () => {
    setShowRepaymentInterface(false)
    loadLoanDetails() // Reload to get updated status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'repaid':
        return 'bg-gray-100 text-gray-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'defaulted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'approved':
        return 'Approuvé'
      case 'active':
        return 'Actif'
      case 'repaid':
        return 'Remboursé'
      case 'rejected':
        return 'Rejeté'
      case 'defaulted':
        return 'En défaut'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des détails du prêt...</p>
      </div>
    )
  }

  if (error || !loan) {
    return (
      <div className="text-center p-8">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
        <p className="mt-1 text-gray-500">{error}</p>
        {onBack && (
          <div className="mt-6">
            <Button onClick={onBack} variant="outline">
              Retour
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Check if user can perform repayment
  const canRepay = profile?.role === 'agriculteur' && 
                   loan.borrower_id === user?.id && 
                   loan.status === 'active'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Détails du Prêt
          </h1>
          <p className="mt-1 text-gray-600">
            Prêt de {loan.principal.toFixed(2)} USDC
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(loan.status || 'pending')}`}>
            {getStatusText(loan.status || 'pending')}
          </span>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Retour
            </Button>
          )}
        </div>
      </div>

      {/* Loan Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du Prêt</CardTitle>
          <CardDescription>
            Informations générales sur ce prêt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Principal</p>
              <p className="text-2xl font-bold text-blue-600">{loan.principal.toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Collatéral</p>
              <p className="text-2xl font-bold text-purple-600">{loan.collateral_amount.toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taux d'Intérêt</p>
              <p className="text-2xl font-bold text-green-600">{(loan.interest_rate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Échéance</p>
              <p className="text-lg font-semibold text-gray-800">{formatDate(loan.due_date)}</p>
            </div>
          </div>

          {/* Participants */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loan.borrower && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Emprunteur</p>
                  <p className="text-lg font-semibold">{loan.borrower.nom}</p>
                  <p className="text-sm text-gray-500">{loan.borrower.email}</p>
                </div>
              )}
              {loan.lender && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Prêteur</p>
                  <p className="text-lg font-semibold">{loan.lender.institution_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Date de Création</p>
                <p className="text-sm text-gray-800">{formatDate(loan.created_at || '')}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Date d'Échéance</p>
                <p className="text-sm text-gray-800">{formatDate(loan.due_date)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collateral Information */}
      {collateralTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collatéral</CardTitle>
            <CardDescription>
              Tokens utilisés comme garantie pour ce prêt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collateralTokens.map((token) => (
                <div key={token.tokenId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{token.name}</h4>
                      <p className="text-sm text-gray-600">{token.symbol}</p>
                      <p className="text-xs text-gray-500">Type: {token.cropType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{token.currentValue.toFixed(2)} USDC</p>
                      <p className="text-sm text-gray-600">
                        Récolte: {new Date(token.harvestDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement Status */}
      {(loan.status === 'approved' || loan.status === 'active' || loan.status === 'repaid') && (
        <LoanDisbursementStatus 
          loanId={loan.id} 
          onRetry={loadLoanDetails}
        />
      )}

      {/* Repayment Section */}
      {canRepay && (
        <Card>
          <CardHeader>
            <CardTitle>Remboursement</CardTitle>
            <CardDescription>
              Gérer le remboursement de votre prêt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showRepaymentInterface ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Prêt Actif
                </h3>
                <p className="mt-1 text-gray-500">
                  Votre prêt est actif et peut être remboursé à tout moment.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowRepaymentInterface(true)}>
                    Effectuer un Remboursement
                  </Button>
                </div>
              </div>
            ) : (
              <LoanRepaymentInterface
                loan={loan}
                onRepaymentSuccess={handleRepaymentSuccess}
                onCancel={() => setShowRepaymentInterface(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Repayment History */}
      <RepaymentHistory 
        loanId={loan.id} 
        borrowerId={loan.borrower_id || ''} 
      />
    </div>
  )
}