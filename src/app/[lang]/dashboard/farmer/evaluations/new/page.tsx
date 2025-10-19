'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CropEvaluationForm } from '@/components/crop-evaluation/CropEvaluationForm';

export default function NewEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nouvelle évaluation de culture
        </h1>
        <p className="text-gray-600">
          Soumettez une évaluation de vos cultures pour obtenir des tokens MAZAO
        </p>
      </div>

      <Card className="p-6">
        <CropEvaluationForm 
          onSuccess={() => {
            router.push(`/${lang}/dashboard/farmer/evaluations`);
          }}
          onCancel={() => {
            router.push(`/${lang}/dashboard/farmer/evaluations`);
          }}
        />
      </Card>

      {/* Informations sur le processus */}
      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Comment ça marche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Soumission</h4>
              <p className="text-sm text-gray-600">
                Remplissez le formulaire avec les détails de votre culture
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-secondary-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Validation</h4>
              <p className="text-sm text-gray-600">
                Votre coopérative examine et valide votre évaluation
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-success-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Tokenisation</h4>
              <p className="text-sm text-gray-600">
                Recevez des tokens MAZAO représentant la valeur de votre culture
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
