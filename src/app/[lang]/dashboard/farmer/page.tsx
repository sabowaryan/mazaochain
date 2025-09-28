"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/components/TranslationProvider";
import { useMazaoContracts } from "@/hooks/useMazaoContracts";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface FarmerStats {
  totalCropValue: number;
  activeLoans: number;
  pendingEvaluations: number;
  mazaoTokens: number;
}

export default function FarmerDashboard() {
  const { user, profile } = useAuth();
  const t = useTranslations("farmer");
  const {
    getTokenBalance,
    getLoanDetails,
    isLoading: contractsLoading,
  } = useMazaoContracts();

  const [stats, setStats] = useState<FarmerStats>({
    totalCropValue: 0,
    activeLoans: 0,
    pendingEvaluations: 0,
    mazaoTokens: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFarmerData = async () => {
      if (!user?.id || !profile) return;

      try {
        setIsLoading(true);

        // Charger les données depuis Supabase
        const [evaluationsRes, loansRes] = await Promise.all([
          fetch(`/api/crop-evaluations?farmer_id=${user.id}`),
          fetch(`/api/loans?borrower_id=${user.id}`),
        ]);

        const evaluations = await evaluationsRes.json();
        const loans = await loansRes.json();

        // Charger le solde de tokens MAZAO depuis le contrat
        let mazaoBalance = 0;
        if (profile.wallet_address) {
          try {
            mazaoBalance = await getTokenBalance(profile.wallet_address);
          } catch (error) {
            console.warn("Erreur lors du chargement du solde MAZAO:", error);
          }
        }

        // Calculer les statistiques
        const totalCropValue = evaluations
          .filter((e: any) => e.status === "approved")
          .reduce((sum: number, e: any) => sum + (e.valeur_estimee || 0), 0);

        const activeLoansCount = loans.filter(
          (l: any) => l.status === "active"
        ).length;
        const pendingEvaluationsCount = evaluations.filter(
          (e: unknown) => e.status === "pending"
        ).length;

        setStats({
          totalCropValue,
          activeLoans: activeLoansCount,
          pendingEvaluations: pendingEvaluationsCount,
          mazaoTokens: mazaoBalance,
        });
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données agriculteur:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFarmerData();
  }, [user?.id, profile, getTokenBalance]);

  if (isLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-600">
          {t("dashboard.welcome", {
            name: profile?.farmer_profiles?.nom || user?.email,
          })}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("dashboard.cropValue")}
              </p>
              <p className="text-2xl font-bold text-primary-600">
                ${stats.totalCropValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("dashboard.activeLoans")}
              </p>
              <p className="text-2xl font-bold text-secondary-600">
                {stats.activeLoans}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-full">
              <svg
                className="w-6 h-6 text-secondary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("dashboard.pendingEvaluations")}
              </p>
              <p className="text-2xl font-bold text-warning-600">
                {stats.pendingEvaluations}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <svg
                className="w-6 h-6 text-warning-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tokens MAZAO</p>
              <p className="text-2xl font-bold text-success-600">
                {stats.mazaoTokens.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <svg
                className="w-6 h-6 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() =>
                (window.location.href = "/fr/dashboard/farmer/evaluations")
              }
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <span className="text-2xl">🌾</span>
              <span className="text-sm font-medium">Évaluations</span>
            </Button>
            <Button
              onClick={() =>
                (window.location.href = "/fr/dashboard/farmer/loans")
              }
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <span className="text-2xl">💰</span>
              <span className="text-sm font-medium">Prêts</span>
            </Button>
            <Button
              onClick={() =>
                (window.location.href = "/fr/dashboard/farmer/portfolio")
              }
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <span className="text-2xl">📊</span>
              <span className="text-sm font-medium">Portfolio</span>
            </Button>
            <Button
              onClick={() =>
                (window.location.href = "/fr/dashboard/farmer/profile")
              }
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <span className="text-2xl">👤</span>
              <span className="text-sm font-medium">Profil</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span>Évaluation manioc approuvée</span>
              <span className="text-success-600">+12,000 MAZAO</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span>Prêt de 5,000 USDC reçu</span>
              <span className="text-primary-600">Actif</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Évaluation café en attente</span>
              <span className="text-warning-600">En cours</span>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                (window.location.href = "/fr/dashboard/farmer/portfolio")
              }
            >
              Voir tout le portfolio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
