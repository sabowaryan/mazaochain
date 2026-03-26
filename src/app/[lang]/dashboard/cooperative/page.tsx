'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RequireAuth } from '@/components/auth/AuthGuard';
import { ClientOnly } from '@/components/ClientOnly';
import dynamic from 'next/dynamic';
import { useWallet } from '@/hooks/useWallet';
import { EnhancedWalletStatus } from '@/components/wallet/EnhancedWalletStatus';
import { UserGroupIcon, MapPinIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PendingEvaluationsReview = dynamic(
  () => import('@/components/cooperative/PendingEvaluationsReview').then(mod => ({ default: mod.PendingEvaluationsReview })),
  { ssr: false, loading: () => <LoadingSpinner size="sm" /> }
);

const LoanApprovalList = dynamic(
  () => import('@/components/cooperative/LoanApprovalList').then(mod => ({ default: mod.LoanApprovalList })),
  { ssr: false, loading: () => <LoadingSpinner size="sm" /> }
);

const WalletConnection = dynamic(
  () => import('@/components/wallet/WalletConnection').then(mod => ({ default: mod.WalletConnection })),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-20 rounded"></div> }
);

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
}

interface LoanRequest {
  id: string;
  borrower_id: string;
  principal: number;
  status: string;
  created_at: string;
}

interface Member {
  user_id: string;
  nom: string;
  superficie: number;
  localisation: string;
  crop_type: string | null;
  telephone: string | null;
  experience_annees: number | null;
  created_at: string;
  evaluation_count: number;
  latest_evaluation_status: string | null;
  latest_evaluation_crop: string | null;
}

