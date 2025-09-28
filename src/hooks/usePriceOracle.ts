import { useState, useEffect, useCallback } from 'react'
import { priceOracleService } from '@/lib/services/price-oracle'
import type { CropPrice, PriceTrend, PriceHistory } from '@/types/price-oracle'
import { useAuth } from '@/hooks/useAuth'

export function usePriceOracle() {
  const [prices, setPrices] = useState<CropPrice[]>([])
  const [trends, setTrends] = useState<PriceTrend[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Load current prices
  const loadPrices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const currentPrices = await priceOracleService.getCurrentPrices()
      setPrices(currentPrices)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des prix')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load price trends
  const loadTrends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const allTrends = await priceOracleService.getAllPriceTrends()
      setTrends(allTrends)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tendances')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update price (admin/cooperative only)
  const updatePrice = useCallback(async (
    cropType: 'manioc' | 'cafe',
    newPrice: number,
    sourceReference?: string
  ) => {
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get current price for validation
      const currentPrice = await priceOracleService.getCurrentPrice(cropType)
      if (currentPrice) {
        const validation = priceOracleService.validatePriceUpdate(
          cropType,
          currentPrice.price,
          newPrice
        )
        
        if (!validation.valid) {
          throw new Error(validation.message)
        }
      }

      await priceOracleService.updatePrice(cropType, newPrice, user.id, sourceReference)
      
      // Reload data
      await Promise.all([loadPrices(), loadTrends()])
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du prix'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, loadPrices, loadTrends])

  // Get price history for a specific crop
  const getPriceHistory = useCallback(async (
    cropType: 'manioc' | 'cafe',
    limit?: number
  ): Promise<PriceHistory[]> => {
    try {
      return await priceOracleService.getPriceHistory(cropType, limit)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Get current price for a specific crop
  const getCurrentPrice = useCallback((cropType: 'manioc' | 'cafe'): CropPrice | undefined => {
    return prices.find(price => price.crop_type === cropType)
  }, [prices])

  // Get trend for a specific crop
  const getTrend = useCallback((cropType: 'manioc' | 'cafe'): PriceTrend | undefined => {
    return trends.find(trend => trend.crop_type === cropType)
  }, [trends])

  // Check if user can update prices
  const canUpdatePrices = useCallback(() => {
    if (!user) return false
    // Assuming user profile has role information
    return user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'cooperative'
  }, [user])

  // Initial load
  useEffect(() => {
    loadPrices()
    loadTrends()
  }, [loadPrices, loadTrends])

  return {
    prices,
    trends,
    loading,
    error,
    updatePrice,
    getPriceHistory,
    getCurrentPrice,
    getTrend,
    canUpdatePrices,
    refreshPrices: loadPrices,
    refreshTrends: loadTrends
  }
}