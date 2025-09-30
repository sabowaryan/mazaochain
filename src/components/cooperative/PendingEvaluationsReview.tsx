"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CropEvaluationService } from "@/lib/services/crop-evaluation";
import { EvaluationDetails } from "@/components/crop-evaluation/EvaluationDetails";
import { CROP_TYPES } from "@/types/crop-evaluation";
import type { Tables } from "@/lib/supabase/database.types";
import { useMazaoContracts } from "@/hooks/useMazaoContracts";

interface PendingEvaluationsReviewProps {
  cooperativeId: string;
}

export function PendingEvaluationsReview({
  cooperativeId,
}: PendingEvaluationsReviewProps) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<unknown | null>(
    null
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const cropEvaluationService = new CropEvaluationService();
  const { tokenizeEvaluation, loading: contractsLoading } = useMazaoContracts();

  useEffect(() => {
    loadPendingEvaluations();
  }, []);

  const loadPendingEvaluations = async () => {
    try {
      setLoading(true);
      const data = await cropEvaluationService.getPendingEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvaluation = async (evaluationId: string) => {
    try {
      setProcessingId(evaluationId);
      
      // Trouver l'évaluation à approuver
      const evaluation = evaluations.find(e => e.id === evaluationId);
      if (!evaluation) {
        throw new Error("Évaluation non trouvée");
      }

      // Tokeniser l'évaluation approuvée
      const tokenizationResult = await tokenizeEvaluation(
        evaluationId,
        evaluation.crop_type,
        evaluation.farmer_id,
        evaluation.farmer?.wallet_address || '',
        evaluation.valeur_estimee,
        new Date(evaluation.harvest_date).getTime()
      );

      if (!tokenizationResult.success) {
        throw new Error(tokenizationResult.error || "Erreur lors de la tokenisation");
      }

      // Mettre à jour le statut dans la base de données
      await cropEvaluationService.updateEvaluationStatus(
        evaluationId,
        "approved"
      );

      // Remove from pending list
      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation.id !== evaluationId)
      );
      setSelectedEvaluation(null);

      alert(`Évaluation approuvée et ${evaluation.valeur_estimee} tokens MAZAO créés avec succès!`);
    } catch (err) {
      console.error('Erreur lors de l\'approbation:', err);
      alert(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEvaluation = async (evaluationId: string) => {
    const reason = prompt("Raison du rejet (optionnel):");

    try {
      setProcessingId(evaluationId);
      await cropEvaluationService.updateEvaluationStatus(
        evaluationId,
        "rejected"
      );

      // Remove from pending list
      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation.id !== evaluationId)
      );
      setSelectedEvaluation(null);

      // TODO: Send notification to farmer with reason
      alert("Évaluation rejetée");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (selectedEvaluation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Révision de l'évaluation</h3>
          <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>
            Retour à la liste
          </Button>
        </div>

        {selectedEvaluation && (
          <EvaluationDetails
            evaluation={selectedEvaluation as any}
            farmerName={(selectedEvaluation as any).farmer?.nom}
            farmerLocation={(selectedEvaluation as any).farmer?.localisation}
            showActions={false}
          />
        )}

        {selectedEvaluation && (
          <div className="flex gap-3 justify-center">
            <Button
              variant="destructive"
              onClick={() => handleRejectEvaluation((selectedEvaluation as any).id)}
              loading={processingId === (selectedEvaluation as any).id}
              disabled={processingId !== null}
            >
              Rejeter
            </Button>
            <Button
              onClick={() => handleApproveEvaluation((selectedEvaluation as any).id)}
              loading={processingId === (selectedEvaluation as any).id || contractsLoading}
              disabled={processingId !== null || contractsLoading}
            >
              Approuver
            </Button>
          </div>
        )}
      </div>
    );
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
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button
              onClick={loadPendingEvaluations}
              className="mt-2"
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évaluations en Attente</CardTitle>
        <CardDescription>
          Évaluations de récoltes soumises par les agriculteurs nécessitant
          votre approbation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune évaluation en attente
            </h3>
            <p className="text-gray-500">
              Toutes les évaluations ont été traitées.
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
                        {
                          CROP_TYPES[
                            evaluation.crop_type as keyof typeof CROP_TYPES
                          ]
                        }
                      </h4>
                      <span className="text-sm text-gray-500">
                        par {evaluation.farmer?.nom || "Agriculteur"}
                      </span>
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

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Soumis le {formatDate(evaluation.created_at)}</span>
                      {evaluation.farmer?.localisation && (
                        <span>• {evaluation.farmer.localisation}</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvaluation(evaluation)}
                    >
                      Examiner
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
