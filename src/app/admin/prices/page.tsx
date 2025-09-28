import { PriceManagement } from '@/components/price-oracle/PriceManagement'
import { PriceTrends } from '@/components/price-oracle/PriceTrends'

export default function AdminPricesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Prix</h1>
        <p className="text-gray-600 mt-2">
          Gérez les prix de référence des cultures et consultez les tendances du marché.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Management */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mise à Jour des Prix</h2>
          <PriceManagement />
        </div>

        {/* Price Trends */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tendances et Historique</h2>
          <PriceTrends />
        </div>
      </div>
    </div>
  )
}