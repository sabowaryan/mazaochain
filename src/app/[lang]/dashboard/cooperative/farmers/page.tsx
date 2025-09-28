import { PendingFarmersValidation } from '@/components/cooperative/PendingFarmersValidation'

export default function CooperativeFarmersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PendingFarmersValidation />
      </div>
    </div>
  )
}