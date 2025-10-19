"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoanDashboard } from "@/components/loan/LoanDashboard";

export default function FarmerLoansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const handleNewLoanRequest = () => {
    router.push(`/${lang}/dashboard/farmer/loans/request`);
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes prêts</h1>
        <p className="text-gray-600">
          Gérez vos demandes de prêt et suivez vos financements
        </p>
      </div>

      {/* Dashboard des prêts avec toutes les fonctionnalités intégrées */}
      <LoanDashboard onNewLoanRequest={handleNewLoanRequest} />
    </div>
  );
}
