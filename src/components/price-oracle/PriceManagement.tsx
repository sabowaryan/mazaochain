'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { usePriceOracle } from '@/hooks/usePriceOracle'
import { CROP_DISPLAY_NAMES } from '@/types/price-oracle'
import type { CropPrice } from '@/types/price-oracle'

interface PriceUpdateForm {
  crop_type: 'manioc' | 'cafe'
  price: string
  source_reference: string
}

export function PriceManagement() {
  const { prices, loading, error, updatePrice, canUpdatePrices } = usePriceOracle()
  const [updateForm, setUpdateForm] = useState<PriceUpdateForm>({
    crop_type: 'manioc',
    price: '',
    source_reference: ''
  })
  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)

  if (!canUpdatePrices()) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>Vous n'avez pas les permissions nécessaires pour gérer les prix.</p>
          <p className="text-sm mt-2">Seuls les administrateurs et coopératives peuvent mettre à jour les prix.</p>
        </div>
      </Card>
    )
  }

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const priceValue = parseFloat(updateForm.price)
    if (isNaN(priceValue) || priceValue <= 0) {
      return
    }

    try {
      setUpdating(true)
      setUpdateSuccess(null)
      
      await updatePrice(
        updateForm.crop_type,
        priceValue,
        updateForm.source_reference || undefined
      )
      
      setUpdateSuccess(`Prix du ${CROP_DISPLAY_NAMES[updateForm.crop_type]} mis à jour avec succès`)
      setUpdateForm(prev => ({ ...prev, price: '', source_reference: '' }))
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setUpdating(false)
    }
  }

  const getCurrentPrice = (cropType: 'manioc' | 'cafe'): CropPrice | undefined => {
    return prices.find(price => price.crop_type === cropType)
  }

  if (loading && prices.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des prix...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Prices Display */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Prix Actuels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['manioc', 'cafe'] as const).map(cropType => {
            const currentPrice = getCurrentPrice(cropType)
            return (
              <div key={cropType} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{CROP_DISPLAY_NAMES[cropType]}</h4>
                {currentPrice ? (
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-green-600">
                      {currentPrice.price.toFixed(4)} USDC/kg
                    </p>
                    <p className="text-sm text-gray-500">
                      Mis à jour: {new Date(currentPrice.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Source: {currentPrice.source}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">Prix non disponible</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Price Update Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mettre à Jour les Prix</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{updateSuccess}</p>
          </div>
        )}

        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <div>
            <Label htmlFor="crop_type">Type de Culture</Label>
            <select
              id="crop_type"
              value={updateForm.crop_type}
              onChange={(e) => setUpdateForm(prev => ({ 
                ...prev, 
                crop_type: e.target.value as 'manioc' | 'cafe' 
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="manioc">{CROP_DISPLAY_NAMES.manioc}</option>
              <option value="cafe">{CROP_DISPLAY_NAMES.cafe}</option>
            </select>
          </div>

          <div>
            <Label htmlFor="price">Nouveau Prix (USDC/kg)</Label>
            <Input
              id="price"
              type="number"
              step="0.0001"
              min="0.0001"
              max="100"
              value={updateForm.price}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.0000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Prix actuel: {getCurrentPrice(updateForm.crop_type)?.price.toFixed(4) || 'N/A'} USDC/kg
            </p>
          </div>

          <div>
            <Label htmlFor="source_reference">Référence Source (optionnel)</Label>
            <Input
              id="source_reference"
              type="text"
              value={updateForm.source_reference}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, source_reference: e.target.value }))}
              placeholder="Ex: Marché de Kinshasa, Rapport FAO, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              Indiquez la source de cette information de prix
            </p>
          </div>

          <button
            type="submit"
            disabled={updating || !updateForm.price}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Mise à jour...' : 'Mettre à Jour le Prix'}
          </button>
        </form>
      </Card>

      {/* Future Chainlink Integration Notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Intégration Oracle Future</h3>
        <p className="text-blue-700 text-sm">
          Dans une version future, les prix seront automatiquement mis à jour via des oracles Chainlink 
          pour une plus grande précision et décentralisation. Actuellement, les prix sont gérés manuellement 
          par les administrateurs et coopératives.
        </p>
      </Card>
    </div>
  )
}