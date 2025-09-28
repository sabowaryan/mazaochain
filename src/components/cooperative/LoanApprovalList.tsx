'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loanService } from '@/lib/services/loan'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { LoanDetails, LoanApprovalRequest } from '@/types/loan'

export function LoanApprovalList() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pendingLoans, setPendingLoans] = useState<LoanDetails[]>([])
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadPendingLoans()
    }
  }, [user?.id])

  const loadPendingLoans = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const loans = await loanService.getUserLoans(user.id, 'cooperative')
      const pending = loans.filter(loan => loan.status === 'pending')
      setPendingLoans(pending)
    } catch (error) {
      console.error('Error loading pending loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (loanId: string, approved: boolean, comments?: string) => {
    setProcessingLoanId(loanId)
    
    try {
      const approval: LoanApprovalRequest = {
        loanId,
        cooperativeId: user?.id || '',
        approved,
        comments
      }

      const result = await loanService.approveLoanRequest(approval)
      
      if (result.success) {
        // Remove the loan from pending list
        setPendingLoans(prev => prev.filter(loan => loan.id !== loanId))
      } else {
        console.error('Error processing approval:', result.error)
        // You might want to show an error message to the user
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    } finally {
      setProcessingLoanId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const calculateCollateralRatio = (loan: LoanDetails) => {
    return ((loan.collateral_amount / loan.principal) * 100).toFixed(0)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des demandes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes de Prêt en Attente</CardTitle>
        <CardDescription>
          {pendingLoans.length === 0 
            ? 'Aucune demande en attente' 
            : `${pendingLoans.length} demande${pendingLoans.length > 1 ? 's' : ''} en attente d'approbation`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingLoans.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
            <p className="mt-1 text-sm text-gray-500">
              Toutes les demandes de prêt ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="border border-gray-200 rounded-lg p-6">
                {/* Loan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Demande de {loan.principal.toFixed(2)} USDC
                    </h3>
                    <p className="text-sm text-gray-600">
                      Par {loan.borrower?.nom || 'Agriculteur inconnu'} • {formatDate(loan.created_at || '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      En attente
                    </span>
                  </div>
                </div>

                {/* Loan Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Montant demandé</p>
                    <p className="text-lg font-semibold text-green-600">
                      {loan.principal.toFixed(2)} USDC
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Collatéral</p>
                    <p className="text-lg font-semibold">
                      {loan.collateral_amount.toFixed(2)} USDC
                    </p>
                    <p className="text-xs text-gray-500">
                      ({calculateCollateralRatio(loan)}% de couverture)
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Taux d'intérêt</p>
                    <p className="text-lg font-semibold">
                      {(loan.interest_rate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Annuel</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Échéance</p>
                    <p className="text-lg font-semibold">
                      {formatDate(loan.due_date)}
                    </p>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Évaluation des Risques</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-800 font-medium">Ratio de Collatéral</p>
                        <p className="text-blue-700">{calculateCollateralRatio(loan)}% (Requis: 200%)</p>
                      </div>
                      <div>
                        <p className="text-blue-800 font-medium">Historique Agriculteur</p>
                        <p className="text-blue-700">Nouveau membre</p>
                      </div>
                      <div>
                        <p className="text-blue-800 font-medium">Évaluation Globale</p>
                        <p className="text-blue-700">Risque Faible</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farmer Information */}
                {loan.borrower && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Informations Agriculteur</h4>
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Nom</p>
                          <p className="font-medium">{loan.borrower.nom}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium">{loan.borrower.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleApproval(loan.id, true)}
                    disabled={processingLoanId === loan.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingLoanId === loan.id ? 'Traitement...' : 'Approuver'}
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval(loan.id, false, 'Demande rejetée par la coopérative')}
                    disabled={processingLoanId === loan.id}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {processingLoanId === loan.id ? 'Traitement...' : 'Rejeter'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={processingLoanId === loan.id}
                  >
                    Voir Détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}