function CooperativeDashboardContent() {
  const { user, profile } = useAuth();
  const { isConnected, disconnectWallet } = useWallet();

  const [stats, setStats] = useState<CooperativeStats>({
    totalMembers: 0,
    pendingEvaluations: 0,
    pendingLoans: 0,
    totalValueManaged: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluations' | 'loans' | 'members'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEvaluations, setPendingEvaluations] = useState<Evaluation[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'fr';

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  useEffect(() => {
    const loadCooperativeData = async () => {
      if (!user?.id || !profile) return;

      try {
        setIsLoading(true);

        const [evaluationsRes, loansRes, membersRes] = await Promise.all([
          fetch(`/api/crop-evaluations?status=pending&cooperative_id=${user.id}`),
          fetch(`/api/loans?status=pending&cooperative_id=${user.id}`),
          fetch(`/api/cooperative/members?cooperative_id=${user.id}`),
        ]);

        const evaluationsResult = await evaluationsRes.json();
        const loansResult = await loansRes.json();
        const membersResult = await membersRes.json();

        const evaluations = evaluationsResult?.error
          ? []
          : Array.isArray(evaluationsResult) ? evaluationsResult : (evaluationsResult?.data || []);

        const loans = loansResult?.error
          ? []
          : Array.isArray(loansResult) ? loansResult : (loansResult?.data || []);

        const membersData: Member[] = membersResult?.error
          ? []
          : Array.isArray(membersResult) ? membersResult : (membersResult?.data || []);

        setPendingEvaluations(evaluations);
        setPendingLoans(loans);
        setMembers(membersData);

        const totalValueManaged = evaluations
          .filter((e: Evaluation) => e.status === 'approved')
          .reduce((sum: number, e: Evaluation) => sum + (e.valeur_estimee || 0), 0);

        setStats({
          totalMembers: membersData.length,
          pendingEvaluations: evaluations.length,
          pendingLoans: loans.length,
          totalValueManaged,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données coopérative:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCooperativeData();
  }, [user?.id, profile]);

  const loadMembers = async () => {
    if (!user?.id) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/cooperative/members?cooperative_id=${user.id}`);
      const result = await res.json();
      const membersData: Member[] = result?.error ? [] : (result?.data || []);
      setMembers(membersData);
      setStats(prev => ({ ...prev, totalMembers: membersData.length }));
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');
    setAddMemberSuccess('');
    const input = newMemberInput.trim();
    if (!input) {
      setAddMemberError("L'identifiant ou l'email de l'agriculteur est requis");
      return;
    }
    setAddMemberLoading(true);
    const isEmail = input.includes('@');
    const body = isEmail ? { email: input } : { farmer_id: input };
    try {
      const res = await fetch('/api/cooperative/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        setAddMemberError(result.error || "Erreur lors de l'ajout du membre");
      } else {
        setAddMemberSuccess('Agriculteur ajouté avec succès !');
        setNewMemberInput('');
        setShowAddMember(false);
        await loadMembers();
      }
    } catch {
      setAddMemberError("Une erreur inattendue s'est produite");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (farmerId: string) => {
    if (!confirm('Retirer cet agriculteur de votre coopérative ?')) return;
    try {
      await fetch(`/api/cooperative/members?farmer_id=${encodeURIComponent(farmerId)}`, {
        method: 'DELETE',
      });
      await loadMembers();
    } catch (e) {
      console.error('Error removing member:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Tableau de bord Coopérative</h1>
        <p className="text-gray-500 text-sm">
          Bienvenue, {profile?.cooperative_profiles?.nom || user?.email}
        </p>
      </div>

      <ClientOnly fallback={<div className="animate-pulse bg-gray-200 h-20 rounded mb-8"></div>}>
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
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={disconnectWallet}
                >
                  Déconnecter le wallet
                </Button>
              </div>
            </Card>
          )}
        </div>
      </ClientOnly>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalMembers}</p>
            <p className="text-xs font-medium text-blue-600 mt-1">Membres actifs</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              {stats.pendingEvaluations > 0 && (
                <span className="text-xs font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">{stats.pendingEvaluations}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-amber-900">{stats.pendingEvaluations}</p>
            <p className="text-xs font-medium text-amber-600 mt-1">Évaluations à valider</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {stats.pendingLoans > 0 && (
                <span className="text-xs font-bold text-white bg-purple-500 rounded-full px-2 py-0.5">{stats.pendingLoans}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.pendingLoans}</p>
            <p className="text-xs font-medium text-purple-600 mt-1">Prêts en attente</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-900">${stats.totalValueManaged.toLocaleString()}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">Valeur gérée (USD)</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'overview', label: "Vue d'ensemble", badge: null },
          { key: 'evaluations', label: 'Évaluations', badge: stats.pendingEvaluations > 0 ? stats.pendingEvaluations : null },
          { key: 'loans', label: 'Prêts', badge: stats.pendingLoans > 0 ? stats.pendingLoans : null },
          { key: 'members', label: 'Membres', badge: null },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.badge !== null && (
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

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
                    <Button onClick={() => setActiveTab('evaluations')} className="mt-2" size="sm">
                      Examiner maintenant
                    </Button>
                  </div>
                )}
                {stats.pendingLoans > 0 && (
                  <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                    <p className="text-secondary-800 font-medium">
                      {stats.pendingLoans} demande(s) de prêt en attente
                    </p>
                    <Button onClick={() => setActiveTab('loans')} className="mt-2" size="sm" variant="secondary">
                      Examiner maintenant
                    </Button>
                  </div>
                )}
                {stats.pendingEvaluations === 0 && stats.pendingLoans === 0 && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-success-800 font-medium">Aucune action urgente en attente</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Résumé de la coopérative</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Membres enregistrés</span>
                  <span className="font-bold text-primary-600">{stats.totalMembers}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Évaluations en attente</span>
                  <span className="font-bold text-warning-600">{stats.pendingEvaluations}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Prêts en cours</span>
                  <span className="font-bold text-secondary-600">{stats.pendingLoans}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Valeur des récoltes gérées</span>
                  <span className="font-bold text-success-600">${stats.totalValueManaged.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'evaluations' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Évaluations en attente de validation</h3>
            <ClientOnly fallback={<LoadingSpinner size="lg" />}>
              <PendingEvaluationsReview cooperativeId={user?.id || ''} />
            </ClientOnly>
          </Card>
        )}

        {activeTab === 'loans' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demandes de prêt en attente</h3>
            <ClientOnly fallback={<LoadingSpinner size="lg" />}>
              <LoanApprovalList />
            </ClientOnly>
          </Card>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Membres de la coopérative ({members.length})
                </h3>
                <Button onClick={() => { setShowAddMember(!showAddMember); setAddMemberError(''); setAddMemberSuccess(''); }}>
                  {showAddMember ? 'Annuler' : '+ Ajouter un membre'}
                </Button>
              </div>

              {showAddMember && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-3">Ajouter un agriculteur par son identifiant utilisateur</h4>
                  <form onSubmit={handleAddMember} className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-64">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email ou identifiant utilisateur (user_id)
                      </label>
                      <Input
                        type="text"
                        placeholder="ex: agriculteur@email.com ou user_2abc123..."
                        value={newMemberInput}
                        onChange={e => { setNewMemberInput(e.target.value); setAddMemberError(''); }}
                        disabled={addMemberLoading}
                        className="text-sm"
                      />
                    </div>
                    <Button type="submit" disabled={addMemberLoading || !newMemberInput.trim()}>
                      {addMemberLoading ? 'Ajout...' : 'Confirmer'}
                    </Button>
                  </form>
                  {addMemberError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircleIcon className="w-4 h-4" /> {addMemberError}
                    </p>
                  )}
                </div>
              )}

              {addMemberSuccess && (
                <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2 text-success-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{addMemberSuccess}</span>
                </div>
              )}

              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun membre enregistré dans votre coopérative.</p>
                  <p className="text-gray-400 text-xs mt-1">Cliquez sur &quot;Ajouter un membre&quot; pour commencer.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Évaluations</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut éval.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map(member => {
                        const evalStatusColor: Record<string, string> = {
                          approved: 'bg-emerald-100 text-emerald-700',
                          pending: 'bg-yellow-100 text-yellow-700',
                          rejected: 'bg-red-100 text-red-700',
                        };
                        const evalStatusLabel: Record<string, string> = {
                          approved: 'Approuvée',
                          pending: 'En attente',
                          rejected: 'Rejetée',
                        };
                        return (
                        <tr key={member.user_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">{(member.nom?.[0] ?? '?').toUpperCase()}</span>
                              </div>
                              <div>
                            <div className="font-medium text-gray-900">{member.nom}</div>
                            {member.crop_type && (
                              <div className="text-xs text-gray-500">{member.crop_type} · {member.superficie} ha</div>
                            )}
                            {member.experience_annees !== null && (
                              <div className="text-xs text-gray-400">{member.experience_annees} ans d&apos;exp.</div>
                            )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {member.telephone
                              ? <a href={`tel:${member.telephone}`} className="text-primary-600 hover:underline">{member.telephone}</a>
                              : <span className="text-gray-400 italic text-xs">Non renseigné</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3 text-gray-400 shrink-0" />
                              {member.localisation}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              member.evaluation_count > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {member.evaluation_count}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {member.latest_evaluation_status ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${evalStatusColor[member.latest_evaluation_status] || 'bg-gray-100 text-gray-600'}`}>
                                {evalStatusLabel[member.latest_evaluation_status] || member.latest_evaluation_status}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Aucune</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedMember(member)}
                                className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                              >
                                Profil
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              >
                                Retirer
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>

    {selectedMember && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedMember.nom}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Profil agriculteur</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Téléphone</p>
                  <p className="font-medium text-sm">
                    {selectedMember.telephone
                      ? <a href={`tel:${selectedMember.telephone}`} className="text-primary-600 hover:underline">{selectedMember.telephone}</a>
                      : <span className="text-gray-400 italic">Non renseigné</span>}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Localisation</p>
                  <p className="font-medium text-sm">{selectedMember.localisation}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Culture principale</p>
                  <p className="font-medium text-sm">{selectedMember.crop_type || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Superficie exploitée</p>
                  <p className="font-medium text-sm">{selectedMember.superficie} ha</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Expérience</p>
                  <p className="font-medium text-sm">
                    {selectedMember.experience_annees !== null ? `${selectedMember.experience_annees} ans` : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Évaluations</p>
                  <p className="font-medium text-sm">{selectedMember.evaluation_count} évaluation(s)</p>
                </div>
              </div>

              {selectedMember.latest_evaluation_status && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Dernière évaluation</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      selectedMember.latest_evaluation_status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                      : selectedMember.latest_evaluation_status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedMember.latest_evaluation_status === 'approved' ? 'Approuvée'
                        : selectedMember.latest_evaluation_status === 'pending' ? 'En attente'
                        : 'Rejetée'}
                    </span>
                    {selectedMember.latest_evaluation_crop && (
                      <span className="text-sm text-gray-600">· {selectedMember.latest_evaluation_crop}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <a
                href={`/${lang}/dashboard/farmer?view=member&member_id=${selectedMember.user_id}`}
                className="flex-1 text-center text-sm py-2 px-4 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Voir tableau de bord complet
              </a>
              <Button className="flex-shrink-0" variant="outline" onClick={() => setSelectedMember(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function CooperativeDashboard() {
  return (
    <RequireAuth requiredRoles={['cooperative', 'admin']}>
      <ClientOnly fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
        <CooperativeDashboardContent />
      </ClientOnly>
    </RequireAuth>
  );
}
