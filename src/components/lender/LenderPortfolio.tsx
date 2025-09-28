'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { lenderService } from '@/lib/services/lender'
import type { LenderPortfolio as LenderPortfolioType, LenderLoan } from '@/types/lender'

export function LenderPortfolio() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState<LenderPortfolioType | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    if (user) {
      loadPortfolio()
    }
  }, [user])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      const portfolioData = await lenderService.getLenderPortfolio(user!.id)
      setPortfolio(portfolioData)
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du portefeuille...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="text-center p-8">
        <p>Impossible de charger les données du portefeuille</p>
      </div>
    )
  }

  const currentLoans = activeTab === 'active' ? portfolio.activeLoans : portfolio.completedLoans

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900">Mon Portefeuille</h1>
          <p className="mt-2 text-primary-700">Suivez vos investissements et rendements</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fonds Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {portfolio.availableFunds.toLocaleString()} USDC
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Investissements Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {portfolio.activeInvestments.toLocaleString()} USDC
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rendements Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {portfolio.totalReturns.toLocaleString()} USDC
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taux de Rendement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {portfolio.returnRate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Prêts Actifs ({portfolio.activeLoans.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Prêts Terminés ({portfolio.completedLoans.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Loans List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentLoans.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  {activeTab === 'active' 
                    ? 'Aucun prêt actif pour le moment.' 
                    : 'Aucun prêt terminé pour le moment.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            currentLoans.map((loan) => (
              <LoanCard key={loan.loanId} loan={loan} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface LoanCardProps {
  loan: LenderLoan
}

function LoanCard({ loan }: LoanCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'repaid':
        return 'bg-green-100 text-green-800'
      case 'defaulted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const progress = loan.status === 'active' 
    ? ((loan.principalAmount - loan.remainingBalance) / loan.principalAmount) * 100
    : 100

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{loan.farmerName}</CardTitle>
            <CardDescription>{loan.cropType}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
              {loan.status === 'active' ? 'Actif' : 
               loan.status === 'repaid' ? 'Remboursé' : 'Défaut'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(loan.riskLevel)}`}>
              {loan.riskLevel === 'LOW' ? 'Faible' :
               loan.riskLevel === 'MEDIUM' ? 'Moyen' : 'Élevé'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Loan Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Montant Principal:</span>
            <div className="text-lg font-bold text-green-600">
              {loan.principalAmount.toLocaleString()} USDC
            </div>
          </div>
          <div>
            <span className="font-medium">Taux d'Intérêt:</span>
            <div className="text-lg font-bold">
              {loan.interestRate.toFixed(2)}%
            </div>
          </div>
          <div>
            <span className="font-medium">Durée:</span>
            <div>{loan.termMonths} mois</div>
          </div>
          <div>
            <span className="font-medium">Échéance:</span>
            <div>{new Date(loan.dueDate).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Progress Bar for Active Loans */}
        {loan.status === 'active' && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progression du Remboursement</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Remboursé: {loan.amountRepaid.toLocaleString()} USDC</span>
              <span>Restant: {loan.remainingBalance.toLocaleString()} USDC</span>
            </div>
          </div>
        )}

        {/* Expected/Actual Return */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {loan.status === 'repaid' ? 'Rendement Réalisé:' : 'Rendement Attendu:'}
            </span>
            <span className="text-lg font-bold text-purple-600">
              {(loan.actualReturn || loan.expectedReturn).toLocaleString()} USDC
            </span>
          </div>
          {loan.status === 'repaid' && loan.actualReturn && (
            <div className="text-xs text-gray-500 mt-1">
              Profit: {(loan.actualReturn - loan.principalAmount).toLocaleString()} USDC
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Voir Détails
          </Button>
          {loan.status === 'active' && (
            <Button variant="outline" size="sm" className="flex-1">
              Historique
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}