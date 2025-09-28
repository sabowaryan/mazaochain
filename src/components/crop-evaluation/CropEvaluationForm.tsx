'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CropEvaluationForm as CropEvaluationFormType, CROP_TYPES, DEFAULT_PRICES } from '@/types/crop-evaluation'
import type { Tables } from '@/lib/supabase/database.types'
import { CropEvaluationService } from '@/lib/services/crop-evaluation'
import { useAuth } from '@/hooks/useAuth'
import { PriceDisplay } from '@/components/price-oracle/PriceDisplay'
import { usePriceOracle } from '@/hooks/usePriceOracle'

interface CropEvaluationFormProps {
  onSuccess?: (evaluation: Tables<'crop_evaluations'>) => void
  onCancel?: () => void
}

export function CropEvaluationForm({ onSuccess, onCancel }: CropEvaluationFormProps) {
  const { user } = useAuth()
  const { getCurrentPrice } = usePriceOracle()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estimatedValue, setEstimatedValue] = useState(0)
  const [formData, setFormData] = useState<CropEvaluationFormType>({
    crop_type: 'manioc',
    superficie: 0,
    rendement_historique: 0,
    prix_reference: DEFAULT_PRICES.manioc
  })

  const cropEvaluationService = new CropEvaluationService()

  // Update estimated value when form data changes
  useEffect(() => {
    const calculateValue = async () => {
      try {
        const value = await cropEvaluationService.calculateValuation(formData)
        setEstimatedValue(value)
      } catch (error) {
        console.error('Error calculating valuation:', error)
        setEstimatedValue(0)
      }
    }
    calculateValue()
  }, [formData])

  const handleInputChange = (field: keyof CropEvaluationFormType, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-update price reference when crop type changes
      if (field === 'crop_type') {
        const currentPrice = getCurrentPrice(value as 'manioc' | 'cafe')
        updated.prix_reference = currentPrice?.price || DEFAULT_PRICES[value as keyof typeof DEFAULT_PRICES]
      }
      
      return updated
    })
    setError(null)
  }

  const useCurrentMarketPrice = () => {
    const currentPrice = getCurrentPrice(formData.crop_type)
    if (currentPrice) {
      setFormData(prev => ({ ...prev, prix_reference: currentPrice.price }))
    }
  }

  const validateForm = (): string | null => {
    if (formData.superficie <= 0) {
      return 'La superficie doit être supérieure à 0'
    }
    if (formData.rendement_historique <= 0) {
      return 'Le rendement historique doit être supérieur à 0'
    }
    if (formData.prix_reference <= 0) {
      return 'Le prix de référence doit être supérieur à 0'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Vous devez être connecté pour créer une évaluation')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const evaluation = await cropEvaluationService.createEvaluation(user.id, formData)
      onSuccess?.(evaluation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle Évaluation de Récolte</CardTitle>
        <CardDescription>
          Évaluez votre récolte future pour la tokenisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Crop Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-800">
              Type de culture *
            </label>
            <select
              value={formData.crop_type}
              onChange={(e) => handleInputChange('crop_type', e.target.value)}
              className="flex h-10 w-full rounded-md border border-primary-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              required
            >
              {Object.entries(CROP_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Superficie */}
          <Input
            label="Superficie (hectares) *"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.superficie || ''}
            onChange={(e) => handleInputChange('superficie', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 2.5"
            helperText="Superficie totale de votre exploitation en hectares"
            required
          />

          {/* Rendement Historique */}
          <Input
            label="Rendement historique (kg/hectare) *"
            type="number"
            step="1"
            min="1"
            value={formData.rendement_historique || ''}
            onChange={(e) => handleInputChange('rendement_historique', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 1500"
            helperText="Rendement moyen de vos récoltes précédentes par hectare"
            required
          />

          {/* Prix de Référence */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-primary-800">
                Prix de référence (USDC/kg) *
              </label>
              <button
                type="button"
                onClick={useCurrentMarketPrice}
                className="text-xs text-green-600 hover:text-green-700 underline"
              >
                Utiliser le prix du marché
              </button>
            </div>
            
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.prix_reference || ''}
              onChange={(e) => handleInputChange('prix_reference', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 0.50"
              required
            />
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Prix de marché actuel:</span>
              <PriceDisplay cropType={formData.crop_type} showTrend showLastUpdate />
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
            <h4 className="font-medium text-primary-900 mb-2">Aperçu du calcul</h4>
            <div className="space-y-1 text-sm text-primary-700">
              <p>Superficie: {formData.superficie} hectares</p>
              <p>Rendement: {formData.rendement_historique} kg/hectare</p>
              <p>Prix: {formData.prix_reference} USDC/kg</p>
              <div className="border-t border-primary-200 pt-2 mt-2">
                <p className="font-medium text-primary-900">
                  Valeur estimée: {estimatedValue.toFixed(2)} USDC
                </p>
                <p className="text-xs text-primary-600">
                  Calcul: {formData.superficie} × {formData.rendement_historique} × {formData.prix_reference}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={estimatedValue <= 0}
              className="flex-1"
            >
              {loading ? 'Création...' : 'Créer l&apos;évaluation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}