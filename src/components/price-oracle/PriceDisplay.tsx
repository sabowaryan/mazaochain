'use client'

import { usePriceOracle } from '@/hooks/usePriceOracle'
import { CROP_DISPLAY_NAMES } from '@/types/price-oracle'

interface PriceDisplayProps {
  cropType: 'manioc' | 'cafe'
  showTrend?: boolean
  showLastUpdate?: boolean
  className?: string
}

export function PriceDisplay({ 
  cropType, 
  showTrend = false, 
  showLastUpdate = false,
  className = '' 
}: PriceDisplayProps) {
  const { getCurrentPrice, getTrend, loading } = usePriceOracle()
  
  const currentPrice = getCurrentPrice(cropType)
  const trend = getTrend(cropType)

  if (loading && !currentPrice) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    )
  }

  if (!currentPrice) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Prix non disponible
      </div>
    )
  }

  const getTrendColor = () => {
    if (!trend || !showTrend) return ''
    switch (trend.trend_direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = () => {
    if (!trend || !showTrend) return null
    switch (trend.trend_direction) {
      case 'up': return '↗'
      case 'down': return '↘'
      default: return '→'
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <span className="font-semibold">
          {currentPrice.price.toFixed(4)} USDC/kg
        </span>
        
        {showTrend && trend && (
          <span className={`text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            {trend.change_percent !== undefined && (
              <span className="ml-1">
                {trend.change_percent > 0 ? '+' : ''}{trend.change_percent.toFixed(1)}%
              </span>
            )}
          </span>
        )}
      </div>
      
      {showLastUpdate && (
        <div className="text-xs text-gray-500 mt-1">
          Mis à jour: {new Date(currentPrice.updated_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  )
}

interface PriceComparisonProps {
  className?: string
}

export function PriceComparison({ className = '' }: PriceComparisonProps) {
  const { prices, loading } = usePriceOracle()

  if (loading && prices.length === 0) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {(['manioc', 'cafe'] as const).map(cropType => (
        <div key={cropType} className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {CROP_DISPLAY_NAMES[cropType]}:
          </span>
          <PriceDisplay cropType={cropType} showTrend />
        </div>
      ))}
    </div>
  )
}