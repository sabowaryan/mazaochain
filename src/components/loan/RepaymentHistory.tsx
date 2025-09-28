'use client'

import { useState, useEffect } from 'react'
import { transactionReceiptService } from '@/lib/services/transaction-receipt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Tables } from '@/lib/supabase/database.types'

type Transaction = Tables<'transactions'>

interface RepaymentHistoryProps {
  loanId: string
  borrowerId: string
}

export function RepaymentHistory({ loanId, borrowerId }: RepaymentHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadRepaymentHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const loanTransactions = await transactionReceiptService.getLoanTransactions(loanId)
      
      // Filter for repayment and collateral release transactions
      const repaymentTransactions = loanTransactions.filter(tx => 
        tx.transaction_type === 'repayment' || tx.transaction_type === 'release'
      )
      
      setTransactions(repaymentTransactions)
    } catch (error) {
      console.error('Error loading repayment history:', error)
      setError('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRepaymentHistory()
  }, [loadRepaymentHistory, loanId])

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'repayment':
        return 'Remboursement'
      case 'release':
        return 'Libération Collatéral'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé'
      case 'pending':
        return 'En attente'
      case 'failed':
        return 'Échoué'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openHederaExplorer = (transactionId: string) => {
    if (transactionId) {
      const explorerUrl = process.env.NODE_ENV === 'production' 
        ? `https://hashscan.io/mainnet/transaction/${transactionId}`
        : `https://hashscan.io/testnet/transaction/${transactionId}`
      window.open(explorerUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Remboursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement de l'historique...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Remboursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur de chargement</h3>
            <p className="mt-1 text-gray-500">{error}</p>
            <div className="mt-6">
              <Button onClick={loadRepaymentHistory} variant="outline">
                Réessayer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Remboursements</CardTitle>
        <CardDescription>
          {transactions.length === 0 
            ? 'Aucune transaction de remboursement trouvée'
            : `${transactions.length} transaction${transactions.length > 1 ? 's' : ''} trouvée${transactions.length > 1 ? 's' : ''}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun remboursement</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune transaction de remboursement n'a encore été effectuée pour ce prêt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {getTransactionTypeText(transaction.transaction_type)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.created_at || '')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {transaction.amount.toFixed(2)} {transaction.token_type}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status || 'pending')}`}>
                      {getStatusText(transaction.status || 'pending')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">De</p>
                    <p className="font-mono text-xs break-all">
                      {transaction.from_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Vers</p>
                    <p className="font-mono text-xs break-all">
                      {transaction.to_address || 'N/A'}
                    </p>
                  </div>
                </div>

                {transaction.hedera_transaction_id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">ID Transaction Hedera</p>
                        <p className="font-mono text-xs text-gray-800">
                          {transaction.hedera_transaction_id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHederaExplorer(transaction.hedera_transaction_id!)}
                      >
                        Voir sur Hedera
                      </Button>
                    </div>
                  </div>
                )}


              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}