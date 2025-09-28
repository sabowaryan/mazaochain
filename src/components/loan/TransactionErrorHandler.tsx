'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface TransactionError {
  type: 'network' | 'insufficient_funds' | 'contract' | 'validation' | 'timeout' | 'unknown'
  message: string
  transactionId?: string
  details?: string
  retryable: boolean
}

interface TransactionErrorHandlerProps {
  error: TransactionError
  onRetry?: () => Promise<void>
  onCancel?: () => void
}

export function TransactionErrorHandler({ error, onRetry, onCancel }: TransactionErrorHandlerProps) {
  const [retrying, setRetrying] = useState(false)

  const getErrorIcon = (type: TransactionError['type']) => {
    switch (type) {
      case 'network':
        return '🌐'
      case 'insufficient_funds':
        return '💰'
      case 'contract':
        return '📄'
      case 'validation':
        return '⚠️'
      case 'timeout':
        return '⏰'
      default:
        return '❌'
    }
  }

  const getErrorTitle = (type: TransactionError['type']) => {
    switch (type) {
      case 'network':
        return 'Erreur de Réseau'
      case 'insufficient_funds':
        return 'Fonds Insuffisants'
      case 'contract':
        return 'Erreur de Contrat'
      case 'validation':
        return 'Erreur de Validation'
      case 'timeout':
        return 'Délai d\'Attente Dépassé'
      default:
        return 'Erreur de Transaction'
    }
  }

  const getErrorDescription = (type: TransactionError['type']) => {
    switch (type) {
      case 'network':
        return 'Problème de connexion au réseau Hedera. Vérifiez votre connexion internet et réessayez.'
      case 'insufficient_funds':
        return 'Solde insuffisant pour effectuer cette transaction. Vérifiez votre portefeuille.'
      case 'contract':
        return 'Erreur lors de l\'exécution du contrat intelligent. Contactez le support si le problème persiste.'
      case 'validation':
        return 'Les données de la transaction ne sont pas valides. Vérifiez les informations saisies.'
      case 'timeout':
        return 'La transaction a pris trop de temps à se confirmer. Elle peut encore être en cours de traitement.'
      default:
        return 'Une erreur inattendue s\'est produite lors de la transaction.'
    }
  }

  const getSuggestedActions = (type: TransactionError['type']) => {
    switch (type) {
      case 'network':
        return [
          'Vérifiez votre connexion internet',
          'Attendez quelques minutes et réessayez',
          'Contactez le support si le problème persiste'
        ]
      case 'insufficient_funds':
        return [
          'Vérifiez le solde de votre portefeuille',
          'Ajoutez des fonds si nécessaire',
          'Réduisez le montant de la transaction'
        ]
      case 'contract':
        return [
          'Vérifiez que votre portefeuille est connecté',
          'Assurez-vous que les tokens sont associés',
          'Contactez le support technique'
        ]
      case 'validation':
        return [
          'Vérifiez les informations saisies',
          'Assurez-vous que le collatéral est suffisant',
          'Rafraîchissez la page et réessayez'
        ]
      case 'timeout':
        return [
          'Vérifiez l\'état de la transaction sur Hedera',
          'Attendez quelques minutes avant de réessayer',
          'Contactez le support si nécessaire'
        ]
      default:
        return [
          'Rafraîchissez la page et réessayez',
          'Vérifiez votre connexion',
          'Contactez le support si le problème persiste'
        ]
    }
  }

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return

    try {
      setRetrying(true)
      await onRetry()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex items-start space-x-4">
        <div className="text-2xl">{getErrorIcon(error.type)}</div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {getErrorTitle(error.type)}
          </h3>
          
          <p className="text-red-800 mb-4">
            {getErrorDescription(error.type)}
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Détails de l'Erreur</h4>
            <p className="text-sm text-gray-700 mb-2">{error.message}</p>
            
            {error.transactionId && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Transaction ID:</span> {error.transactionId}
              </div>
            )}
            
            {error.details && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Détails techniques
                </summary>
                <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                  {error.details}
                </pre>
              </details>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Actions Suggérées</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {getSuggestedActions(error.type).map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-center space-x-3">
            {error.retryable && onRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retrying ? 'Nouvelle tentative...' : 'Réessayer'}
              </button>
            )}
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Annuler
              </button>
            )}
            
            <a
              href="https://hashscan.io/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Vérifier sur Hedera Explorer
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Helper function to create error objects
export function createTransactionError(
  type: TransactionError['type'],
  message: string,
  options?: {
    transactionId?: string
    details?: string
    retryable?: boolean
  }
): TransactionError {
  return {
    type,
    message,
    transactionId: options?.transactionId,
    details: options?.details,
    retryable: options?.retryable ?? true
  }
}

// Common error creators
export const TransactionErrors = {
  networkError: (message: string, details?: string) =>
    createTransactionError('network', message, { details, retryable: true }),
    
  insufficientFunds: (message: string, transactionId?: string) =>
    createTransactionError('insufficient_funds', message, { transactionId, retryable: false }),
    
  contractError: (message: string, details?: string) =>
    createTransactionError('contract', message, { details, retryable: true }),
    
  validationError: (message: string, details?: string) =>
    createTransactionError('validation', message, { details, retryable: false }),
    
  timeoutError: (message: string, transactionId?: string) =>
    createTransactionError('timeout', message, { transactionId, retryable: true }),
    
  unknownError: (message: string, details?: string) =>
    createTransactionError('unknown', message, { details, retryable: true })
}