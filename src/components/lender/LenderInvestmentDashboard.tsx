'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { lenderService } from '@/lib/services/lender'
import type { LoanOpportunity, LenderPortfolio } from '@/types/lender'

export function LenderInvestmentDashboard() {
  const { user, profile } = useAuth()
  const [opportunities, setOpportunities] = useState<LoanOpportunity[]>([])
  const [portfolio, setPortfolio] = useState<LenderPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<LoanOpportunity | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [opportunitiesData, portfolioData] = await Promise.all([
        lenderService.getAvailableLoanOpportunities(),
        lenderService.getLenderPortfolio(user!.id)
      ])
      
      setOpportunities(opportunitiesData)
      setPortfolio(portfolioData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && profile?.role === 'preteur') {
      loadDashboardData()
    }
  }, [user, profile, loadDashboardData])

  const handleCommitFunds = async (opportunityId: string, amount: number) => {
    try {
      const result = await lenderService.commitFundsToLoan(opportunityId, user!.id, amount)
      
      if (result.success) {
        // Refresh data
        await loadDashboardData()
        setSelectedOpportunity(null)
      } else {
        console.error('Failed to commit funds:', result.error)
      }
    } catch (error) {
      console.error('Error committing funds:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des opportunités...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900">Opportunités d'Investissement</h1>
          <p className="mt-2 text-primary-700">Investissez dans l'agriculture décentralisée</p>
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium text-gray-600">Rendement Total</CardTitle>
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
        )}

        {/* Available Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {opportunities.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Aucune opportunité d'investissement disponible pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((opportunity) => (
              <Card key={opportunity.loanId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{opportunity.farmerName}</CardTitle>
                      <CardDescription>{opportunity.cropType} - {opportunity.region}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {opportunity.requestedAmount.toLocaleString()} USDC
                      </div>
                      <div className="text-sm text-gray-500">
                        {opportunity.interestRate}% APR
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Risk Assessment */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Évaluation des Risques:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.riskAssessment.overallRisk === 'LOW' 
                          ? 'bg-green-100 text-green-800'
                          : opportunity.riskAssessment.overallRisk === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {opportunity.riskAssessment.overallRisk === 'LOW' ? 'Faible' :
                         opportunity.riskAssessment.overallRisk === 'MEDIUM' ? 'Moyen' : 'Élevé'}
                      </span>
                    </div>

                    {/* Collateral Info */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Collatéral:</span>
                      <span className="text-sm">
                        {opportunity.collateralValue.toLocaleString()} USDC ({opportunity.collateralRatio}%)
                      </span>
                    </div>

                    {/* Term */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Durée:</span>
                      <span className="text-sm">{opportunity.termMonths} mois</span>
                    </div>

                    {/* Expected Return */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Rendement Attendu:</span>
                      <span className="text-sm font-bold text-green-600">
                        {opportunity.expectedReturn.toLocaleString()} USDC
                      </span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOpportunity(opportunity)}
                        className="flex-1"
                      >
                        Voir Détails
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCommitFunds(opportunity.loanId, opportunity.requestedAmount)}
                        className="flex-1"
                        disabled={!portfolio || portfolio.availableFunds < opportunity.requestedAmount}
                      >
                        Investir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Opportunity Details Modal */}
        {selectedOpportunity && (
          <OpportunityDetailsModal
            opportunity={selectedOpportunity}
            onClose={() => setSelectedOpportunity(null)}
            onCommitFunds={handleCommitFunds}
            availableFunds={portfolio?.availableFunds || 0}
          />
        )}
      </div>
    </div>
  )
}

interface OpportunityDetailsModalProps {
  opportunity: LoanOpportunity
  onClose: () => void
  onCommitFunds: (opportunityId: string, amount: number) => void
  availableFunds: number
}

function OpportunityDetailsModal({ 
  opportunity, 
  onClose, 
  onCommitFunds, 
  availableFunds 
}: OpportunityDetailsModalProps) {
  const [commitAmount, setCommitAmount] = useState(opportunity.requestedAmount)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{opportunity.farmerName}</CardTitle>
              <CardDescription>Détails de l'opportunité d'investissement</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Farmer Information */}
          <div>
            <h3 className="font-semibold mb-3">Informations sur l'Agriculteur</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nom:</span> {opportunity.farmerName}
              </div>
              <div>
                <span className="font-medium">Région:</span> {opportunity.region}
              </div>
              <div>
                <span className="font-medium">Score de Crédit:</span> {opportunity.riskAssessment.farmerCreditScore}/100
              </div>
              <div>
                <span className="font-medium">Expérience:</span> {opportunity.farmingExperience} ans
              </div>
            </div>
          </div>

          {/* Crop Information */}
          <div>
            <h3 className="font-semibold mb-3">Informations sur la Culture</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {opportunity.cropType}
              </div>
              <div>
                <span className="font-medium">Superficie:</span> {opportunity.farmSize} hectares
              </div>
              <div>
                <span className="font-medium">Rendement Historique:</span> {opportunity.riskAssessment.cropHistoricalYield} kg/ha
              </div>
              <div>
                <span className="font-medium">Volatilité des Prix:</span> {opportunity.riskAssessment.marketPriceVolatility}%
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div>
            <h3 className="font-semibold mb-3">Détails du Prêt</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Montant Demandé:</span> {opportunity.requestedAmount.toLocaleString()} USDC
              </div>
              <div>
                <span className="font-medium">Taux d'Intérêt:</span> {opportunity.interestRate}% APR
              </div>
              <div>
                <span className="font-medium">Durée:</span> {opportunity.termMonths} mois
              </div>
              <div>
                <span className="font-medium">Rendement Attendu:</span> {opportunity.expectedReturn.toLocaleString()} USDC
              </div>
            </div>
          </div>

          {/* Collateral Information */}
          <div>
            <h3 className="font-semibold mb-3">Informations sur le Collatéral</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Valeur du Collatéral:</span> {opportunity.collateralValue.toLocaleString()} USDC
              </div>
              <div>
                <span className="font-medium">Ratio de Collatéralisation:</span> {opportunity.collateralRatio}%
              </div>
              <div>
                <span className="font-medium">Type de Token:</span> MazaoToken
              </div>
              <div>
                <span className="font-medium">Date de Récolte:</span> {new Date(opportunity.harvestDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Investment Form */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Montant d'Investissement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Montant à investir (USDC)
                </label>
                <input
                  type="number"
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(Number(e.target.value))}
                  max={Math.min(opportunity.requestedAmount, availableFunds)}
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fonds disponibles: {availableFunds.toLocaleString()} USDC
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => onCommitFunds(opportunity.loanId, commitAmount)}
                  disabled={commitAmount > availableFunds || commitAmount <= 0}
                  className="flex-1"
                >
                  Confirmer l'Investissement
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}