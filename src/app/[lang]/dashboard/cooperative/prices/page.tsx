import { PriceManagement } from '@/components/price-oracle/PriceManagement'
import { PriceTrends } from '@/components/price-oracle/PriceTrends'

export default function CooperativePricesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Prix du Marché</h1>
        <p className="text-gray-600 mt-2">
          Consultez et mettez à jour les prix de référence des cultures pour les évaluations.
        </p>
      </div>

      <div className="space-y-8">
        {/* Price Trends First for Cooperatives */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tendances du Marché</h2>
          <PriceTrends />
        </div>

        {/* Price Management */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Gestion des Prix</h2>
          <PriceManagement />
        </div>
      </div>
    </div>
  )
}