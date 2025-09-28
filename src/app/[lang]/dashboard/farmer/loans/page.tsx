'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/components/TranslationProvider';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoanRequestForm } from '@/components/loan/LoanRequestForm';
import { LoanDashboard } from '@/components/loan/LoanDashboard';

export default function FarmerLoansPage() {
  const { user } = useAuth();
  const t = useTranslations('farmer');
  const [showForm, setShowForm] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLoans = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/loans?borrower_id=${user.id}`);
        const data = await response.json();
        setLoans(data);
      } catch (error) {
        console.error('Erreur lors du chargement des prêts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, [user?.id]);

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
          Mes prêts
        </h1>
        <p className="text-gray-600">
          Gérez vos demandes de prêt et suivez vos financements
        </p>
      </div>

      {/* Dashboard des prêts existants */}
      <div className="mb-8">
        <LoanDashboard 
          onNewLoanRequest={() => setShowForm(true)}
        />
      </div>

      {/* Nouvelle demande de prêt */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nouvelle demande de prêt</h3>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
          >
            {showForm ? 'Annuler' : 'Demander un prêt'}
          </Button>
        </div>
        
        {showForm ? (
          <LoanRequestForm 
            onSuccess={(loanId) => {
              setShowForm(false);
              // Recharger les prêts
              window.location.reload();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">
              Demandez un financement basé sur vos cultures tokenisées
            </p>
            <Button onClick={() => setShowForm(true)}>
              Nouvelle demande
            </Button>
          </div>
        )}
      </Card>

      {/* Informations sur les prêts */}
      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comment ça marche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Évaluation approuvée</h4>
              <p className="text-sm text-gray-600">
                Vos cultures doivent être évaluées et approuvées par votre coopérative
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-secondary-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Demande de prêt</h4>
              <p className="text-sm text-gray-600">
                Utilisez vos tokens MAZAO comme garantie pour votre demande
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-success-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Financement</h4>
              <p className="text-sm text-gray-600">
                Recevez des USDC directement sur votre wallet Hedera
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}