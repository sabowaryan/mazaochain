"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/components/TranslationProvider";
import { useMazaoContracts } from "@/hooks/useMazaoContracts";
import { useWallet } from "@/hooks/useWallet";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { QuickActions } from "@/components/dashboard/QuickActions";

interface FarmerStats {
  totalCropValue: number;
  activeLoans: number;
  pendingEvaluations: number;
  mazaoTokens: number;
}

export default function FarmerDashboard() {
  const { user, profile } = useAuth();
  const t = useTranslations("farmer");
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const { getFarmerTotalBalance, loading: contractsLoading } =
    useMazaoContracts();
  const { isConnected } = useWallet();

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

        // Vérifier le cache de session pour éviter les requêtes multiples
        const cacheKey = `farmer_data_${user.id}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();
        
        // Utiliser le cache s'il a moins de 30 secondes
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 30000) {
          const { evaluations, loans } = JSON.parse(cachedData);
          
          // Calculer les statistiques depuis le cache
          const totalCropValue = evaluations
            .filter((e: { status: string }) => e.status === "approved")
            .reduce(
              (sum: number, e: { valeur_estimee?: number }) =>
                sum + (e.valeur_estimee || 0),
              0
            );

          const activeLoansCount = loans.filter(
            (l: { status: string }) => l.status === "active"
          ).length;
          const pendingEvaluationsCount = evaluations.filter(
            (e: { status: string }) => e.status === "pending"
          ).length;

          setStats({
            totalCropValue,
            activeLoans: activeLoansCount,
            pendingEvaluations: pendingEvaluationsCount,
            mazaoTokens: 0, // Sera chargé depuis la blockchain
          });
          
          setIsLoading(false);
          return;
        }

        // Charger les données depuis Supabase
        const [evaluationsRes, loansRes] = await Promise.all([
          fetch(`/api/crop-evaluations?farmer_id=${user.id}`),
          fetch(`/api/loans?borrower_id=${user.id}`),
        ]);

        const evaluationsData = await evaluationsRes.json();
        const loansData = await loansRes.json();

        // Extraire les données du format API standardisé {data: [...], message, timestamp}
        const evaluations = Array.isArray(evaluationsData?.data)
          ? evaluationsData.data
          : Array.isArray(evaluationsData)
          ? evaluationsData
          : [];
        const loans = Array.isArray(loansData?.data)
          ? loansData.data
          : Array.isArray(loansData)
          ? loansData
          : [];

        // Mettre en cache les données
        sessionStorage.setItem(cacheKey, JSON.stringify({ evaluations, loans }));
        sessionStorage.setItem(`${cacheKey}_time`, now.toString());

        // Charger le solde de tokens MAZAO depuis le contrat avec timeout
        let mazaoBalance = 0;
        if (profile.wallet_address) {
          try {
            const balancePromise = getFarmerTotalBalance(
              profile.wallet_address
            );
            const timeoutPromise = new Promise<number>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 3000)
            );
            mazaoBalance = (await Promise.race([
              balancePromise,
              timeoutPromise,
            ])) as number;
          } catch (error) {
            console.warn("Erreur lors du chargement du solde MAZAO:", error);
          }
        }

        // Calculer les statistiques
        const totalCropValue = evaluations
          .filter((e: { status: string }) => e.status === "approved")
          .reduce(
            (sum: number, e: { valeur_estimee?: number }) =>
              sum + (e.valeur_estimee || 0),
            0
          );

        const activeLoansCount = loans.filter(
          (l: { status: string }) => l.status === "active"
        ).length;
        const pendingEvaluationsCount = evaluations.filter(
          (e: { status: string }) => e.status === "pending"
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
  }, [user?.id, profile, getFarmerTotalBalance]);

  if (isLoading || contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bienvenue, {profile?.farmer_profiles?.nom || user?.email}
          </p>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-6 sm:mb-8">
            <WalletConnection showBalances={false} />
          </div>
        )}

        {/* Wallet Balance */}
        {isConnected && (
          <div className="mb-6 sm:mb-8">
            <WalletBalance />
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                  {t("dashboard.cropValue")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-primary-600 truncate">
                  ${stats.totalCropValue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-primary-100 rounded-full flex-shrink-0 ml-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                  {t("dashboard.activeLoans")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-secondary-600">
                  {stats.activeLoans}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-secondary-100 rounded-full flex-shrink-0 ml-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-600"
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

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                  {t("dashboard.pendingEvaluations")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-warning-600">
                  {stats.pendingEvaluations}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-warning-100 rounded-full flex-shrink-0 ml-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                  Tokens MAZAO
                </p>
                <p className="text-xl sm:text-2xl font-bold text-success-600 truncate">
                  {stats.mazaoTokens.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-success-100 rounded-full flex-shrink-0 ml-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-success-600"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <QuickActions />

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-gray-700"
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
              <h3 className="text-base sm:text-lg font-semibold">
                Activité récente
              </h3>
            </div>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                <span className="flex-1 truncate">
                  Évaluation manioc approuvée
                </span>
                <span className="text-success-600 font-medium ml-2 flex-shrink-0">
                  +12,000 MAZAO
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                <span className="flex-1 truncate">Prêt de 5,000 USDC reçu</span>
                <span className="text-primary-600 font-medium ml-2 flex-shrink-0">
                  Actif
                </span>
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded transition-colors">
                <span className="flex-1 truncate">
                  Évaluation café en attente
                </span>
                <span className="text-warning-600 font-medium ml-2 flex-shrink-0">
                  En cours
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/${lang}/dashboard/farmer/portfolio`)
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Voir tout le portfolio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
