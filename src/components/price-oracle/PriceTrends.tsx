'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { usePriceOracle } from '@/hooks/usePriceOracle'
import { CROP_DISPLAY_NAMES } from '@/types/price-oracle'
import type { PriceTrend, PriceHistory } from '@/types/price-oracle'

interface TrendIconProps {
  direction: 'up' | 'down' | 'stable'
  changePercent?: number
}

function TrendIcon({ direction, changePercent }: TrendIconProps) {
  const getColor = () => {
    switch (direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getIcon = () => {
    switch (direction) {
      case 'up': return '↗'
      case 'down': return '↘'
      default: return '→'
    }
  }

  return (
    <div className={`flex items-center ${getColor()}`}>
      <span className="text-xl mr-1">{getIcon()}</span>
      {changePercent !== undefined && (
        <span className="text-sm font-medium">
          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

interface PriceHistoryChartProps {
  history: PriceHistory[]
  cropType: 'manioc' | 'cafe'
}

function PriceHistoryChart({ history, cropType }: PriceHistoryChartProps) {
  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p>Aucun historique disponible</p>
      </div>
    )
  }

  // Simple text-based chart for now (could be enhanced with a charting library)
  const maxPrice = Math.max(...history.map(h => h.price))
  const minPrice = Math.min(...history.map(h => h.price))
  const priceRange = maxPrice - minPrice

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Historique des Prix (10 dernières entrées)</h4>
      <div className="space-y-1">
        {history.slice(0, 10).map((entry, index) => {
          const relativeHeight = priceRange > 0 ? ((entry.price - minPrice) / priceRange) * 100 : 50
          return (
            <div key={entry.id} className="flex items-center space-x-2 text-sm">
              <span className="w-20 text-gray-500">
                {new Date(entry.recorded_at).toLocaleDateString('fr-FR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.max(relativeHeight, 5)}%` }}
                />
              </div>
              <span className="w-16 text-right font-medium">
                {entry.price.toFixed(4)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Min: {minPrice.toFixed(4)} USDC</span>
        <span>Max: {maxPrice.toFixed(4)} USDC</span>
      </div>
    </div>
  )
}

export function PriceTrends() {
  const { trends, loading, error, refreshTrends } = usePriceOracle()
  const [selectedCrop, setSelectedCrop] = useState<'manioc' | 'cafe' | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadPriceHistory = async (cropType: 'manioc' | 'cafe') => {
    try {
      setLoadingHistory(true)
      const { priceOracleService } = await import('@/lib/services/price-oracle')
      const history = await priceOracleService.getPriceHistory(cropType, 30)
      setPriceHistory(history)
    } catch (err) {
      console.error('Error loading price history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (selectedCrop) {
      loadPriceHistory(selectedCrop)
    }
  }, [selectedCrop])

  if (loading && trends.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des tendances...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Erreur lors du chargement des tendances</p>
          <button 
            onClick={refreshTrends}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trends Overview */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tendances des Prix</h3>
          <button
            onClick={refreshTrends}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Actualiser
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trends.map(trend => (
            <div 
              key={trend.crop_type}
              className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedCrop(
                selectedCrop === trend.crop_type ? null : trend.crop_type
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">
                  {CROP_DISPLAY_NAMES[trend.crop_type]}
                </h4>
                <TrendIcon 
                  direction={trend.trend_direction} 
                  changePercent={trend.change_percent}
                />
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">
                  {trend.current_price.toFixed(4)} USDC/kg
                </p>
                
                {trend.previous_price && (
                  <p className="text-sm text-gray-500">
                    Précédent: {trend.previous_price.toFixed(4)} USDC/kg
                  </p>
                )}
                
                <p className="text-xs text-gray-400">
                  {trend.price_history.length} entrées dans l'historique
                </p>
              </div>
              
              <div className="mt-2 text-xs text-blue-600">
                {selectedCrop === trend.crop_type ? 'Cliquer pour masquer' : 'Cliquer pour voir l\'historique'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Price History */}
      {selectedCrop && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Historique - {CROP_DISPLAY_NAMES[selectedCrop]}
            </h3>
            <button
              onClick={() => setSelectedCrop(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Fermer
            </button>
          </div>
          
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement de l'historique...</p>
            </div>
          ) : (
            <PriceHistoryChart history={priceHistory} cropType={selectedCrop} />
          )}
        </Card>
      )}

      {/* Market Insights */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Aperçu du Marché</h3>
        <div className="space-y-2 text-sm text-blue-800">
          {trends.map(trend => (
            <div key={trend.crop_type} className="flex justify-between">
              <span>{CROP_DISPLAY_NAMES[trend.crop_type]}:</span>
              <span>
                {trend.trend_direction === 'up' && 'Tendance haussière'}
                {trend.trend_direction === 'down' && 'Tendance baissière'}
                {trend.trend_direction === 'stable' && 'Prix stable'}
                {trend.change_percent && ` (${trend.change_percent > 0 ? '+' : ''}${trend.change_percent.toFixed(1)}%)`}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-3">
          Les tendances sont calculées sur la base des 10 dernières mises à jour de prix.
        </p>
      </Card>
    </div>
  )
}