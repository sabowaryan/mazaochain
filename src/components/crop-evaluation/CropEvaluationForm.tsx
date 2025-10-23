"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  CropEvaluationForm as CropEvaluationFormType,
  CROP_TYPES,
  DEFAULT_PRICES,
} from "@/types/crop-evaluation";
import type { Tables } from "@/lib/supabase/database.types";
import { CropEvaluationService } from "@/lib/services/crop-evaluation";
import { useAuth } from "@/hooks/useAuth";
import { PriceDisplay } from "@/components/price-oracle/PriceDisplay";
import { usePriceOracle } from "@/hooks/usePriceOracle";
import {
  SparklesIcon,
  HomeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';

interface CropEvaluationFormProps {
  onSuccess?: (evaluation: Tables<"crop_evaluations">) => void;
  onCancel?: () => void;
}

export function CropEvaluationForm({
  onSuccess,
  onCancel,
}: CropEvaluationFormProps) {
  const { user } = useAuth();
  const { getCurrentPrice } = usePriceOracle();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [formData, setFormData] = useState<CropEvaluationFormType>({
    crop_type: "manioc",
    superficie: 0,
    rendement_historique: 0,
    prix_reference: DEFAULT_PRICES.manioc,
  });

  const cropEvaluationService = new CropEvaluationService();

  // Update estimated value when form data changes
  useEffect(() => {
    const calculateValue = async () => {
      try {
        const value = await cropEvaluationService.calculateValuation(formData);
        setEstimatedValue(value);
      } catch (error) {
        console.error("Error calculating valuation:", error);
        setEstimatedValue(0);
      }
    };
    calculateValue();
  }, [cropEvaluationService, formData]);

  const handleInputChange = (
    field: keyof CropEvaluationFormType,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-update price reference when crop type changes
      if (field === "crop_type") {
        const currentPrice = getCurrentPrice(value as "manioc" | "cafe");
        updated.prix_reference =
          currentPrice?.price ||
          DEFAULT_PRICES[value as keyof typeof DEFAULT_PRICES];
      }

      return updated;
    });
    setError(null);
  };

  const useCurrentMarketPrice = () => {
    const currentPrice = getCurrentPrice(formData.crop_type);
    if (currentPrice) {
      setFormData((prev) => ({ ...prev, prix_reference: currentPrice.price }));
    }
  };

  const validateForm = (): string | null => {
    if (formData.superficie <= 0) {
      return "La superficie doit être supérieure à 0";
    }
    if (formData.rendement_historique <= 0) {
      return "Le rendement historique doit être supérieur à 0";
    }
    if (formData.prix_reference <= 0) {
      return "Le prix de référence doit être supérieur à 0";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Vous devez être connecté pour créer une évaluation");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = await cropEvaluationService.createEvaluation(
        user.id,
        formData
      );
      onSuccess?.(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du formulaire */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
          <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Nouvelle Évaluation de Récolte</h3>
          <p className="text-sm text-gray-600">Évaluez votre récolte future pour la tokenisation</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Crop Type Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <SparklesIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Type de culture *
              </label>
            </div>
            <select
              value={formData.crop_type}
              onChange={(e) => handleInputChange("crop_type", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              required
            >
              {Object.entries(CROP_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {value === 'manioc' ? '🌿' : '☕'} {label}
                </option>
              ))}
            </select>
          </div>

          {/* Superficie */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <HomeIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Superficie (hectares) *
              </label>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.superficie || ""}
              onChange={(e) =>
                handleInputChange("superficie", parseFloat(e.target.value) || 0)
              }
              placeholder="Ex: 2.5"
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Superficie totale de votre exploitation en hectares</p>
          </div>

          {/* Rendement Historique */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                Rendement historique (kg/hectare) *
              </label>
            </div>
            <Input
              type="number"
              step="1"
              min="1"
              value={formData.rendement_historique || ""}
              onChange={(e) =>
                handleInputChange(
                  "rendement_historique",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="Ex: 1500"
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Rendement moyen de vos récoltes précédentes par hectare</p>
          </div>

          {/* Prix de Référence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Prix de référence (USDC/kg) *
                </label>
              </div>
              <button
                type="button"
                onClick={useCurrentMarketPrice}
                className="text-xs text-primary-600 hover:text-primary-700 underline font-medium"
              >
                📈 Utiliser le prix du marché
              </button>
            </div>

            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.prix_reference || ""}
              onChange={(e) =>
                handleInputChange(
                  "prix_reference",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="Ex: 0.50"
              className="w-full"
              required
            />

            <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  💹 Prix de marché actuel:
                </span>
                <PriceDisplay
                  cropType={formData.crop_type}
                  showTrend
                  className="text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary-500 rounded-lg">
                <CalculatorIcon className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-primary-900">
                💰 Aperçu du calcul
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-white/70 rounded-lg">
                <p className="text-sm font-medium text-primary-700">🏞️ Superficie</p>
                <p className="text-lg font-bold text-primary-900">{formData.superficie} ha</p>
              </div>
              <div className="p-3 bg-white/70 rounded-lg">
                <p className="text-sm font-medium text-primary-700">📊 Rendement</p>
                <p className="text-lg font-bold text-primary-900">{formData.rendement_historique} kg/ha</p>
              </div>
              <div className="p-3 bg-white/70 rounded-lg">
                <p className="text-sm font-medium text-primary-700">💵 Prix</p>
                <p className="text-lg font-bold text-primary-900">{formData.prix_reference} USDC/kg</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-lg border-2 border-secondary-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-700">🎯 Valeur estimée totale</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {estimatedValue.toFixed(2)} USDC
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary-600 font-mono">
                    {formData.superficie} × {formData.rendement_historique} × {formData.prix_reference}
                  </p>
                  <p className="text-xs text-secondary-600">
                    = {(formData.superficie * formData.rendement_historique).toFixed(0)} kg × {formData.prix_reference} USDC
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="sm:w-auto"
                >
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                disabled={estimatedValue <= 0}
                className="flex-1 group bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircleIconSolid className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Créer l&apos;évaluation</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
