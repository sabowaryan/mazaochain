import { LenderPortfolio } from '@/components/lender/LenderPortfolio'
import { RequireAuth } from '@/components/auth/AuthGuard'

export const metadata = {
  title: 'Mon Portfolio | MazaoChain',
  description: 'Suivez vos investissements et rendements dans l\'agriculture décentralisée'
}

export default function LenderPortfolioPage() {
  return (
    <RequireAuth requiredRoles={['preteur', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <LenderPortfolio />
      </div>
    </RequireAuth>
  )
}