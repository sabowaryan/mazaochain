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
import { notificationService } from "@/lib/services/notification";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      setError(null);
      const data = await cropEvaluationService.getPendingEvaluations(
        cooperativeId
      );
      setEvaluations(data);
    } catch (err) {
      console.error('Error loading pending evaluations:', err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvaluation = async (evaluationId: string) => {
    try {
      setProcessingId(evaluationId);

      // Trouver l'évaluation à approuver
      const evaluation = evaluations.find((e) => e.id === evaluationId);
      if (!evaluation) {
        throw new Error("Évaluation non trouvée");
      }

      // Vérifier que le fermier a une adresse wallet
      if (!evaluation.farmer?.wallet_address) {
        throw new Error("Le fermier n'a pas d'adresse wallet configurée");
      }

      // Tokeniser l'évaluation approuvée via le hook (qui appelle l'API Route)
      const tokenizationResult = await tokenizeEvaluation(
        evaluationId,
        evaluation.crop_type,
        evaluation.farmer_id,
        evaluation.farmer.wallet_address,
        evaluation.valeur_estimee,
        new Date(evaluation.harvest_date).getTime()
      );

      if (!tokenizationResult.success) {
        throw new Error(
          tokenizationResult.error || "Erreur lors de la tokenisation"
        );
      }

      // Remove from pending list
      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation.id !== evaluationId)
      );
      setSelectedEvaluation(null);

      // Success notification
      setSuccessMessage(
        `Évaluation approuvée et ${evaluation.valeur_estimee} tokens MAZAO créés avec succès!`
      );
      setError(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Erreur lors de l'approbation:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
      setSuccessMessage(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEvaluation = async (evaluationId: string) => {
    const reason = prompt("Raison du rejet (optionnel):");

    try {
      setProcessingId(evaluationId);

      // Trouver l'évaluation à rejeter
      const evaluation = evaluations.find((e) => e.id === evaluationId);
      if (!evaluation) {
        throw new Error("Évaluation non trouvée");
      }

      await cropEvaluationService.updateEvaluationStatus(
        evaluationId,
        "rejected"
      );

      // Envoyer une notification à l'agriculteur
      try {
        await notificationService.sendNotification({
          userId: evaluation.farmer_id,
          type: "evaluation_rejected",
          title: "Évaluation Rejetée",
          message: `Votre évaluation de ${
            CROP_TYPES[evaluation.crop_type as keyof typeof CROP_TYPES]
          } a été rejetée.${reason ? ` Raison: ${reason}` : ""}`,
          data: {
            evaluationId,
            cropType: evaluation.crop_type,
            reason: reason || undefined,
            actionUrl: `/dashboard/farmer/evaluations`,
          },
          channels: ["in_app", "email"],
        });
      } catch (notifError) {
        console.error("Erreur lors de l'envoi de la notification:", notifError);
        // Ne pas bloquer le processus si la notification échoue
      }

      // Remove from pending list
      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation.id !== evaluationId)
      );
      setSelectedEvaluation(null);

      // Success notification
      setSuccessMessage("Évaluation rejetée avec succès");
      setError(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du rejet");
      setSuccessMessage(null);
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
          <Button variant="outline" onClick={() => {
            setSelectedEvaluation(null);
            setError(null);
          }}>
            Retour à la liste
          </Button>
        </div>

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto flex-shrink-0 text-green-400 hover:text-green-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

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
              onClick={() =>
                handleRejectEvaluation((selectedEvaluation as any).id)
              }
              loading={
                processingId === (selectedEvaluation as any).id ||
                contractsLoading
              }
              disabled={processingId !== null || contractsLoading}
            >
              Rejeter
            </Button>
            <Button
              onClick={() =>
                handleApproveEvaluation((selectedEvaluation as any).id)
              }
              loading={
                processingId === (selectedEvaluation as any).id ||
                contractsLoading
              }
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
