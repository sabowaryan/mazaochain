'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CropEvaluationService } from '@/lib/services/crop-evaluation'
import { CROP_TYPES } from '@/types/crop-evaluation'
import type { Tables } from '@/lib/supabase/database.types'

interface EvaluationHistoryProps {
  farmerId: string
  onViewDetails?: (evaluation: Tables<'crop_evaluations'>) => void
}

export function EvaluationHistory({ farmerId, onViewDetails }: EvaluationHistoryProps) {
  const [evaluations, setEvaluations] = useState<Tables<'crop_evaluations'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cropEvaluationService = new CropEvaluationService()

  useEffect(() => {
    loadEvaluations()
  }, [farmerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      const data = await cropEvaluationService.getFarmerEvaluations(farmerId)
      // S'assurer que data est un tableau
      const evaluationsArray = Array.isArray(data) ? data : []
      if (!Array.isArray(data)) {
        console.warn('Evaluations data is not an array:', data)
      }
      setEvaluations(evaluationsArray)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      setEvaluations([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approuvé', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Chargement des évaluations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={loadEvaluations} className="mt-2" variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Évaluations</CardTitle>
        <CardDescription>
          Toutes vos évaluations de récoltes passées et en cours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!Array.isArray(evaluations) || evaluations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune évaluation
            </h3>
            <p className="text-gray-500">
              Vous n&apos;avez pas encore créé d&apos;évaluation de récolte.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {CROP_TYPES[evaluation.crop_type as keyof typeof CROP_TYPES]}
                      </h4>
                      {getStatusBadge(evaluation.status || 'pending')}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Superficie:</span>
                        <br />
                        {evaluation.superficie} ha
                      </div>
                      <div>
                        <span className="font-medium">Rendement:</span>
                        <br />
                        {evaluation.rendement_historique} kg/ha
                      </div>
                      <div>
                        <span className="font-medium">Prix:</span>
                        <br />
                        {evaluation.prix_reference} USDC/kg
                      </div>
                      <div>
                        <span className="font-medium">Valeur estimée:</span>
                        <br />
                        <span className="text-primary-600 font-semibold">
                          {evaluation.valeur_estimee.toFixed(2)} USDC
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Créé le {formatDate(evaluation.created_at || '')}
                    </p>
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails?.(evaluation)}
                    >
                      Détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}