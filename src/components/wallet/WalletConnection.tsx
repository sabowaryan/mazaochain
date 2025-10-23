// Wallet connection component
"use client";

import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWalletModal } from "@/hooks/useWalletModal";
import { NamespaceSelector } from "./NamespaceSelector";
import { useHapticFeedback } from "@/components/ui/HapticFeedback";
import React from "react";
import {
    WalletIcon,
    ArrowPathIcon,
    LinkIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    ChartBarIcon,
    ClipboardDocumentIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import {
    WalletIcon as WalletIconSolid,
    CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

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

    const { triggerHaptic } = useHapticFeedback();
    const [showBalanceDetails, setShowBalanceDetails] = React.useState(false);

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
                <Card className="p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-xl">
                    <div className="text-center">
                        {isRestoring ? (
                            <>
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                                        <ArrowPathIcon className="animate-spin h-10 w-10 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Restauration de la session
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Vérification d&apos;une session existante...
                                </p>
                                <div className="flex justify-center">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-teal-200 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                                        <WalletIconSolid className="w-10 h-10 text-emerald-600" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    Connecter votre Wallet
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-screen-sm mx-auto">
                                    Connectez votre portefeuille HashPack pour accéder aux fonctionnalités blockchain de MazaoChain
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        handleConnectClick();
                                    }}
                                    disabled={isConnecting}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    {isConnecting ? (
                                        <span className="flex items-center justify-center">
                                            <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                            Connexion en cours...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <LinkIcon className="w-5 h-5 mr-2" />
                                            Connecter HashPack
                                        </span>
                                    )}
                                </Button>
                                {isConnecting && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-700 font-medium">
                                            💡 Veuillez approuver la connexion dans HashPack
                                        </p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        clearWalletConnectCache();
                                    }}
                                    className="text-sm text-gray-500 hover:text-emerald-600 underline mt-4 transition-colors duration-200"
                                >
                                    🔧 Problème de connexion? Nettoyer le cache
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
                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-emerald-100 shadow-xl">
                    <div className="space-y-6">
                        {/* Connection Status */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIconSolid className="w-6 h-6 text-emerald-500" />
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Wallet Connecté
                                        </h3>
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getNamespaceColor(
                                            namespace
                                        )}`}
                                    >
                                        {getNamespaceLabel(namespace)}
                                    </span>
                                </div>
                                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                                        <p className="text-sm font-mono text-gray-700 break-all">
                                            {connection?.accountId
                                                ? formatAccountId(connection.accountId)
                                                : "N/A"}
                                        </p>
                                    </div>
                                    {connection?.network && (
                                        <div className="flex items-center gap-2">
                                            <ChartBarIcon className="w-4 h-4 text-gray-500" />
                                            <p className="text-sm text-gray-600">
                                                Réseau:{" "}
                                                <span className="font-semibold text-emerald-600">
                                                    {connection.network === "mainnet"
                                                        ? "Mainnet"
                                                        : "Testnet"}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 sm:flex-col sm:items-end">
                                <Button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        refreshBalances();
                                    }}
                                    disabled={isLoadingBalances}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                                >
                                    {isLoadingBalances ? (
                                        <span className="flex items-center gap-2">
                                            <ArrowPathIcon className="animate-spin h-4 w-4" />
                                            Actualisation...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ArrowPathIcon className="h-4 w-4" />
                                            Actualiser
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        triggerHaptic('medium');
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
                                    className="flex-1 sm:flex-none text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                                >
                                    <span className="flex items-center gap-2">
                                        <XMarkIcon className="h-4 w-4" />
                                        Déconnecter
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Balances */}
                        {showBalances && (
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                                        Soldes du Wallet
                                    </h4>
                                    <button
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setShowBalanceDetails(!showBalanceDetails);
                                        }}
                                        className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        {showBalanceDetails ? (
                                            <>
                                                <EyeSlashIcon className="w-4 h-4" />
                                                Masquer détails
                                            </>
                                        ) : (
                                            <>
                                                <EyeIcon className="w-4 h-4" />
                                                Voir détails
                                            </>
                                        )}
                                    </button>
                                </div>

                                {isLoadingBalances ? (
                                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <div className="flex justify-center mb-4">
                                            <ArrowPathIcon className="animate-spin h-10 w-10 text-emerald-600" />
                                        </div>
                                        <p className="text-gray-600 font-medium">
                                            Chargement des soldes...
                                        </p>
                                        <div className="flex justify-center mt-3">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : balances ? (
                                    <div className="space-y-3">
                                        {/* HBAR Balance */}
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-sm font-bold">
                                                        ℏ
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-base font-bold text-gray-900 block">
                                                        HBAR
                                                    </span>
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        Hedera Hashgraph
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-gray-900 block">
                                                    {formatBalance(balances.hbar, 2)}
                                                </span>
                                                <span className="text-xs text-gray-500">HBAR</span>
                                            </div>
                                        </div>

                                        {/* Token Balances */}
                                        {balances.tokens.map((token, index) => (
                                            <div
                                                key={token.tokenId}
                                                className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 group"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${token.symbol === 'USDC' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                                        token.symbol === 'MAZAO' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                                                            'bg-gradient-to-br from-purple-500 to-purple-600'
                                                        }`}>
                                                        <span className="text-white text-xs font-bold">
                                                            {token.symbol.slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-base font-bold text-gray-900 block">
                                                            {token.symbol}
                                                        </span>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {token.name}
                                                        </p>
                                                        {showBalanceDetails && (
                                                            <p className="text-xs text-gray-400 font-mono truncate mt-1">
                                                                ID: {token.tokenId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-gray-900 block">
                                                        {formatBalance(token.balance, token.decimals)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{token.symbol}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {balances.tokens.length === 0 && (
                                            <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                                                <BanknotesIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                                <p className="text-gray-500 font-medium">
                                                    Aucun token trouvé
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Les tokens apparaîtront ici une fois ajoutés à votre wallet
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200">
                                        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-3" />
                                        <p className="text-red-600 font-bold mb-2">
                                            Impossible de charger les soldes
                                        </p>
                                        <p className="text-sm text-red-500">
                                            Veuillez actualiser ou vérifier votre connexion
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