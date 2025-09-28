'use client'

import { useAuth } from '@/hooks/useAuth'
import { LoanDashboard } from '@/components/loan/LoanDashboard'
import { LoanApprovalList } from '@/components/cooperative/LoanApprovalList'

export default function CooperativeLoansPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'cooperative') {
    return (
      <div className="text-center p-8">
        <p>Accès non autorisé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900">Gestion des Prêts</h1>
          <p className="mt-2 text-primary-700">Approuver et suivre les demandes de prêt des agriculteurs</p>
        </div>

        <div className="space-y-8">
          {/* Pending Loan Approvals */}
          <LoanApprovalList />

          {/* All Loans Dashboard */}
          <LoanDashboard />
        </div>
      </div>
    </div>
  )
}