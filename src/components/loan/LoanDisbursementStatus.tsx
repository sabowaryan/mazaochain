'use client'

import { useState, useEffect } from 'react'
import { loanService } from '@/lib/services/loan'
import { Card } from '@/components/ui/Card'

interface LoanDisbursementStatusProps {
  loanId: string
  onRetry?: () => void
}

interface TransactionStatus {
  disbursement?: { status: string; transactionId?: string }
  escrow?: { status: string; transactionId?: string }
  repayment?: { status: string; transactionId?: string }
  collateralRelease?: { status: string; transactionId?: string }
}

export function LoanDisbursementStatus({ loanId, onRetry }: LoanDisbursementStatusProps) {
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({})
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    loadTransactionStatus()
  }, [loanId])

  const loadTransactionStatus = async () => {
    try {
      setLoading(true)
      const status = await loanService.getLoanTransactionStatus(loanId)
      setTransactionStatus(status)
    } catch (error) {
      console.error('Error loading transaction status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetryDisbursement = async () => {
    try {
      setRetrying(true)
      const result = await loanService.retryFailedDisbursement(loanId)
      
      if (result.success) {
        // Reload status after successful retry
        await loadTransactionStatus()
        onRetry?.()
      } else {
        alert(`Échec de la nouvelle tentative: ${result.error}`)
      }
    } catch (error) {
      console.error('Error retrying disbursement:', error)
      alert('Erreur lors de la nouvelle tentative')
    } finally {
      setRetrying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-green-500">✓</span>
      case 'pending':
        return <span className="text-yellow-500">⏳</span>
      case 'failed':
        return <span className="text-red-500">✗</span>
      default:
        return <span className="text-gray-400">-</span>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé'
      case 'pending':
        return 'En attente'
      case 'failed':
        return 'Échec'
      default:
        return 'Non démarré'
    }
  }

  const formatTransactionId = (txId?: string) => {
    if (!txId) return 'N/A'
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    )
  }

  const hasFailedTransactions = Object.values(transactionStatus).some(
    tx => tx?.status === 'failed'
  )

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Statut des Transactions
        </h3>
        {hasFailedTransactions && (
          <button
            onClick={handleRetryDisbursement}
            disabled={retrying}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? 'Nouvelle tentative...' : 'Réessayer'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Escrow Status */}
        {transactionStatus.escrow && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transactionStatus.escrow.status)}
              <div>
                <p className="font-medium text-gray-900">Mise en Séquestre du Collatéral</p>
                <p className="text-sm text-gray-500">
                  Statut: {getStatusText(transactionStatus.escrow.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-xs font-mono text-gray-700">
                {formatTransactionId(transactionStatus.escrow.transactionId)}
              </p>
            </div>
          </div>
        )}

        {/* Disbursement Status */}
        {transactionStatus.disbursement && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transactionStatus.disbursement.status)}
              <div>
                <p className="font-medium text-gray-900">Décaissement USDC</p>
                <p className="text-sm text-gray-500">
                  Statut: {getStatusText(transactionStatus.disbursement.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-xs font-mono text-gray-700">
                {formatTransactionId(transactionStatus.disbursement.transactionId)}
              </p>
            </div>
          </div>
        )}

        {/* Repayment Status */}
        {transactionStatus.repayment && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transactionStatus.repayment.status)}
              <div>
                <p className="font-medium text-gray-900">Remboursement USDC</p>
                <p className="text-sm text-gray-500">
                  Statut: {getStatusText(transactionStatus.repayment.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-xs font-mono text-gray-700">
                {formatTransactionId(transactionStatus.repayment.transactionId)}
              </p>
            </div>
          </div>
        )}

        {/* Collateral Release Status */}
        {transactionStatus.collateralRelease && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transactionStatus.collateralRelease.status)}
              <div>
                <p className="font-medium text-gray-900">Libération du Collatéral</p>
                <p className="text-sm text-gray-500">
                  Statut: {getStatusText(transactionStatus.collateralRelease.status)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-xs font-mono text-gray-700">
                {formatTransactionId(transactionStatus.collateralRelease.transactionId)}
              </p>
            </div>
          </div>
        )}

        {/* No transactions found */}
        {Object.keys(transactionStatus).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune transaction trouvée pour ce prêt</p>
          </div>
        )}
      </div>

      {/* Transaction Flow Indicator */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Flux de Transaction</h4>
        <div className="flex items-center space-x-2 text-sm">
          <span className={`px-2 py-1 rounded ${
            transactionStatus.escrow?.status === 'confirmed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            1. Séquestre
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded ${
            transactionStatus.disbursement?.status === 'confirmed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            2. Décaissement
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded ${
            transactionStatus.repayment?.status === 'confirmed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            3. Remboursement
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-1 rounded ${
            transactionStatus.collateralRelease?.status === 'confirmed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            4. Libération
          </span>
        </div>
      </div>
    </Card>
  )
}