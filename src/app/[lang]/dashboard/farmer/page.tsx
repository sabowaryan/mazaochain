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
import {
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import {
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  SparklesIcon as SparklesIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { SparklesIcon } from "@heroicons/react/16/solid";
import { ClipboardDocumentListIcon } from "@heroicons/react/16/solid";

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* En-tête moderne */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <HomeIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  Tableau de bord
                </h1>
                <div className="flex items-center space-x-2 text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <p className="text-sm sm:text-base">
                    Bienvenue, {profile?.farmer_profiles?.nom || user?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Wallet Connection avec design amélioré */}
        {!isConnected && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-800">
                    Connexion wallet requise
                  </h3>
                </div>
                <p className="text-amber-700 mb-4">
                  Connectez votre wallet pour accéder à toutes les fonctionnalités de la plateforme.
                </p>
                <WalletConnection showBalances={false} />
              </div>
            </Card>
          </div>
        )}

        {/* Wallet Balance avec design amélioré */}
        {isConnected && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircleIconSolid className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-emerald-800">
                    Wallet connecté
                  </h3>
                </div>
                <WalletBalance />
              </div>
            </Card>
          </div>
        )}

        {/* Statistiques modernes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          {/* Valeur des récoltes */}
          <Card className="group farmer-stat-card relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CurrencyDollarIconSolid className="w-6 h-6 text-white" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">
                  Valeur des récoltes
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-emerald-900">
                  ${stats.totalCropValue.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Récoltes approuvées
                </p>
              </div>
            </div>
          </Card>

          {/* Prêts actifs */}
          <Card className="group farmer-stat-card relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BanknotesIconSolid className="w-6 h-6 text-white" />
                </div>
                <ChartBarIcon className="w-5 h-5 text-blue-600 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Prêts actifs
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-900">
                  {stats.activeLoans}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  En cours de remboursement
                </p>
              </div>
            </div>
          </Card>

          {/* Évaluations en attente */}
          <Card className="group farmer-stat-card relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
                <ClockIcon className="w-5 h-5 text-amber-600 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">
                  Évaluations en attente
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-amber-900">
                  {stats.pendingEvaluations}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  En cours de validation
                </p>
              </div>
            </div>
          </Card>

          {/* Tokens MAZAO */}
          <Card className="group farmer-stat-card relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <SparklesIconSolid className="w-6 h-6 text-white" />
                </div>
                <SparklesIcon className="w-5 h-5 text-purple-600 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">
                  Tokens MAZAO
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-purple-900">
                  {stats.mazaoTokens.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Tokens disponibles
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Section principale avec actions et activité */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Actions rapides - Composant réutilisable */}
          <div className="xl:col-span-2">
            <QuickActions />
          </div>

          {/* Activité récente - Version améliorée */}
          <div className="xl:col-span-1">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Activité récente</h3>
              </div>

              <div className="space-y-4">
                {/* Activité 1 */}
                <div className="activity-item flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-200">
                  <div className="p-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Évaluation manioc approuvée
                    </p>
                    <p className="text-xs text-gray-600">Il y a 2 heures</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">
                      +12,000 MAZAO
                    </p>
                  </div>
                </div>

                {/* Activité 2 */}
                <div className="activity-item flex items-start space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                  <div className="p-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-0.5">
                    <BanknotesIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Prêt de 5,000 USDC reçu
                    </p>
                    <p className="text-xs text-gray-600">Hier</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      Actif
                    </p>
                  </div>
                </div>

                {/* Activité 3 */}
                <div className="activity-item flex items-start space-x-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200">
                  <div className="p-1.5 bg-amber-500 rounded-full flex-shrink-0 mt-0.5">
                    <ClockIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Évaluation café en attente
                    </p>
                    <p className="text-xs text-gray-600">Il y a 3 jours</p>
                    <p className="text-sm font-semibold text-amber-600 mt-1">
                      En cours
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton voir plus */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="w-full group hover:bg-gray-50"
                  onClick={() => router.push(`/${lang}/dashboard/farmer/portfolio`)}
                >
                  <EyeIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Voir tout le portfolio
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
