"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFarmerProfile, useUserStats } from "@/hooks/useProfile";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FarmerProfileForm } from "@/components/profiles/FarmerProfileForm";
import { ClientOnly } from "@/components/ClientOnly";

function FarmerProfileContent() {
  const { user, profile, loading: authLoading, initialized } = useAuth();
  const {
    profileData: farmerProfile,
    loading: profileLoading,
    error,
    refreshProfile,
  } = useFarmerProfile();
  const { stats, loading: statsLoading } = useUserStats();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show loading while authentication is initializing or profile data is loading
  if (!initialized || authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600">
            Veuillez vous connecter pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  // Show error if user is not a farmer
  if (profile?.role !== "agriculteur") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès restreint
          </h2>
          <p className="text-gray-600">
            Cette page est réservée aux agriculteurs.
          </p>
        </div>
      </div>
    );
  }

  // Show error message if there&apos;s an error loading profile
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshProfile}>Réessayer</Button>
        </div>
      </div>
    );
  }

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
              <div>
                <FarmerProfileForm />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Nom complet
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {farmerProfile?.nom || "Non renseigné"}
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
                      {farmerProfile?.superficie || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Localisation
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {farmerProfile?.localisation || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Type de culture principal
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {farmerProfile?.crop_type || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Années d&apos;expérience
                    </Label>
                    <p className="mt-1 text-gray-900">
                      {farmerProfile?.experience_annees || "Non renseigné"}
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
                <span className="font-medium">
                  {statsLoading ? "..." : stats.evaluations || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prêts actifs</span>
                <span className="font-medium">
                  {statsLoading ? "..." : stats.activeLoans || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tokens MAZAO</span>
                <span className="font-medium">
                  {statsLoading
                    ? "..."
                    : stats.mazaoTokens?.toLocaleString() || 0}
                </span>
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

export default function FarmerProfilePage() {
  return (
    <ClientOnly fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
      <FarmerProfileContent />
    </ClientOnly>
  );
}
