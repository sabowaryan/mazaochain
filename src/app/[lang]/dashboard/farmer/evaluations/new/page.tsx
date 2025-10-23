'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CropEvaluationForm } from '@/components/crop-evaluation/CropEvaluationForm';
import { ModernPageHeader } from '@/components/ui/ModernPageHeader';
import {
  ClipboardDocumentListIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import {
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-4xl mx-auto">
        <ModernPageHeader
          title="Nouvelle évaluation de culture"
          subtitle="Soumettez une évaluation de vos cultures pour obtenir des tokens MAZAO"
          icon={<ClipboardDocumentListIconSolid />}
          subtitleIcon={<SparklesIcon />}
          gradient="emerald"
        />

        <CropEvaluationForm
          onSuccess={() => {
            router.push(`/${lang}/dashboard/farmer/evaluations`);
          }}
          onCancel={() => {
            router.push(`/${lang}/dashboard/farmer/evaluations`);
          }}
        />

        {/* Informations sur le processus */}
        <div className="mt-8">
          <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Comment ça marche</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">📝 Soumission</h4>
                <p className="text-sm text-gray-600">
                  Remplissez le formulaire avec les détails de votre culture (superficie, rendement, prix)
                </p>
              </div>

              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="w-8 h-8 text-secondary-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">🔍 Validation</h4>
                <p className="text-sm text-gray-600">
                  Votre coopérative examine et valide votre évaluation selon les critères établis
                </p>
              </div>

              <div className="text-center group">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">🪙 Tokenisation</h4>
                <p className="text-sm text-gray-600">
                  Recevez des tokens MAZAO représentant la valeur de votre culture pour obtenir des prêts
                </p>
              </div>
            </div>

            {/* Avantages */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">✨ Avantages de l'évaluation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span className="text-sm text-primary-800">Accès au financement décentralisé</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                  <span className="text-sm text-secondary-800">Valorisation transparente de vos récoltes</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-800">Tokens utilisables comme garantie</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">Processus rapide et sécurisé</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}