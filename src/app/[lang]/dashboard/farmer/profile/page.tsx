"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFarmerProfile, useUserStats } from "@/hooks/useProfile";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FarmerProfileForm } from "@/components/profiles/FarmerProfileForm";
import { ClientOnly } from "@/components/ClientOnly";
import { ModernPageHeader } from "@/components/ui/ModernPageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { InfoCard } from "@/components/ui/InfoCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  UserIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CogIcon,
  ChartBarIcon,
  SparklesIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  EyeIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';

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
  const params = useParams();
  const lang = params.lang as string;

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-7xl mx-auto">
        {/* En-tête moderne */}
        <ModernPageHeader
          title="Mon profil agriculteur"
          subtitle="Gérez vos informations personnelles et professionnelles"
          icon={<UserIcon />}
          subtitleIcon={<CogIcon />}
          gradient="emerald"
        />

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <StatCard
            title="Statut du profil"
            value={profile?.is_validated ? 'Validé' : 'En attente'}
            subtitle="Vérification complète"
            icon={profile?.is_validated ? (
              <CheckCircleIconSolid className="w-6 h-6 text-white" />
            ) : (
              <ExclamationTriangleIconSolid className="w-6 h-6 text-white" />
            )}
            accentIcon={<ShieldCheckIcon className="w-5 h-5" />}
            gradient={profile?.is_validated ? "emerald" : "amber"}
          />

          <StatCard
            title="Évaluations"
            value={statsLoading ? "..." : stats.evaluations || 0}
            subtitle="Cultures évaluées"
            icon={<ClipboardDocumentListIcon className="w-6 h-6 text-white" />}
            accentIcon={<ChartBarIcon className="w-5 h-5" />}
            gradient="emerald"
          />

          <StatCard
            title="Prêts actifs"
            value={statsLoading ? "..." : stats.activeLoans || 0}
            subtitle="En cours"
            icon={<BanknotesIcon className="w-6 h-6 text-white" />}
            accentIcon={<CurrencyDollarIcon className="w-5 h-5" />}
            gradient="amber"
          />

          <StatCard
            title="Tokens MAZAO"
            value={statsLoading ? "..." : stats.mazaoTokens?.toLocaleString() || 0}
            subtitle="Disponibles"
            icon={<SparklesIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<SparklesIcon className="w-5 h-5" />}
            gradient="purple"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Informations principales */}
          <div className="xl:col-span-2">
            <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Informations personnelles
                  </h3>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  disabled={false}
                  className="group"
                >
                  {isEditing ? (
                    <>
                      <XCircleIconSolid className="w-4 h-4 mr-2" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Modifier
                    </>
                  )}
                </Button>
              </div>

              {isEditing ? (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                  <FarmerProfileForm />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard
                      label="Nom complet"
                      value={farmerProfile?.nom || "Non renseigné"}
                      icon={<UserIcon />}
                    />

                    <InfoCard
                      label="Email"
                      value={user.email || "Non renseigné"}
                      icon={<EnvelopeIcon />}
                    />

                    <InfoCard
                      label="Superficie (hectares)"
                      value={farmerProfile?.superficie ? `${farmerProfile.superficie} ha` : "Non renseigné"}
                      icon={<HomeIcon />}
                    />

                    <InfoCard
                      label="Localisation"
                      value={farmerProfile?.localisation || "Non renseigné"}
                      icon={<MapPinIcon />}
                    />

                    <InfoCard
                      label="Type de culture principal"
                      value={farmerProfile?.crop_type || "Non renseigné"}
                      icon={<SparklesIcon />}
                    />

                    <InfoCard
                      label="Années d'expérience"
                      value={farmerProfile?.experience_annees ? `${farmerProfile.experience_annees} ans` : "Non renseigné"}
                      icon={<CalendarDaysIcon />}
                    />
                  </div>

                  {/* Wallet Address - Section spéciale */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <WalletIcon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-purple-900">
                        Adresse wallet Hedera
                      </h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {profile?.wallet_address || "Non configuré"}
                      </p>
                    </div>
                    {!profile?.wallet_address && (
                      <p className="text-sm text-purple-700 mt-2">
                        Connectez votre wallet pour activer toutes les fonctionnalités
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar avec informations et actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Statut de validation */}
            <Card className="p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Statut du compte</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Profil</span>
                  </div>
                  <StatusBadge
                    status={profile?.is_validated ? "success" : "warning"}
                    label={profile?.is_validated ? "Validé" : "En attente"}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </div>
                  <StatusBadge status="success" label="Vérifié" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <WalletIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Wallet</span>
                  </div>
                  <StatusBadge
                    status={profile?.wallet_address ? "success" : "error"}
                    label={profile?.wallet_address ? "Configuré" : "Non configuré"}
                  />
                </div>
              </div>
            </Card>

            {/* Informations du compte */}
            <Card className="p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <CalendarDaysIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Informations du compte</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">Membre depuis</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(profile?.created_at || "").toLocaleDateString("fr-FR", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">ID utilisateur</div>
                  <div className="text-sm font-mono text-gray-600 break-all">
                    {user.id}
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions rapides */}
            <Card className="p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <CogIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Actions rapides</h3>
              </div>
              <div className="space-y-3">
                <ActionButton
                  label="Nouvelle évaluation"
                  icon={<ClipboardDocumentListIcon />}
                  onClick={() => (window.location.href = `/${lang}/dashboard/farmer/evaluations`)}
                  variant="emerald"
                />
                <ActionButton
                  label="Demander un prêt"
                  icon={<BanknotesIcon />}
                  onClick={() => (window.location.href = `/${lang}/dashboard/farmer/loans`)}
                  variant="amber"
                />
                <ActionButton
                  label="Voir le dashboard"
                  icon={<ChartBarIcon />}
                  onClick={() => (window.location.href = `/${lang}/dashboard/farmer`)}
                  variant="emerald"
                />
                <ActionButton
                  label="Portfolio complet"
                  icon={<EyeIcon />}
                  onClick={() => (window.location.href = `/${lang}/dashboard/farmer/portfolio`)}
                  variant="amber"
                />
              </div>
            </Card>
          </div>
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
