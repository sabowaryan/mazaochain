'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CropEvaluationForm } from '@/components/crop-evaluation/CropEvaluationForm';
import { EvaluationHistory } from '@/components/crop-evaluation/EvaluationHistory';

export default function FarmerEvaluationsPage() {
  const { user } = useAuth();
  const t = useTranslations('farmer');
  const [showForm, setShowForm] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Évaluations de cultures
        </h1>
        <p className="text-gray-600">
          Gérez vos évaluations de cultures et suivez leur statut
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nouvelle évaluation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Nouvelle évaluation</h3>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "outline" : "default"}
            >
              {showForm ? 'Annuler' : 'Nouvelle évaluation'}
            </Button>
          </div>
          
          {showForm ? (
            <CropEvaluationForm 
              onSuccess={() => {
                setShowForm(false);
                // Recharger l'historique
                window.location.reload();
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">
                Soumettez une nouvelle évaluation de vos cultures
              </p>
              <Button onClick={() => setShowForm(true)}>
                Commencer une évaluation
              </Button>
            </div>
          )}
        </Card>

        {/* Historique */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Historique des évaluations</h3>
          <EvaluationHistory 
            farmerId={user.id}
            onViewDetails={(evaluation) => {
              // Ouvrir les détails de l'évaluation
              console.log('Voir détails:', evaluation);
            }}
          />
        </Card>
      </div>

      {/* Statistiques rapides */}
      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Résumé des évaluations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">2</div>
              <div className="text-sm text-success-700">Approuvées</div>
            </div>
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">1</div>
              <div className="text-sm text-warning-700">En attente</div>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">$17,500</div>
              <div className="text-sm text-primary-700">Valeur totale</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}