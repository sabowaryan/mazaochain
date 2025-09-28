"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/components/TranslationProvider";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FarmerProfileForm } from "@/components/profiles/FarmerProfileForm";

export default function FarmerProfilePage() {
  const { user, profile } = useAuth();
  const t = useTranslations("farmer");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    // Logique de sauvegarde
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mon profil agriculteur
        </h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et professionnelles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Informations personnelles
              </h3>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                disabled={loading}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
            </div>

            {isEditing ? (
              <FarmerProfileForm
                onSuccess={() => {
                  setIsEditing(false);
                  // Recharger le profil
                  window.location.reload();
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Nom complet
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {profile?.farmer_profiles?.nom || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <p className="mt-1 text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Superficie (hectares)
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {profile?.farmer_profiles?.superficie || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Localisation
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {profile?.farmer_profiles?.localisation ||
                        "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Type de culture principal
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {profile?.farmer_profiles?.crop_type || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Années d'expérience
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {profile?.farmer_profiles?.experience_annees ||
                        "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Adresse wallet Hedera
                  </Label>
                  <p className="mt-1 text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                    {profile?.wallet_address || "Non configuré"}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar avec statistiques */}
        <div className="space-y-6">
          {/* Statut de validation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Statut du compte</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profil</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.is_validated
                      ? "bg-success-100 text-success-800"
                      : "bg-warning-100 text-warning-800"
                  }`}
                >
                  {profile?.is_validated ? "Validé" : "En attente"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  Vérifié
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wallet</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.wallet_address
                      ? "bg-success-100 text-success-800"
                      : "bg-error-100 text-error-800"
                  }`}
                >
                  {profile?.wallet_address ? "Configuré" : "Non configuré"}
                </span>
              </div>
            </div>
          </Card>

          {/* Statistiques rapides */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mes statistiques</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Évaluations</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prêts actifs</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tokens MAZAO</span>
                <span className="font-medium">12,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Membre depuis</span>
                <span className="font-medium">
                  {new Date(profile?.created_at || "").toLocaleDateString(
                    "fr-FR"
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions rapides */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  (window.location.href = "/fr/dashboard/farmer/evaluations")
                }
              >
                🌾 Nouvelle évaluation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  (window.location.href = "/fr/dashboard/farmer/loans")
                }
              >
                💰 Demander un prêt
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/fr/dashboard/farmer")}
              >
                📊 Voir le dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
