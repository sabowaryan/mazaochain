'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMazaoContracts } from '@/hooks/useMazaoContracts';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RequireAuth } from '@/components/auth/AuthGuard';
import { LenderInvestmentDashboard } from '@/components/lender/LenderInvestmentDashboard';
import { LenderPortfolio } from '@/components/lender/LenderPortfolio';
import { RiskAssessmentDisplay } from '@/components/lender/RiskAssessmentDisplay';
import dynamic from 'next/dynamic';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { EnhancedWalletStatus } from '@/components/wallet/EnhancedWalletStatus';
import type { RiskAssessment } from '@/types/lender';

interface LenderStats {
  totalInvested: number;
  activeLoans: number;
  totalReturns: number;
  availableFunds: number;
  portfolioValue: number;
}

interface LoanOpportunity {
  id: string;
  borrower_id: string;
  principal: number;
  collateral_amount: number;
  interest_rate: number;
  status: string;
  created_at: string;
  profiles?: {
    farmer_profiles?: {
      nom: string;
      crop_type: string;
    };
  };
  risk_assessment?: RiskAssessment;
}

interface Loan {
  id: string;
  principal: number;
  interest_rate: number;
}

// Charger WalletConnection côté client uniquement (évite l'état faux non connecté au premier rendu)
const WalletConnection = dynamic(
  () => import('@/components/wallet/WalletConnection').then(mod => ({ default: mod.WalletConnection })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-20 rounded" />
  }
);

