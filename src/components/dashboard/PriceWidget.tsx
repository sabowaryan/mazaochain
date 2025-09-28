'use client'

import { Card } from '@/components/ui/Card'
import { PriceComparison } from '@/components/price-oracle/PriceDisplay'

export function PriceWidget() {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Prix du Marché</h3>
      <PriceComparison />
      <div className="mt-3 text-xs text-gray-500">
        Prix de référence pour les évaluations de récolte
      </div>
    </Card>
  )
}