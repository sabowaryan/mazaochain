"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoanRequestForm } from "@/components/loan/LoanRequestForm";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { useWallet } from "@/hooks/useWallet";

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demande de prêt
        </h1>
        <p className="text-gray-600">
          Utilisez vos tokens MAZAO comme garantie pour obtenir un financement
        </p>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Connexion wallet requise
            </h3>
            <p className="text-gray-600 mb-4">
              Vous devez connecter votre wallet HashPack pour demander un prêt
            </p>
            <WalletConnection showBalances={false} />
          </Card>
        </div>
      )}

      {/* Wallet Balance */}
      {isConnected && (
        <div className="mb-8">
          <WalletBalance />
        </div>
      )}

      {/* Loan Request Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Détails de la demande</h3>
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
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conditions du prêt</h3>
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
  );
}
