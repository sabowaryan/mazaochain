'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { useMazaoContracts } from '@/hooks/useMazaoContracts';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TokenHolding {
  tokenId: string;
  cropType: string;
  amount: number;
  estimatedValue: number;
  harvestDate: string;
  status: 'active' | 'harvested' | 'expired';
}

export default function FarmerPortfolioPage() {
  const { user, profile } = useAuth();
  const t = useTranslations('farmer');
  const { getFarmerTotalBalance, getTokenDetails } = useMazaoContracts();
  
  const [totalBalance, setTotalBalance] = useState(0);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user?.id || !profile?.wallet_address) return;

      try {
        setLoading(true);

        // Charger le solde total
        const balance = await getFarmerTotalBalance(profile.wallet_address);
        setTotalBalance(balance);

        // Simuler des holdings de tokens (en attendant l'API réelle)
        const mockHoldings: TokenHolding[] = [
          {
            tokenId: '1',
            cropType: 'manioc',
            amount: 12000,
            estimatedValue: 12000,
            harvestDate: '2024-12-15',
            status: 'active'
          },
          {
            tokenId: '2',
            cropType: 'cafe',
            amount: 7500,
            estimatedValue: 7500,
            harvestDate: '2024-11-30',
            status: 'active'
          }
        ];

        setTokenHoldings(mockHoldings);

      } catch (error) {
        console.error('Erreur lors du chargement du portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [user?.id, profile?.wallet_address, getFarmerTotalBalance]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mon portfolio MAZAO
        </h1>
        <p className="text-gray-600">
          Suivez vos tokens de cultures et leur valeur
        </p>
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
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
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
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
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
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
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
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">
              Aucun token MAZAO dans votre portfolio
            </p>
            <Button onClick={() => window.location.href = '/fr/dashboard/farmer/evaluations'}>
              Commencer une évaluation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tokenHoldings.map((holding) => (
              <div key={holding.tokenId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">
                        {holding.cropType === 'manioc' ? '🌾' : '☕'}
                      </span>
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
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          holding.status === 'active' 
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
            ))}
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
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
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
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
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
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
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