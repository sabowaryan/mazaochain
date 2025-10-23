"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoanDashboard } from "@/components/loan/LoanDashboard";
import { ModernPageHeader } from "@/components/ui/ModernPageHeader";
import {
  BanknotesIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  BanknotesIcon as BanknotesIconSolid
} from '@heroicons/react/24/solid';

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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-7xl mx-auto">
        {/* En-tête moderne */}
        <ModernPageHeader
          title="Mes prêts"
          subtitle="Gérez vos demandes de prêt et suivez vos financements"
          icon={<BanknotesIconSolid />}
          subtitleIcon={<ChartBarIcon />}
          gradient="amber"
          actions={
            <button
              onClick={handleNewLoanRequest}
              className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl hover:from-secondary-600 hover:to-secondary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Nouveau prêt</span>
            </button>
          }
        />

        {/* Dashboard des prêts avec toutes les fonctionnalités intégrées */}
        <LoanDashboard onNewLoanRequest={handleNewLoanRequest} />
      </div>
    </div>
  );
}