function LenderDashboardContent() {
  const { user, profile } = useAuth();
  const { 
    requestLoan,
    loading: contractsLoading 
  } = useMazaoContracts();
  const { isConnected } = useWallet();
  
  const [stats, setStats] = useState<LenderStats>({
    totalInvested: 0,
    activeLoans: 0,
    totalReturns: 0,
    availableFunds: 0,
    portfolioValue: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'portfolio' | 'analytics' | 'risk'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [loanOpportunities, setLoanOpportunities] = useState<LoanOpportunity[]>([]);
  const [selectedOpportunityForRisk, setSelectedOpportunityForRisk] = useState<LoanOpportunity | null>(null);

  useEffect(() => {
    const loadLenderData = async () => {
      if (!user?.id || !profile) return;

      try {
        setIsLoading(true);

        // Charger les données depuis les APIs
        const [opportunitiesRes, activeLoansRes] = await Promise.all([
          fetch(`/api/lender/opportunities`),
          fetch(`/api/loans?lender_id=${user.id}&status=active`)
        ]);

        const opportunitiesResult = await opportunitiesRes.json();
        const activeLoansResult = await activeLoansRes.json();

        // Extraire les données des réponses API
        const opportunities = Array.isArray(opportunitiesResult) 
          ? opportunitiesResult 
          : (opportunitiesResult?.data || []);
        
        const activeLoans = Array.isArray(activeLoansResult) 
          ? activeLoansResult 
          : (activeLoansResult?.data || []);

        setLoanOpportunities(opportunities);

        // Calculer les statistiques
        const totalInvested = activeLoans.reduce((sum: number, loan: Loan) => sum + loan.principal, 0);
        const totalReturns = activeLoans.reduce((sum: number, loan: Loan) => {
          const interest = loan.principal * loan.interest_rate;
          return sum + interest;
        }, 0);
        const availableFunds = profile.lender_profiles?.available_funds || 0;
        const portfolioValue = totalInvested + totalReturns;

        setStats({
          totalInvested,
          activeLoans: activeLoans.length,
          totalReturns,
          availableFunds,
          portfolioValue
        });

      } catch (error) {
        console.error('Erreur lors du chargement des données prêteur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLenderData();
  }, [user?.id, profile]);

  const handleInvestInLoan = async (loanId: string, loanAmount: number, collateralTokenId: string) => {
    try {
      if (!isConnected) {
        alert('Veuillez connecter votre wallet pour investir');
        return;
      }

      // Créer le prêt via le smart contract
      // Note: requestLoan is typically called by the borrower, but we're using it here
      // In a real implementation, there should be a separate approveLoan or fundLoan function
      const loanDetails = await requestLoan(
        collateralTokenId,
        loanAmount,
        12, // duration in months
        15 // interest rate
      );

      if (!loanDetails.success) {
        throw new Error('Échec de la création du prêt sur la blockchain');
      }

      // Mettre à jour le statut dans la base de données
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'active',
          lender_id: user?.id,
          contract_loan_id: loanDetails.transactionId,
          hedera_transaction_id: loanDetails.transactionId
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du prêt');

      alert('Investissement réussi!');
      // Recharger les données
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de l&apos;investissement:', error);
      alert(`Erreur lors de l&apos;investissement dans le prêt: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          Tableau de bord - Prêteur
        </h1>
        <p className="text-gray-600">
          Bienvenue, {profile?.lender_profiles?.institution_name || user?.email}
        </p>
      </div>

      {/* Wallet Connection / Status */}
      <div className="mb-8">
        {!isConnected ? (
          <WalletConnection showBalances={false} />
        ) : (
          <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-emerald-800">Wallet connecté</span>
                <EnhancedWalletStatus variant="compact" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Wallet Balance */}
      {isConnected && (
        <div className="mb-8">
          <WalletBalance />
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Fonds disponibles
              </p>
              <p className="text-2xl font-bold text-primary-600">
                ${stats.availableFunds.toLocaleString()}
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
                Total investi
              </p>
              <p className="text-2xl font-bold text-secondary-600">
                ${stats.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-full">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Prêts actifs
              </p>
              <p className="text-2xl font-bold text-warning-600">
                {stats.activeLoans}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Rendements
              </p>
              <p className="text-2xl font-bold text-success-600">
                ${stats.totalReturns.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Valeur portfolio
              </p>
              <p className="text-2xl font-bold text-accent-600">
                ${stats.portfolioValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-accent-100 rounded-full">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Vue d&apos;ensemble', icon: '📊' },
            { key: 'opportunities', label: 'Opportunités', icon: '🎯' },
            { key: 'portfolio', label: 'Portfolio', icon: '💼' },
            { key: 'risk', label: 'Analyse de Risque', icon: '⚠️' },
            { key: 'analytics', label: 'Analyses', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Opportunités d&apos;investissement</h3>
              <div className="space-y-3">
                {loanOpportunities.slice(0, 3).map((opportunity) => (
                  <div key={opportunity.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {opportunity.profiles?.farmer_profiles?.nom || 'Agriculteur'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {opportunity.profiles?.farmer_profiles?.crop_type || 'Culture mixte'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        ${opportunity.principal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Garantie: ${opportunity.collateral_amount.toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {opportunity.risk_assessment && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOpportunityForRisk(opportunity)}
                          >
                            Risque
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => handleInvestInLoan(
                            opportunity.id, 
                            opportunity.principal, 
                            opportunity.id // Using loan ID as collateral token ID placeholder
                          )}
                        >
                          Investir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab('opportunities')}
                >
                  Voir toutes les opportunités
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance du portfolio</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rendement moyen</span>
                  <span className="font-bold text-success-600">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux de défaut</span>
                  <span className="font-bold text-error-600">2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Diversification</span>
                  <span className="font-bold text-primary-600">Élevée</span>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('analytics')}
                  >
                    Voir les analyses détaillées
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Opportunités d&apos;investissement disponibles</h3>
            <LenderInvestmentDashboard />
          </Card>
        )}

        {activeTab === 'portfolio' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mon portfolio d&apos;investissements</h3>
            <LenderPortfolio />
          </Card>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-6">
            {selectedOpportunityForRisk && selectedOpportunityForRisk.risk_assessment ? (
              <RiskAssessmentDisplay
                riskAssessment={selectedOpportunityForRisk.risk_assessment}
                farmerName={selectedOpportunityForRisk.profiles?.farmer_profiles?.nom || 'Agriculteur'}
                cropType={selectedOpportunityForRisk.profiles?.farmer_profiles?.crop_type || 'Culture'}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Sélectionnez une opportunité dans l&apos;onglet Vue d&apos;ensemble pour voir l&apos;analyse de risque détaillée
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('overview')}
                  >
                    Retour aux opportunités
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Analyses de risque et performance</h3>
            <div className="text-center py-8">
              <p className="text-gray-500">Analyses de risque en cours de développement</p>
            </div>
          </Card>
        )}
      </div>

      {/* Risk Assessment Modal */}
      {selectedOpportunityForRisk && selectedOpportunityForRisk.risk_assessment && activeTab !== 'risk' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Analyse de Risque Détaillée</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOpportunityForRisk(null)}
                >
                  ✕
                </Button>
              </div>
              <RiskAssessmentDisplay
                riskAssessment={selectedOpportunityForRisk.risk_assessment}
                farmerName={selectedOpportunityForRisk.profiles?.farmer_profiles?.nom || 'Agriculteur'}
                cropType={selectedOpportunityForRisk.profiles?.farmer_profiles?.crop_type || 'Culture'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function LenderDashboard() {
  return (
    <RequireAuth requiredRoles={['preteur', 'admin']}>
      <LenderDashboardContent />
    </RequireAuth>
  );
}