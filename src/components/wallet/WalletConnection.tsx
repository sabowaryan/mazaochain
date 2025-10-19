// Wallet connection component
"use client";

import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWalletModal } from "@/hooks/useWalletModal";
import { NamespaceSelector } from "./NamespaceSelector";
import React from "react";

interface WalletConnectionProps {
  showBalances?: boolean;
  className?: string;
}

export function WalletConnection({
  showBalances = true,
  className = "",
}: WalletConnectionProps) {
  const {
    isConnected,
    isConnecting,
    isRestoring,
    connection,
    namespace,
    balances,
    isLoadingBalances,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    error,
    errorCode,
  } = useWallet();

  const { modal, showModal, showError, showInfo, closeModal } =
    useWalletModal();

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  };

  const formatBalance = (balance: string, decimals: number = 8) => {
    const num = parseFloat(balance);
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  };

  const getNamespaceLabel = (ns: "hedera" | "eip155" | null) => {
    if (!ns) return "N/A";
    return ns === "hedera" ? "Native" : "EVM";
  };

  const getNamespaceColor = (ns: "hedera" | "eip155" | null) => {
    if (!ns) return "bg-gray-100 text-gray-800";
    return ns === "hedera"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  const getErrorMessage = () => {
    if (!error) return "";

    // Use the error message from the hook which already handles error codes
    return error;
  };

  const getErrorTitle = () => {
    if (!errorCode) return "Erreur de connexion au portefeuille";

    // Provide specific titles based on error code
    switch (errorCode) {
      case "CONNECTION_TIMEOUT":
        return "Délai de connexion dépassé";
      case "CONNECTION_REJECTED":
        return "Connexion refusée";
      case "WALLET_NOT_INSTALLED":
        return "Portefeuille non installé";
      case "INVALID_PROJECT_ID":
        return "Erreur de configuration";
      case "NETWORK_ERROR":
        return "Erreur réseau";
      case "SESSION_EXPIRED":
        return "Session expirée";
      case "SESSION_NOT_FOUND":
        return "Session introuvable";
      case "INVALID_SESSION":
        return "Session invalide";
      case "NOT_CONNECTED":
        return "Non connecté";
      case "INITIALIZATION_FAILED":
        return "Échec de l&apos;initialisation";
      default:
        return "Erreur de connexion au portefeuille";
    }
  };

  // Track last shown error to avoid showing the same error multiple times
  const lastErrorRef = React.useRef<string | null>(null);

  // Show error modal instead of inline error (using useEffect to avoid infinite loop)
  React.useEffect(() => {
    const errorKey = error ? `${error}-${errorCode}` : null;

    if (error && errorKey !== lastErrorRef.current) {
      lastErrorRef.current = errorKey;
      showError(
        getErrorTitle(),
        `${getErrorMessage()}${errorCode ? `\n\nCode: ${errorCode}` : ""}`
      );
    } else if (!error) {
      lastErrorRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, errorCode]); // Only trigger when error changes, not on every render

  // Clear WalletConnect cache (fix for testnet connection issues)
  const clearWalletConnectCache = () => {
    try {
      // Clear all WalletConnect related storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("walletconnect") ||
            key.includes("reown") ||
            key.includes("wc@2"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      console.log(
        "🧹 Cleared WalletConnect cache:",
        keysToRemove.length,
        "items"
      );
      showInfo(
        "Cache nettoyé",
        "Le cache WalletConnect a été nettoyé. Veuillez rafraîchir la page et réessayer."
      );
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  };

  // Handle namespace selection
  const handleConnectClick = () => {
    showModal(
      "Choisir le type de connexion",
      <NamespaceSelector
        onSelect={async (selectedNamespace) => {
          closeModal();
          await connectWallet(selectedNamespace);
        }}
        onCancel={() => {
          closeModal();
        }}
      />,
      "info",
      undefined,
      undefined,
      true // hideButtons since NamespaceSelector has its own
    );
  };

  if (!isConnected) {
    return (
      <div className={`w-full max-w-screen-md mx-auto ${className}`}>
        <Card className="p-6">
          <div className="text-center">
            {isRestoring ? (
              <>
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Restauration de la session
                </h3>
                <p className="text-sm text-gray-600">
                  Vérification d&apos;une session existante...
                </p>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Connecter HashPack
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connectez votre portefeuille HashPack pour accéder aux
                  fonctionnalités blockchain
                </p>
                <Button
                  type="button"
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    "Connecter HashPack"
                  )}
                </Button>
                {isConnecting && (
                  <p className="text-xs text-gray-500 mt-3">
                    Veuillez approuver la connexion dans HashPack
                  </p>
                )}
                <button
                  type="button"
                  onClick={clearWalletConnectCache}
                  className="text-xs text-gray-500 hover:text-gray-700 underline mt-2"
                >
                  Problème de connexion? Nettoyer le cache
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Portefeuille connecté
                  </h3>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${getNamespaceColor(
                      namespace
                    )}`}
                  >
                    {getNamespaceLabel(namespace)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {connection?.accountId
                      ? formatAccountId(connection.accountId)
                      : "N/A"}
                  </p>
                  {connection?.network && (
                    <p className="text-xs text-gray-500">
                      Réseau:{" "}
                      <span className="font-medium">
                        {connection.network === "mainnet"
                          ? "Mainnet"
                          : "Testnet"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col sm:items-end">
                <Button
                  onClick={refreshBalances}
                  disabled={isLoadingBalances}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {isLoadingBalances ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Actualisation...
                    </span>
                  ) : (
                    "Actualiser"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    showModal(
                      "Confirmer la déconnexion",
                      "Êtes-vous sûr de vouloir déconnecter votre portefeuille?",
                      "confirm",
                      async () => {
                        await disconnectWallet();
                        closeModal();
                        showInfo(
                          "Déconnexion réussie",
                          "Votre portefeuille a été déconnecté avec succès."
                        );
                      },
                      closeModal
                    );
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-red-600 border-red-300 hover:bg-red-50"
                >
                  Déconnecter
                </Button>
              </div>
            </div>

            {/* Balances */}
            {showBalances && (
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Soldes
                </h4>

                {isLoadingBalances ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-3">
                      Chargement des soldes...
                    </p>
                  </div>
                ) : balances ? (
                  <div className="space-y-2">
                    {/* HBAR Balance */}
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            ℏ
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          HBAR
                        </span>
                      </div>
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {formatBalance(balances.hbar)} HBAR
                      </span>
                    </div>

                    {/* Token Balances */}
                    {balances.tokens.map((token) => (
                      <div
                        key={token.tokenId}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <span className="text-sm font-semibold text-gray-900 block">
                            {token.symbol}
                          </span>
                          <p className="text-xs text-gray-500 truncate">
                            {token.name}
                          </p>
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-900 whitespace-nowrap">
                          {formatBalance(token.balance, token.decimals)}{" "}
                          {token.symbol}
                        </span>
                      </div>
                    ))}

                    {balances.tokens.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <svg
                          className="w-12 h-12 mx-auto text-gray-400 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-sm text-gray-500">
                          Aucun token trouvé
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <svg
                      className="w-12 h-12 mx-auto text-red-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">
                      Impossible de charger les soldes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
