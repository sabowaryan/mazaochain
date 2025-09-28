'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { RiskAssessment } from '@/types/lender'

interface RiskAssessmentDisplayProps {
  riskAssessment: RiskAssessment
  farmerName: string
  cropType: string
}

export function RiskAssessmentDisplay({ 
  riskAssessment, 
  farmerName, 
  cropType 
}: RiskAssessmentDisplayProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'Faible'
      case 'MEDIUM':
        return 'Moyen'
      case 'HIGH':
        return 'Élevé'
      default:
        return 'Non évalué'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Évaluation des Risques</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(riskAssessment.overallRisk)}`}>
            Risque {getRiskLabel(riskAssessment.overallRisk)}
          </span>
        </CardTitle>
        <CardDescription>
          Analyse détaillée des risques pour {farmerName} - {cropType}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credit Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Score de Crédit</span>
              <span className={`text-lg font-bold ${getScoreColor(riskAssessment.farmerCreditScore)}`}>
                {riskAssessment.farmerCreditScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  riskAssessment.farmerCreditScore >= 80 ? 'bg-green-500' :
                  riskAssessment.farmerCreditScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${riskAssessment.farmerCreditScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Basé sur l'historique de remboursement
            </p>
          </div>

          {/* Collateral Ratio */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ratio de Collatéralisation</span>
              <span className="text-lg font-bold text-blue-600">
                {riskAssessment.collateralizationRatio}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(riskAssessment.collateralizationRatio / 3, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Couverture du collatéral par rapport au prêt
            </p>
          </div>

          {/* Historical Yield */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rendement Historique</span>
              <span className="text-lg font-bold text-purple-600">
                {riskAssessment.cropHistoricalYield.toLocaleString()} kg/ha
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((riskAssessment.cropHistoricalYield / 2000) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Productivité moyenne des récoltes passées
            </p>
          </div>

          {/* Market Volatility */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Volatilité du Marché</span>
              <span className={`text-lg font-bold ${
                riskAssessment.marketPriceVolatility <= 10 ? 'text-green-600' :
                riskAssessment.marketPriceVolatility <= 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {riskAssessment.marketPriceVolatility}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  riskAssessment.marketPriceVolatility <= 10 ? 'bg-green-500' :
                  riskAssessment.marketPriceVolatility <= 20 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(riskAssessment.marketPriceVolatility * 2, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Fluctuation des prix du marché
            </p>
          </div>
        </div>

        {/* Risk Factors */}
        {riskAssessment.riskFactors && riskAssessment.riskFactors.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Facteurs de Risque Identifiés</h4>
            <div className="space-y-2">
              {riskAssessment.riskFactors.map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Summary */}
        <div className={`border rounded-lg p-4 ${getRiskColor(riskAssessment.overallRisk)}`}>
          <h4 className="font-medium mb-2">Résumé de l'Évaluation</h4>
          <p className="text-sm">
            {riskAssessment.overallRisk === 'LOW' && 
              "Ce prêt présente un risque faible avec un bon historique de crédit et un collatéral suffisant. Recommandé pour les investisseurs conservateurs."}
            {riskAssessment.overallRisk === 'MEDIUM' && 
              "Ce prêt présente un risque modéré. Le collatéral est adéquat mais certains facteurs nécessitent une attention particulière."}
            {riskAssessment.overallRisk === 'HIGH' && 
              "Ce prêt présente un risque élevé. Recommandé uniquement pour les investisseurs expérimentés acceptant des risques importants."}
          </p>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Recommandations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {riskAssessment.farmerCreditScore >= 80 && (
              <li>• Excellent historique de crédit - Investissement recommandé</li>
            )}
            {riskAssessment.collateralizationRatio >= 200 && (
              <li>• Collatéral suffisant pour couvrir les risques</li>
            )}
            {riskAssessment.cropHistoricalYield >= 1500 && (
              <li>• Bon rendement historique des cultures</li>
            )}
            {riskAssessment.marketPriceVolatility <= 15 && (
              <li>• Marché relativement stable</li>
            )}
            {riskAssessment.overallRisk === 'LOW' && (
              <li>• Diversification recommandée avec d'autres prêts similaires</li>
            )}
            {riskAssessment.overallRisk === 'MEDIUM' && (
              <li>• Surveillance régulière recommandée</li>
            )}
            {riskAssessment.overallRisk === 'HIGH' && (
              <li>• Considérer une réduction du montant d'investissement</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}