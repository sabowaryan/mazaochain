"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoanRequestForm } from "@/components/loan/LoanRequestForm";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { ModernPageHeader } from "@/components/ui/ModernPageHeader";
import { useWallet } from "@/hooks/useWallet";
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  BanknotesIcon as BanknotesIconSolid
} from '@heroicons/react/24/solid';

export default function LoanRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const { isConnected } = useWallet();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-4xl mx-auto">
        <ModernPageHeader
          title="Demande de prêt"
          subtitle="Utilisez vos tokens MAZAO comme garantie pour obtenir un financement"
          icon={<BanknotesIconSolid />}
          subtitleIcon={<CurrencyDollarIcon />}
          gradient="amber"
        />

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-800">
                  Connexion wallet requise
                </h3>
              </div>
              <p className="text-amber-700 mb-4">
                Vous devez connecter votre wallet HashPack pour demander un prêt
              </p>
              <WalletConnection showBalances={false} />
            </Card>
          </div>
        )}

        {/* Wallet Balance */}
        {isConnected && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-primary-800">
                  Wallet connecté
                </h3>
              </div>
              <WalletBalance />
            </Card>
          </div>
        )}

        {/* Loan Request Form */}
        <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
              <BanknotesIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Détails de la demande</h3>
          </div>
          <LoanRequestForm
            onSuccess={() => {
              router.push(`/${lang}/dashboard/farmer/loans`);
            }}
            onCancel={() => {
              router.push(`/${lang}/dashboard/farmer/loans`);
            }}
          />
        </Card>

        {/* Informations sur les prêts */}
        <div className="mt-8">
          <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Conditions du prêt</h3>
            </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Collatéral requis: 200%</h4>
                <p className="text-sm text-gray-600">
                  Vous devez avoir des tokens MAZAO d&apos;une valeur de 2x le
                  montant du prêt
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Décaissement automatique</h4>
                <p className="text-sm text-gray-600">
                  Une fois approuvé, les USDC sont transférés directement sur
                  votre wallet
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Libération du collatéral</h4>
                <p className="text-sm text-gray-600">
                  Vos tokens MAZAO sont libérés automatiquement après
                  remboursement complet
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Approbation coopérative</h4>
                <p className="text-sm text-gray-600">
                  Votre coopérative examine et approuve chaque demande de prêt
                </p>
              </div>
            </div>
          </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
