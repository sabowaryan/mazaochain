import { LenderInvestmentDashboard } from '@/components/lender/LenderInvestmentDashboard'
import { RequireAuth } from '@/components/auth/AuthGuard'

export const metadata = {
  title: 'Opportunités d\'Investissement | MazaoChain',
  description: 'Découvrez les opportunités d\'investissement disponibles dans l\'agriculture décentralisée'
}

export default function LenderOpportunitiesPage() {
  return (
    <RequireAuth requiredRoles={['preteur', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <LenderInvestmentDashboard />
      </div>
    </RequireAuth>
  )
}