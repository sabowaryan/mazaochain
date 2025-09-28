'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CROP_TYPES } from '@/types/crop-evaluation'
import { PDFReportGenerator } from '@/lib/utils/pdf-generator'
import type { Tables } from '@/lib/supabase/database.types'

interface EvaluationDetailsProps {
  evaluation: Tables<'crop_evaluations'>
  farmerName?: string
  farmerLocation?: string
  onClose?: () => void
  showActions?: boolean
}

export function EvaluationDetails({ 
  evaluation, 
  farmerName, 
  farmerLocation, 
  onClose,
  showActions = true 
}: EvaluationDetailsProps) {
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const pdfGenerator = new PDFReportGenerator()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approuvé', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true)
      await pdfGenerator.generateAndDownloadPDF({
        evaluation,
        farmerName,
        farmerLocation
      })
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du rapport PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              Détails de l&apos;Évaluation
              {getStatusBadge(evaluation.status || 'pending')}
            </CardTitle>
            <CardDescription>
              ID: {evaluation.id}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} size="sm">
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Information */}
        <div>
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Informations Générales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="block text-sm font-medium text-gray-600 mb-1">
                Date de création
              </span>
              <span className="text-gray-900">
                {formatDate(evaluation.created_at)}
              </span>
            </div>
            {farmerName && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="block text-sm font-medium text-gray-600 mb-1">
                  Agriculteur
                </span>
                <span className="text-gray-900">{farmerName}</span>
              </div>
            )}
            {farmerLocation && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="block text-sm font-medium text-gray-600 mb-1">
                  Localisation
                </span>
                <span className="text-gray-900">{farmerLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Crop Details */}
        <div>
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Détails de la Récolte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-primary-50 rounded-lg">
              <span className="block text-sm font-medium text-primary-600 mb-1">
                Type de culture
              </span>
              <span className="text-primary-900 font-semibold">
                {CROP_TYPES[evaluation.crop_type as keyof typeof CROP_TYPES]}
              </span>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <span className="block text-sm font-medium text-primary-600 mb-1">
                Superficie
              </span>
              <span className="text-primary-900 font-semibold">
                {evaluation.superficie} hectares
              </span>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <span className="block text-sm font-medium text-primary-600 mb-1">
                Rendement historique
              </span>
              <span className="text-primary-900 font-semibold">
                {evaluation.rendement_historique} kg/ha
              </span>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <span className="block text-sm font-medium text-primary-600 mb-1">
                Prix de référence
              </span>
              <span className="text-primary-900 font-semibold">
                {evaluation.prix_reference} USDC/kg
              </span>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Calcul de la Valeur
          </h3>
          <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
            <div className="text-center">
              <div className="text-sm text-primary-600 mb-2">Formule de calcul:</div>
              <div className="font-mono text-sm bg-white px-4 py-2 rounded border mb-4">
                Superficie × Rendement × Prix de référence
              </div>
              <div className="font-mono text-sm bg-white px-4 py-2 rounded border mb-4">
                {evaluation.superficie} ha × {evaluation.rendement_historique} kg/ha × {evaluation.prix_reference} USDC/kg
              </div>
              <div className="text-2xl font-bold text-primary-900">
                Valeur estimée: {evaluation.valeur_estimee.toFixed(2)} USDC
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleGeneratePDF}
              loading={generatingPDF}
              variant="outline"
              className="flex-1"
            >
              {generatingPDF ? 'Génération...' : 'Télécharger le rapport PDF'}
            </Button>
            {onClose && (
              <Button onClick={onClose} className="flex-1">
                Fermer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}