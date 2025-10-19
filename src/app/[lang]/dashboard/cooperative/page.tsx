'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { useMazaoContracts } from '@/hooks/useMazaoContracts';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RequireAuth } from '@/components/auth/AuthGuard';
import { PendingEvaluationsReview } from '@/components/cooperative/PendingEvaluationsReview';
import { LoanApprovalList } from '@/components/cooperative/LoanApprovalList';
import { WalletConnection } from '@/components/wallet/WalletConnection';

interface CooperativeStats {
  totalMembers: number;
  pendingEvaluations: number;
  pendingLoans: number;
  totalValueManaged: number;
}

interface Evaluation {
  id: string;
  farmer_id: string;
  crop_type: string;
  superficie: number;
  valeur_estimee: number;
  status: string;
  created_at: string;
  farmer_profiles?: {
    nom: string;
  };
}

interface LoanRequest {
  id: string;
  borrower_id: string;
  principal: number;
  collateral_amount: number;
  status: string;
  created_at: string;
  profiles?: {
    farmer_profiles?: {
      nom: string;
    };
  };
}

function CooperativeDashboardContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const t = useTranslations('cooperative');
  const { loading: contractsLoading } = useMazaoContracts();
  const { isConnected } = useWallet();
  
  const [stats, setStats] = useState<CooperativeStats>({
    totalMembers: 0,
    pendingEvaluations: 0,
    pendingLoans: 0,
    totalValueManaged: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations' | 'loans' | 'members'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([]);

  useEffect(() => {
    const loadCooperativeData = async () => {
      if (!user?.id || !profile) {
        return;
      }

      try {
        setIsLoading(true);

        // Charger les données depuis Supabase
        const [evaluationsRes, loansRes, membersRes] = await Promise.all([
          fetch(`/api/crop-evaluations?status=pending&cooperative_id=${user.id}`),
          fetch(`/api/loans?status=pending&cooperative_id=${user.id}`),
          fetch(`/api/cooperative/members?cooperative_id=${user.id}`)
        ]);

        const evaluationsResult = await evaluationsRes.json();
        const loansResult = await loansRes.json();
        const membersResult = await membersRes.json();

        // Extraire les données des réponses API avec gestion d'erreur
        const evaluations = evaluationsResult?.error 
          ? [] 
          : (Array.isArray(evaluationsResult) ? evaluationsResult : (evaluationsResult?.data || []));
        
        const loans = loansResult?.error 
          ? [] 
          : (Array.isArray(loansResult) ? loansResult : (loansResult?.data || []));
        
        const members = membersResult?.error 
          ? [] 
          : (Array.isArray(membersResult) ? membersResult : (membersResult?.data || []));

        setPendingEvaluations(evaluations);
        setPendingLoans(loans);

        // Calculer les statistiques
        const totalValueManaged = evaluations
          .filter((e: Evaluation) => e.status === 'approved')
          .reduce((sum: number, e: Evaluation) => sum + (e.valeur_estimee || 0), 0);

        setStats({
          totalMembers: members.length,
          pendingEvaluations: evaluations.length,
          pendingLoans: loans.length,
          totalValueManaged
        });

      } catch (error) {
        console.error('Erreur lors du chargement des données coopérative:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCooperativeData();
  }, [user.id, profile, user]);



  // Le AuthGuard s'occupe déjà de vérifier l'authentification
  // On affiche juste un loader si les données sont en cours de chargement

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
          Tableau de bord - Coopérative
        </h1>
        <p className="text-gray-600">
          Bienvenue, {profile?.cooperative_profiles?.nom || user?.email}
        </p>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="mb-8">
          <WalletConnection showBalances={false} />
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Membres actifs
              </p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.totalMembers}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Évaluations en attente
              </p>
              <p className="text-2xl font-bold text-warning-600">
                {stats.pendingEvaluations}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Prêts en attente
              </p>
              <p className="text-2xl font-bold text-secondary-600">
                {stats.pendingLoans}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-full">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Valeur gérée
              </p>
              <p className="text-2xl font-bold text-success-600">
                ${stats.totalValueManaged.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
            { key: 'evaluations', label: 'Évaluations', icon: '🌾' },
            { key: 'loans', label: 'Prêts', icon: '💰' },
            { key: 'members', label: 'Membres', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'overview' | 'evaluations' | 'loans' | 'members')}
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
              <h3 className="text-lg font-semibold mb-4">Actions urgentes</h3>
              <div className="space-y-3">
                {stats.pendingEvaluations > 0 && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-warning-800 font-medium">
                      {stats.pendingEvaluations} évaluation(s) en attente de validation
                    </p>
                    <Button 
                      onClick={() => setActiveTab('evaluations')}
                      className="mt-2"
                      size="sm"
                    >
                      Examiner maintenant
                    </Button>
                  </div>
                )}
                {stats.pendingLoans > 0 && (
                  <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <p className="text-secondary-800 font-medium">
                      {stats.pendingLoans} demande(s) de prêt en attente
                    </p>
                    <Button 
                      onClick={() => setActiveTab('loans')}
                      className="mt-2"
                      size="sm"
                      variant="secondary"
                    >
                      Examiner maintenant
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Évaluation manioc approuvée</span>
                  <span className="text-success-600">12,000 MAZAO mintés</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Nouveau membre ajouté</span>
                  <span className="text-primary-600">Jean Mukendi</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Prêt approuvé</span>
                  <span className="text-secondary-600">5,000 USDC</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'evaluations' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Évaluations en attente de validation</h3>
            <PendingEvaluationsReview 
              cooperativeId={user?.id || ''}
            />
          </Card>
        )}

        {activeTab === 'loans' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demandes de prêt en attente</h3>
            <LoanApprovalList />
          </Card>
        )}

        {activeTab === 'members' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gestion des membres</h3>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Fonctionnalité de gestion des membres en cours de développement</p>
              <Button variant="outline">
                Ajouter un membre
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CooperativeDashboard() {
  return (
    <RequireAuth requiredRoles={['cooperative', 'admin']}>
      <CooperativeDashboardContent />
    </RequireAuth>
  );
}