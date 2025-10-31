'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CropEvaluationForm } from '@/components/crop-evaluation/CropEvaluationForm';
import { EvaluationHistory } from '@/components/crop-evaluation/EvaluationHistory';
import { ModernPageHeader } from '@/components/ui/ModernPageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CropEvaluationService } from '@/lib/services/crop-evaluation';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';

export default function FarmerEvaluationsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    totalValue: 0,
    loading: true,
  });

  const cropEvaluationService = new CropEvaluationService();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const evaluations = await cropEvaluationService.getFarmerEvaluations(user.id);
        const evaluationsArray = Array.isArray(evaluations) ? evaluations : [];

        const approved = evaluationsArray.filter(e => e.status === 'approved').length;
        const pending = evaluationsArray.filter(e => e.status === 'pending').length;
        const totalValue = evaluationsArray
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + (e.valeur_estimee || 0), 0);

        setStats({
          approved,
          pending,
          totalValue,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching evaluation stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-7xl mx-auto">
        {/* En-tête moderne */}
        <ModernPageHeader
          title="Évaluations de cultures"
          subtitle="Gérez vos évaluations de cultures et suivez leur statut"
          icon={<ClipboardDocumentListIconSolid />}
          subtitleIcon={<ChartBarIcon />}
          gradient="emerald"
          actions={
            <button
              onClick={() => setShowForm(!showForm)}
              className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {showForm ? (
                <>
                  <XMarkIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">Annuler</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">Nouvelle évaluation</span>
                </>
              )}
            </button>
          }
        />

        {/* Statistiques rapides en haut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <StatCard
            title="Approuvées"
            value={stats.loading ? '...' : stats.approved}
            subtitle="Évaluations validées"
            icon={<CheckCircleIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<SparklesIcon className="w-5 h-5" />}
            gradient="emerald"
          />

          <StatCard
            title="En attente"
            value={stats.loading ? '...' : stats.pending}
            subtitle="En cours de validation"
            icon={<ClockIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<ClockIcon className="w-5 h-5" />}
            gradient="amber"
          />

          <StatCard
            title="Valeur totale"
            value={stats.loading ? '...' : `$${stats.totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle="Cultures évaluées"
            icon={<CurrencyDollarIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<CurrencyDollarIcon className="w-5 h-5" />}
            gradient="emerald"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Nouvelle évaluation */}
          <div className="xl:col-span-2">
            <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                    <PlusIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {showForm ? 'Formulaire d\'évaluation' : 'Nouvelle évaluation'}
                  </h3>
                </div>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  variant={showForm ? "outline" : "default"}
                  className="group"
                >
                  {showForm ? (
                    <>
                      <XMarkIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Nouvelle évaluation
                    </>
                  )}
                </Button>
              </div>
              
              {showForm ? (
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                  <CropEvaluationForm 
                    onSuccess={async () => {
                      setShowForm(false);
                      // Recharger les statistiques
                      if (user) {
                        try {
                          const evaluations = await cropEvaluationService.getFarmerEvaluations(user.id);
                          const evaluationsArray = Array.isArray(evaluations) ? evaluations : [];
                          const approved = evaluationsArray.filter(e => e.status === 'approved').length;
                          const pending = evaluationsArray.filter(e => e.status === 'pending').length;
                          const totalValue = evaluationsArray
                            .filter(e => e.status === 'approved')
                            .reduce((sum, e) => sum + (e.valeur_estimee || 0), 0);
                          setStats({ approved, pending, totalValue, loading: false });
                        } catch (error) {
                          console.error('Error refreshing stats:', error);
                        }
                      }
                      // Recharger l'historique
                      window.location.reload();
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ClipboardDocumentListIcon className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Prêt à évaluer vos cultures ?
                  </h4>
                  <p className="text-gray-600 mb-6 max-w-screen-md mx-auto">
                    Soumettez une nouvelle évaluation de vos cultures pour obtenir une estimation de leur valeur et débloquer des opportunités de financement.
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Commencer une évaluation
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Historique */}
          <div className="xl:col-span-1">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
                  <EyeIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Historique des évaluations</h3>
              </div>
              <EvaluationHistory 
                farmerId={user.id}
                onViewDetails={(evaluation) => {
                  // Ouvrir les détails de l'évaluation
                  console.log('Voir détails:', evaluation);
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}