"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFarmerProfile, useUserStats } from "@/hooks/useProfile";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FarmerProfileForm } from "@/components/profiles/FarmerProfileForm";
import { ClientOnly } from "@/components/ClientOnly";
import { useWallet } from "@/hooks/useWallet";
import {
  UserIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  SparklesIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  WalletIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  HomeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

function FarmerProfileContent() {
  const { user, profile, loading: authLoading, initialized, refreshProfile } = useAuth();
  const { profileData: farmerProfile, loading: profileLoading, error, refreshProfile: refreshFarmerProfile } = useFarmerProfile();
  const { stats, loading: statsLoading } = useUserStats();
  const { isConnected, isConnecting, connection, connectWallet, disconnectWallet, error: walletError } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;

  if (!initialized || authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Veuillez vous connecter pour accéder à cette page.</p>
      </div>
    );
  }

  if (profile?.role !== "agriculteur") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cette page est réservée aux agriculteurs.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={refreshFarmerProfile} size="sm">Réessayer</Button>
      </div>
    );
  }

  const walletAddress = connection?.accountId ?? profile?.wallet_address;
  const isValidated = !!profile?.is_validated;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles et agricoles</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isValidated ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {isValidated ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ExclamationCircleIcon className="h-3.5 w-3.5" />}
          {isValidated ? "Profil validé" : "En attente de validation"}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Évaluations", value: statsLoading ? "…" : stats.evaluations ?? 0, icon: ClipboardDocumentListIcon, color: "text-emerald-600 bg-emerald-50" },
          { label: "Prêts actifs", value: statsLoading ? "…" : stats.activeLoans ?? 0, icon: BanknotesIcon, color: "text-amber-600 bg-amber-50" },
          { label: "Tokens MAZAO", value: statsLoading ? "…" : (stats.mazaoTokens ?? 0).toLocaleString(), icon: SparklesIcon, color: "text-purple-600 bg-purple-50" },
          { label: "Statut", value: isValidated ? "Validé" : "En attente", icon: ShieldCheckIcon, color: isValidated ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Main info card */}
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-base font-semibold text-gray-900">Informations personnelles</h2>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              size="sm"
            >
              {isEditing ? (
                <><XMarkIcon className="h-4 w-4 mr-1.5" />Annuler</>
              ) : (
                <><PencilIcon className="h-4 w-4 mr-1.5" />Modifier</>
              )}
            </Button>
          </div>

          <div className="p-6">
            {isEditing ? (
              <FarmerProfileForm />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Nom complet", value: farmerProfile?.nom, icon: UserIcon },
                    { label: "Email", value: user.email, icon: EnvelopeIcon },
                    { label: "Superficie", value: farmerProfile?.superficie ? `${farmerProfile.superficie} ha` : null, icon: HomeIcon },
                    { label: "Localisation", value: farmerProfile?.localisation, icon: MapPinIcon },
                    { label: "Type de culture", value: farmerProfile?.crop_type, icon: SparklesIcon },
                    { label: "Expérience", value: farmerProfile?.experience_annees ? `${farmerProfile.experience_annees} ans` : null, icon: CalendarDaysIcon },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{value || "Non renseigné"}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Wallet section */}
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <WalletIcon className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-purple-900">Portefeuille Hedera</h3>
                  </div>
                  <p className="mb-3 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-mono text-gray-700 break-all">
                    {walletAddress || "Non configuré"}
                  </p>
                  <ClientOnly>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={async () => { await disconnectWallet(); await refreshProfile(); }}
                      >
                        Déconnecter le portefeuille
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={async () => { await connectWallet("hedera"); await refreshProfile(); }}
                        disabled={isConnecting}
                      >
                        {isConnecting ? "Connexion…" : "Connecter le portefeuille"}
                      </Button>
                    )}
                    {walletError && <p className="mt-2 text-xs text-red-600">{walletError}</p>}
                  </ClientOnly>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Account status */}
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Statut du compte</h2>
            </div>
            <div className="divide-y divide-gray-100 px-5">
              {[
                { label: "Profil", ok: isValidated, yes: "Validé", no: "En attente" },
                { label: "Email", ok: true, yes: "Vérifié", no: "Non vérifié" },
                { label: "Portefeuille", ok: isConnected || !!profile?.wallet_address, yes: "Configuré", no: "Non configuré" },
              ].map(({ label, ok, yes, no }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ok ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {ok ? <CheckCircleIcon className="h-3 w-3" /> : <ExclamationCircleIcon className="h-3 w-3" />}
                    {ok ? yes : no}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Informations du compte</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Membre depuis</p>
                <p className="text-sm font-medium text-gray-900">{memberSince}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Identifiant</p>
                <p className="text-xs font-mono text-gray-600 break-all">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Actions rapides</h2>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: "Nouvelle évaluation", icon: ClipboardDocumentListIcon, path: `/${lang}/dashboard/farmer/evaluations` },
                { label: "Demander un prêt", icon: BanknotesIcon, path: `/${lang}/dashboard/farmer/loans` },
                { label: "Tableau de bord", icon: ChartBarIcon, path: `/${lang}/dashboard/farmer` },
                { label: "Portfolio", icon: EyeIcon, path: `/${lang}/dashboard/farmer/portfolio` },
              ].map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  onClick={() => router.push(path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FarmerProfilePage() {
  return (
    <ClientOnly fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    }>
      <FarmerProfileContent />
    </ClientOnly>
  );
}
