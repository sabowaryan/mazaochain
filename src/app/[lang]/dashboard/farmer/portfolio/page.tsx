'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMazaoContracts, type TokenHolding } from '@/hooks/useMazaoContracts';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BeakerIcon,
  CakeIcon,
  SparklesIcon,
  CubeIcon,
  PlusIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';



export default function FarmerPortfolioPage() {
  const { user, profile } = useAuth();
  const { getFarmerTotalBalance, getFarmerTokenHoldings } = useMazaoContracts();

  const [totalBalance, setTotalBalance] = useState(0);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'tokens' | 'history'>('overview');

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Charger les données réelles du portfolio
        if (profile?.wallet_address) {
          try {
            // Charger le solde total avec timeout
            const balancePromise = getFarmerTotalBalance(profile.wallet_address);
            const timeoutPromise = new Promise<number>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const balance = await Promise.race([balancePromise, timeoutPromise]);
            setTotalBalance(balance as number);

            // Charger les holdings de tokens réels
            const holdings = await getFarmerTokenHoldings(profile.wallet_address);
            setTokenHoldings(holdings);

          } catch (error) {
            console.warn('Could not fetch data from blockchain:', error);
            // Utiliser des données par défaut si la blockchain n'est pas accessible
            setTotalBalance(0);
            setTokenHoldings([]);
          }
        } else {
          // Pas d'adresse wallet, portfolio vide
          setTotalBalance(0);
          setTokenHoldings([]);
        }

      } catch (error) {
        console.error('Erreur lors du chargement du portfolio:', error);
        setTotalBalance(0);
        setTokenHoldings([]);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [user?.id, profile?.wallet_address, getFarmerTotalBalance, getFarmerTokenHoldings]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalValue = tokenHoldings.reduce((sum, holding) => sum + holding.estimatedValue, 0);

  const getCropIcon = (cropType: string) => {
    const iconMap = {
      manioc: BeakerIcon,
      cafe: CakeIcon,
      cacao: SparklesIcon,
      mais: CubeIcon,
      riz: BeakerIcon
    };
    return iconMap[cropType as keyof typeof iconMap] || CubeIcon;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'harvested':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ChartBarIconSolid className="w-8 h-8 text-emerald-600" />
            Portfolio MAZAO
          </h1>
          <p className="text-gray-600">
            Gérez vos tokens de cultures et suivez leur performance
          </p>
        </div>
      </div>

      {/* Navigation des vues */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: ChartBarIcon, solidIcon: ChartBarIconSolid },
          { id: 'tokens', label: 'Mes Tokens', icon: CurrencyDollarIcon, solidIcon: CurrencyDollarIconSolid },
          { id: 'history', label: 'Historique', icon: ClipboardDocumentListIcon, solidIcon: ClipboardDocumentListIconSolid }
        ].map((view) => {
          const isActive = selectedView === view.id;
          const IconComponent = isActive ? view.solidIcon : view.icon;

          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white/50'
                }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}
      </div>

      {/* Résumé du portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total tokens MAZAO
              </p>
              <p className="text-2xl font-bold text-primary-600">
                {totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Valeur estimée
              </p>
              <p className="text-2xl font-bold text-success-600">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <ChartBarIcon className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Types de cultures
              </p>
              <p className="text-2xl font-bold text-secondary-600">
                {tokenHoldings.length}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-full">
              <CubeIcon className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des holdings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mes tokens de cultures</h3>

        {tokenHoldings.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <CubeIcon className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">
              Aucun token MAZAO dans votre portfolio
            </p>
            <Button onClick={() => window.location.href = '/fr/dashboard/farmer/evaluations'}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Commencer une évaluation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tokenHoldings.map((holding) => {
              const CropIcon = getCropIcon(holding.cropType);
              return (
                <div key={holding.tokenId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <CropIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{holding.cropType}</h4>
                        <p className="text-sm text-gray-600">Token ID: {holding.tokenId}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{holding.amount.toLocaleString()} MAZAO</p>
                          <p className="text-sm text-gray-600">${holding.estimatedValue.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(holding.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${holding.status === 'active'
                            ? 'bg-success-100 text-success-800'
                            : holding.status === 'harvested'
                              ? 'bg-primary-100 text-primary-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {holding.status === 'active' ? 'Actif' :
                              holding.status === 'harvested' ? 'Récolté' : 'Expiré'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Récolte prévue: {new Date(holding.harvestDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Actions disponibles */}
      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/fr/dashboard/farmer/loans'}
            >
              <LockClosedIcon className="w-8 h-8 text-primary-600" />
              <div className="text-center">
                <p className="font-medium">Utiliser comme garantie</p>
                <p className="text-sm text-gray-600">Demander un prêt</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/fr/dashboard/farmer/evaluations'}
            >
              <PlusIcon className="w-8 h-8 text-success-600" />
              <div className="text-center">
                <p className="font-medium">Nouvelle évaluation</p>
                <p className="text-sm text-gray-600">Tokeniser plus de cultures</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              disabled
            >
              <ArrowsRightLeftIcon className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-gray-400">Échanger</p>
                <p className="text-sm text-gray-400">Bientôt disponible</p>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}