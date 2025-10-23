"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loanService } from "@/lib/services/loan";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoanDisbursementStatus } from "./LoanDisbursementStatus";
import { LoanDetailsPage } from "./LoanDetailsPage";
import type { LoanDetails, LoanSummary } from "@/types/loan";
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PlusIcon,
  UserIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import {
  BanknotesIcon as BanknotesIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';

interface LoanDashboardProps {
  onNewLoanRequest?: () => void;
}

export function LoanDashboard({ onNewLoanRequest }: LoanDashboardProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<LoanDetails[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const loadLoansData = useCallback(async () => {
    if (!user?.id || !profile?.role) return;

    setLoading(true);
    try {
      const effectiveRole = profile.role === "admin" ? "cooperative" : profile.role;
      const cacheKey = `loans_data_${user.id}_${effectiveRole}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();
      
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 30000) {
        const { loans: cachedLoans, summary: cachedSummary } = JSON.parse(cachedData);
        setLoans(cachedLoans);
        setSummary(cachedSummary);
        setLoading(false);
        return;
      }

      const loansData = await loanService.getUserLoans(
        user.id,
        effectiveRole as "agriculteur" | "cooperative" | "preteur"
      );

      const summaryData = await loanService.getLoanSummary(
        user.id,
        effectiveRole as "agriculteur" | "cooperative" | "preteur",
        loansData
      );

      setLoans(loansData);
      setSummary(summaryData);
      
      sessionStorage.setItem(cacheKey, JSON.stringify({ loans: loansData, summary: summaryData }));
      sessionStorage.setItem(`${cacheKey}_time`, now.toString());
    } catch (error) {
      console.error("Error loading loans data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    loadLoansData();
  }, [loadLoansData]);

  if (selectedLoanId) {
    return (
      <LoanDetailsPage
        loanId={selectedLoanId}
        onBack={() => setSelectedLoanId(null)}
      />
    );
  }

  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'pending' => {
    switch (status) {
      case "pending": return "warning";
      case "approved": return "info";
      case "active": return "success";
      case "repaid": return "success";
      case "rejected":
      case "defaulted": return "error";
      default: return "pending";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "approved": return "Approuvé";
      case "active": return "Actif";
      case "repaid": return "Remboursé";
      case "rejected": return "Rejeté";
      case "defaulted": return "En défaut";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des prêts...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            title="Total des prêts"
            value={summary.totalLoans}
            subtitle="Demandes soumises"
            icon={<ChartBarIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<ChartBarIcon className="w-5 h-5" />}
            gradient="emerald"
          />
          <StatCard
            title="Prêts actifs"
            value={summary.activeLoans}
            subtitle="En cours"
            icon={<BanknotesIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<BanknotesIcon className="w-5 h-5" />}
            gradient="amber"
          />
          <StatCard
            title="Total emprunté"
            value={`${summary.totalBorrowed.toFixed(2)} USDC`}
            subtitle="Montant total"
            icon={<CurrencyDollarIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<CurrencyDollarIcon className="w-5 h-5" />}
            gradient="emerald"
          />
          <StatCard
            title="Solde restant"
            value={`${summary.totalOutstanding.toFixed(2)} USDC`}
            subtitle="À rembourser"
            icon={<ClockIconSolid className="w-6 h-6 text-white" />}
            accentIcon={<ClockIcon className="w-5 h-5" />}
            gradient="amber"
          />
        </div>
      )}

      {/* Action Section */}
      {profile?.role === "agriculteur" && (
        <Card className="p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
              <PlusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
              <p className="text-sm text-gray-600">Gérer vos demandes de prêt</p>
            </div>
          </div>
          <Button 
            onClick={onNewLoanRequest} 
            className="w-full sm:w-auto group bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
          >
            <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            Nouvelle demande de prêt
          </Button>
        </Card>
      )}

      {/* Loans List */}
      <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <BanknotesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {profile?.role === "agriculteur" ? "Mes Prêts" : 
               profile?.role === "cooperative" ? "Prêts des Agriculteurs" : "Prêts Financés"}
            </h3>
            <p className="text-sm text-gray-600">
              {loans.length === 0 ? "Aucun prêt trouvé" : 
               `${loans.length} prêt${loans.length > 1 ? "s" : ""} trouvé${loans.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BanknotesIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun prêt</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {profile?.role === "agriculteur"
                ? "Vous n'avez pas encore de prêt. Commencez par faire une demande pour financer vos activités agricoles."
                : "Aucun prêt à afficher pour le moment."}
            </p>
            {profile?.role === "agriculteur" && onNewLoanRequest && (
              <Button 
                onClick={onNewLoanRequest}
                className="group bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
              >
                <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Faire une demande
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <Card key={loan.id} className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                      <CurrencyDollarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{loan.principal.toFixed(2)} USDC</h3>
                      <p className="text-sm text-gray-600">Montant principal</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge
                      status={getStatusType(loan.status || "pending")}
                      label={getStatusText(loan.status || "pending")}
                    />
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>{formatDate(loan.created_at || "")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <BanknotesIcon className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Collatéral</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{loan.collateral_amount.toFixed(2)} USDC</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChartBarIcon className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Taux d&apos;intérêt</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{(loan.interest_rate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Échéance</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatDate(loan.due_date)}</p>
                  </div>
                </div>

                {profile?.role !== "agriculteur" && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">
                        Emprunteur: {loan.borrower?.nom || "Agriculteur inconnu"}
                      </p>
                    </div>
                  </div>
                )}

                {profile?.role === "agriculteur" && loan.lender && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 mb-4">
                    <div className="flex items-center space-x-2">
                      <BanknotesIcon className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        Prêteur: {loan.lender.institution_name}
                      </p>
                    </div>
                  </div>
                )}

                {(loan.status === "approved" || loan.status === "active" || loan.status === "repaid") && (
                  <div className="mt-4">
                    <LoanDisbursementStatus loanId={loan.id} onRetry={() => loadLoansData()} />
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  {loan.status === "pending" && profile?.role === "cooperative" && (
                    <>
                      <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        Rejeter
                      </Button>
                    </>
                  )}

                  {loan.status === "active" && profile?.role === "agriculteur" && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedLoanId(loan.id)}
                      className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
                    >
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      Rembourser
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLoanId(loan.id)}
                    className="group"
                  >
                    <EyeIcon className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
                    Voir détails
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}