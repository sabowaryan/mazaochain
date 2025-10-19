"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loanService } from "@/lib/services/loan";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoanDisbursementStatus } from "./LoanDisbursementStatus";

import { LoanDetailsPage } from "./LoanDetailsPage";
import type { LoanDetails, LoanSummary } from "@/types/loan";

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
      // Admin role should be treated as cooperative for loan operations
      const effectiveRole =
        profile.role === "admin" ? "cooperative" : profile.role;

      // Vérifier le cache de session pour éviter les requêtes multiples
      const cacheKey = `loans_data_${user.id}_${effectiveRole}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();
      
      // Utiliser le cache s'il a moins de 30 secondes
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 30000) {
        const { loans: cachedLoans, summary: cachedSummary } = JSON.parse(cachedData);
        setLoans(cachedLoans);
        setSummary(cachedSummary);
        setLoading(false);
        return;
      }

      // Fetch loans once
      const loansData = await loanService.getUserLoans(
        user.id,
        effectiveRole as "agriculteur" | "cooperative" | "preteur"
      );

      // Calculate summary from fetched loans (no duplicate API call)
      const summaryData = await loanService.getLoanSummary(
        user.id,
        effectiveRole as "agriculteur" | "cooperative" | "preteur",
        loansData
      );

      setLoans(loansData);
      setSummary(summaryData);
      
      // Mettre en cache les données
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

  // Show loan details page if a loan is selected
  if (selectedLoanId) {
    return (
      <LoanDetailsPage
        loanId={selectedLoanId}
        onBack={() => setSelectedLoanId(null)}
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "repaid":
        return "bg-gray-100 text-gray-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "defaulted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "approved":
        return "Approuvé";
      case "active":
        return "Actif";
      case "repaid":
        return "Remboursé";
      case "rejected":
        return "Rejeté";
      case "defaulted":
        return "En défaut";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des prêts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {summary.totalLoans}
                </p>
                <p className="text-sm text-gray-600">Total des prêts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summary.activeLoans}
                </p>
                <p className="text-sm text-gray-600">Prêts actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summary.totalBorrowed.toFixed(2)} USDC
                </p>
                <p className="text-sm text-gray-600">Total emprunté</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summary.totalOutstanding.toFixed(2)} USDC
                </p>
                <p className="text-sm text-gray-600">Solde restant</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Section */}
      {profile?.role === "agriculteur" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Gérer vos demandes de prêt</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNewLoanRequest} className="w-full sm:w-auto">
              Nouvelle demande de prêt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loans List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {profile?.role === "agriculteur"
              ? "Mes Prêts"
              : profile?.role === "cooperative"
              ? "Prêts des Agriculteurs"
              : "Prêts Financés"}
          </CardTitle>
          <CardDescription>
            {loans.length === 0
              ? "Aucun prêt trouvé"
              : `${loans.length} prêt${loans.length > 1 ? "s" : ""} trouvé${
                  loans.length > 1 ? "s" : ""
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucun prêt
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {profile?.role === "agriculteur"
                  ? "Vous n'avez pas encore de prêt. Commencez par faire une demande."
                  : "Aucun prêt à afficher pour le moment."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium">
                        {loan.principal.toFixed(2)} USDC
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          loan.status || "pending"
                        )}`}
                      >
                        {getStatusText(loan.status || "pending")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(loan.created_at || "")}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Collatéral</p>
                      <p className="font-medium">
                        {loan.collateral_amount.toFixed(2)} USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Taux d&apos;intérêt</p>
                      <p className="font-medium">
                        {(loan.interest_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Échéance</p>
                      <p className="font-medium">{formatDate(loan.due_date)}</p>
                    </div>
                  </div>

                  {/* Show borrower info for cooperative/lender view */}
                  {profile?.role !== "agriculteur" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Emprunteur:{" "}
                        <span className="font-medium">
                          {loan.borrower?.nom || "Agriculteur inconnu"}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Show lender info for farmer view */}
                  {profile?.role === "agriculteur" && loan.lender && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Prêteur:{" "}
                        <span className="font-medium">
                          {loan.lender.institution_name}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Disbursement Status for approved/active loans */}
                  {(loan.status === "approved" ||
                    loan.status === "active" ||
                    loan.status === "repaid") && (
                    <div className="mt-4">
                      <LoanDisbursementStatus
                        loanId={loan.id}
                        onRetry={() => loadLoansData()}
                      />
                    </div>
                  )}

                  {/* Action buttons based on status and role */}
                  <div className="mt-4 flex space-x-2">
                    {loan.status === "pending" &&
                      profile?.role === "cooperative" && (
                        <>
                          <Button size="sm" variant="outline">
                            Approuver
                          </Button>
                          <Button size="sm" variant="outline">
                            Rejeter
                          </Button>
                        </>
                      )}

                    {loan.status === "active" &&
                      profile?.role === "agriculteur" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLoanId(loan.id)}
                        >
                          Rembourser
                        </Button>
                      )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLoanId(loan.id)}
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
