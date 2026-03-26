'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMazaoContracts } from '@/hooks/useMazaoContracts';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RequireAuth } from '@/components/auth/AuthGuard';

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
  due_date?: string;
  farmer?: {
    nom: string;
    crop_type: string | null;
    superficie: number;
    localisation: string;
  };
  risk_assessment?: RiskAssessment;
}

interface Loan {
  id: string;
  principal: number;
  interest_rate: number;
  status: string;
  due_date?: string;
  created_at: string;
  borrower?: {
    farmer_profile?: {
      nom: string;
      crop_type: string | null;
    };
  };
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
  const [avgReturnRate, setAvgReturnRate] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'portfolio' | 'analytics' | 'risk'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [loanOpportunities, setLoanOpportunities] = useState<LoanOpportunity[]>([]);
  const [fundedLoans, setFundedLoans] = useState<Loan[]>([]);
  const [selectedOpportunityForRisk, setSelectedOpportunityForRisk] = useState<LoanOpportunity | null>(null);
  const [portfolioSort, setPortfolioSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'principal', dir: 'desc' });

  useEffect(() => {
    const loadLenderData = async () => {
      if (!user?.id || !profile) return;

      try {
        setIsLoading(true);

        // Charger les données depuis les APIs
        const [opportunitiesRes, activeLoansRes, allFundedLoansRes] = await Promise.all([
          fetch(`/api/lender/opportunities`),
          fetch(`/api/loans?lender_id=${user.id}&status=active`),
          fetch(`/api/loans?lender_id=${user.id}`),
        ]);

        const opportunitiesResult = await opportunitiesRes.json();
        const activeLoansResult = await activeLoansRes.json();
        const allFundedResult = await allFundedLoansRes.json();

        const opportunities = Array.isArray(opportunitiesResult)
          ? opportunitiesResult
          : (opportunitiesResult?.data || []);

        const activeLoans: Loan[] = Array.isArray(activeLoansResult)
          ? activeLoansResult
          : (activeLoansResult?.data || []);

        const allFunded: Loan[] = Array.isArray(allFundedResult)
          ? allFundedResult
          : (allFundedResult?.data || []);

        setLoanOpportunities(opportunities);
        setFundedLoans(allFunded);

        // Calculer les statistiques (totalInvested = tous les prêts financés, actifs + complétés)
        const totalInvested = allFunded.reduce((sum: number, loan: Loan) => sum + Number(loan.principal), 0);
        const totalReturns = activeLoans.reduce((sum: number, loan: Loan) => {
          return sum + Number(loan.principal) * Number(loan.interest_rate);
        }, 0);
        const avg = activeLoans.length > 0
          ? activeLoans.reduce((s, l) => s + Number(l.interest_rate), 0) / activeLoans.length
          : 0;
        const availableFunds = profile.lender_profiles?.available_funds || 0;
        const portfolioValue = totalInvested + totalReturns;

        setAvgReturnRate(avg);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Tableau de bord Prêteur
        </h1>
        <p className="text-gray-500 text-sm">
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-5">
            <div className="p-2 bg-blue-500 rounded-lg w-fit mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-xl font-bold text-blue-900">${stats.availableFunds.toLocaleString()}</p>
            <p className="text-xs font-medium text-blue-600 mt-1">Fonds disponibles</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="p-5">
            <div className="p-2 bg-purple-500 rounded-lg w-fit mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-xl font-bold text-purple-900">${stats.totalInvested.toLocaleString()}</p>
            <p className="text-xs font-medium text-purple-600 mt-1">Total investi</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="p-5">
            <div className="p-2 bg-amber-500 rounded-lg w-fit mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-amber-900">{stats.activeLoans}</p>
            <p className="text-xs font-medium text-amber-600 mt-1">Prêts actifs</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="p-5">
            <div className="p-2 bg-emerald-500 rounded-lg w-fit mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-xl font-bold text-emerald-900">${stats.totalReturns.toLocaleString()}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">Rendements</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 col-span-2 lg:col-span-1">
          <div className="p-5">
            <div className="p-2 bg-teal-500 rounded-lg w-fit mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-teal-900">${stats.portfolioValue.toLocaleString()}</p>
            <p className="text-xs font-medium text-teal-600 mt-1">Valeur portfolio</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'overview', label: "Vue d'ensemble" },
          { key: 'opportunities', label: 'Opportunités' },
          { key: 'portfolio', label: 'Portfolio' },
          { key: 'risk', label: 'Analyse de risque' },
          { key: 'analytics', label: 'Analyses' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                          {opportunity.farmer?.nom || 'Agriculteur'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {opportunity.farmer?.crop_type || 'Culture mixte'}
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
                  <span className="text-gray-600">Capital total déployé</span>
                  <span className="font-bold text-secondary-600">${stats.totalInvested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rendements projetés</span>
                  <span className="font-bold text-success-600">${stats.totalReturns.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valeur totale du portfolio</span>
                  <span className="font-bold text-primary-600">${stats.portfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Opportunités disponibles</span>
                  <span className="font-bold text-accent-600">{loanOpportunities.length}</span>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Opportunités d&apos;investissement disponibles ({loanOpportunities.length})</h3>
            </div>
            {loanOpportunities.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-gray-500">Aucune opportunité d&apos;investissement disponible pour le moment.</p>
                <p className="text-gray-400 text-sm mt-1">Les demandes de prêt approuvées par les coopératives apparaîtront ici.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loanOpportunities.map(opp => {
                  const score: number | undefined = (opp.risk_assessment as { score?: number } | undefined)?.score;
                  const riskPct = score != null ? Math.min(Math.max(score * 100, 0), 100) : null;
                  const riskColor = riskPct == null ? 'bg-gray-300'
                    : riskPct < 40 ? 'bg-emerald-500'
                    : riskPct < 70 ? 'bg-amber-500'
                    : 'bg-red-500';
                  const riskLabel = riskPct == null ? 'Non évalué'
                    : riskPct < 40 ? 'Faible risque'
                    : riskPct < 70 ? 'Risque modéré'
                    : 'Risque élevé';
                  return (
                  <Card key={opp.id} className="p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{(opp.farmer?.nom?.[0] ?? 'A').toUpperCase()}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{opp.farmer?.nom || 'Agriculteur'}</h4>
                          <p className="text-xs text-gray-500">{opp.farmer?.crop_type || 'Culture mixte'} · {opp.farmer?.localisation || '—'}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary-600">${Number(opp.principal).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Taux</p>
                        <p className="font-bold text-emerald-600 text-sm">{(Number(opp.interest_rate) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Garantie</p>
                        <p className="font-bold text-gray-700 text-sm">${Number(opp.collateral_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Surface</p>
                        <p className="font-bold text-gray-700 text-sm">{opp.farmer?.superficie ? `${opp.farmer.superficie} ha` : '—'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Score de risque</span>
                        <span className={`text-xs font-medium ${riskPct == null ? 'text-gray-400' : riskPct < 40 ? 'text-emerald-600' : riskPct < 70 ? 'text-amber-600' : 'text-red-600'}`}>{riskLabel}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {riskPct != null && (
                          <div className={`h-full rounded-full ${riskColor} transition-all`} style={{ width: `${riskPct}%` }} />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      {opp.risk_assessment && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedOpportunityForRisk(opp); setActiveTab('risk'); }}>
                          Détail risque
                        </Button>
                      )}
                      <Button size="sm" className="flex-1" onClick={() => handleInvestInLoan(opp.id, Number(opp.principal), opp.id)}>
                        Financer ce prêt
                      </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <p className="text-sm text-gray-600">Capital total prêté (tous statuts)</p>
                <p className="text-2xl font-bold text-primary-600">${stats.totalInvested.toLocaleString()}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-gray-600">Rendement moyen</p>
                <p className="text-2xl font-bold text-success-600">
                  {avgReturnRate > 0 ? `${(avgReturnRate * 100).toFixed(1)}%` : '—'}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-gray-600">Prêts financés</p>
                <p className="text-2xl font-bold text-secondary-600">{fundedLoans.length}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h4 className="text-base font-semibold mb-4">Prêts financés</h4>
              {fundedLoans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Vous n&apos;avez pas encore financé de prêts.</p>
                  <Button className="mt-4" onClick={() => setActiveTab('opportunities')}>
                    Voir les opportunités
                  </Button>
                </div>
              ) : (() => {
                const statusColor: Record<string, string> = {
                  active: 'bg-emerald-100 text-emerald-700',
                  pending: 'bg-yellow-100 text-yellow-700',
                  completed: 'bg-blue-100 text-blue-700',
                  defaulted: 'bg-red-100 text-red-700',
                };
                const statusLabel: Record<string, string> = {
                  active: 'Actif',
                  pending: 'En attente',
                  completed: 'Remboursé',
                  defaulted: 'En défaut',
                };
                const sorted = [...fundedLoans].sort((a, b) => {
                  const dir = portfolioSort.dir === 'asc' ? 1 : -1;
                  if (portfolioSort.key === 'principal') return (Number(a.principal) - Number(b.principal)) * dir;
                  if (portfolioSort.key === 'interest_rate') return (Number(a.interest_rate) - Number(b.interest_rate)) * dir;
                  if (portfolioSort.key === 'status') return a.status.localeCompare(b.status) * dir;
                  if (portfolioSort.key === 'due_date') return ((a.due_date ?? '').localeCompare(b.due_date ?? '')) * dir;
                  return 0;
                });
                const SortIcon = ({ col }: { col: string }) => {
                  if (portfolioSort.key !== col) return <span className="ml-1 text-gray-300">↕</span>;
                  return <span className="ml-1 text-primary-500">{portfolioSort.dir === 'asc' ? '↑' : '↓'}</span>;
                };
                const toggleSort = (key: string) => {
                  setPortfolioSort(prev => prev.key === key
                    ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                    : { key, dir: 'desc' });
                };
                return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Emprunteur</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('principal')}>
                          Montant <SortIcon col="principal" />
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('interest_rate')}>
                          Taux <SortIcon col="interest_rate" />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('status')}>
                          Statut <SortIcon col="status" />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('due_date')}>
                          Échéance <SortIcon col="due_date" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sorted.map(loan => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {loan.borrower?.farmer_profile?.nom || '—'}
                            {loan.borrower?.farmer_profile?.crop_type && (
                              <span className="ml-1 text-gray-500 font-normal">({loan.borrower.farmer_profile.crop_type})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600">${Number(loan.principal).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-success-600">{(Number(loan.interest_rate) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[loan.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabel[loan.status] || loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {loan.due_date ? new Date(loan.due_date).toLocaleDateString('fr-FR') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                );
              })()}
            </Card>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-6">
            {selectedOpportunityForRisk && selectedOpportunityForRisk.risk_assessment ? (
              <RiskAssessmentDisplay
                riskAssessment={selectedOpportunityForRisk.risk_assessment}
                farmerName={selectedOpportunityForRisk.farmer?.nom || 'Agriculteur'}
                cropType={selectedOpportunityForRisk.farmer?.crop_type || 'Culture'}
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

        {activeTab === 'analytics' && (() => {
          const avgRate = loanOpportunities.length > 0
            ? loanOpportunities.reduce((s, o) => s + o.interest_rate, 0) / loanOpportunities.length
            : 0;
          const totalCapital = stats.totalInvested + stats.availableFunds;
          const utilizationRate = totalCapital > 0 ? (stats.totalInvested / totalCapital) * 100 : 0;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5">
                  <p className="text-sm font-medium text-gray-600 mb-1">Rendement moyen (actifs)</p>
                  <p className="text-3xl font-bold text-success-600">
                    {avgReturnRate > 0 ? `${(avgReturnRate * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Sur {stats.activeLoans} prêts actifs</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-medium text-gray-600 mb-1">Taux moyen (opportunités)</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {avgRate > 0 ? `${(avgRate * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{loanOpportunities.length} opportunités disponibles</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-medium text-gray-600 mb-1">Taux d&apos;utilisation</p>
                  <p className="text-3xl font-bold text-secondary-600">
                    {totalCapital > 0 ? `${utilizationRate.toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">${stats.totalInvested.toLocaleString()} / ${totalCapital.toLocaleString()}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-medium text-gray-600 mb-1">Rendements projetés</p>
                  <p className="text-3xl font-bold text-accent-600">${stats.totalReturns.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Sur {stats.activeLoans} prêts actifs</p>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="text-base font-semibold mb-4">Opportunités par culture</h4>
                {loanOpportunities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune opportunité disponible actuellement</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agriculteur</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Culture</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Taux</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Garantie</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loanOpportunities.map(op => (
                          <tr key={op.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{op.farmer?.nom || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{op.farmer?.crop_type || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{op.farmer?.localisation || '—'}</td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-primary-600">${op.principal.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-right text-success-600">{(op.interest_rate * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600">${op.collateral_amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          );
        })()}
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
                farmerName={selectedOpportunityForRisk.farmer?.nom || 'Agriculteur'}
                cropType={selectedOpportunityForRisk.farmer?.crop_type || 'Culture'}
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