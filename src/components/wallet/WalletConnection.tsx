"use client";

import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useHapticFeedback } from "@/components/ui/HapticFeedback";
import React from "react";
import {
    ArrowPathIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { WalletIcon } from "@heroicons/react/24/solid";

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
        balances,
        isLoadingBalances,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        error,
        errorCode,
    } = useWallet();

    const { modal, showModal, showError, closeModal } = useWalletModal();
    const { triggerHaptic } = useHapticFeedback();
    const [expanded, setExpanded] = React.useState(false);
    const lastErrorRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        const key = error ? `${error}-${errorCode}` : null;
        if (error && key !== lastErrorRef.current) {
            lastErrorRef.current = key;
            const titles: Record<string, string> = {
                CONNECTION_TIMEOUT: "Délai de connexion dépassé",
                CONNECTION_REJECTED: "Connexion refusée",
                WALLET_NOT_INSTALLED: "Portefeuille non détecté",
                INVALID_PROJECT_ID: "Erreur de configuration",
                NETWORK_ERROR: "Erreur réseau",
                SESSION_EXPIRED: "Session expirée",
            };
            showError(
                titles[errorCode ?? ""] ?? "Erreur de portefeuille",
                error
            );
        } else if (!error) {
            lastErrorRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error, errorCode]);

    const formatAccount = (id: string) =>
        id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id;

    const formatHbar = (v: string) => {
        const n = parseFloat(v);
        return Number.isNaN(n) ? "—" : n.toFixed(2);
    };

    // ── Restoring ────────────────────────────────────────────────────────────
    if (isRestoring) {
        return (
            <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Restauration…</span>
            </div>
        );
    }

    // ── Not connected ────────────────────────────────────────────────────────
    if (!isConnected) {
        return (
            <>
                <div className={`w-full ${className}`}>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic("medium");
                            connectWallet("hedera");
                        }}
                        disabled={isConnecting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                    >
                        {isConnecting ? (
                            <>
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                Connexion en cours…
                            </>
                        ) : (
                            <>
                                <WalletIcon className="h-4 w-4" />
                                Connecter le portefeuille
                            </>
                        )}
                    </button>
                </div>
                {modal}
            </>
        );
    }

    // ── Connected ────────────────────────────────────────────────────────────
    const networkLabel = connection?.network === "mainnet" ? "Mainnet" : "Testnet";
    const networkColor =
        connection?.network === "mainnet"
            ? "bg-orange-100 text-orange-700"
            : "bg-emerald-100 text-emerald-700";

    return (
        <>
            <div className={`w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 leading-none mb-0.5">Portefeuille connecté</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono truncate">
                            {connection?.accountId ? formatAccount(connection.accountId) : "—"}
                        </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${networkColor}`}>
                        {networkLabel}
                    </span>

                    {showBalances && (
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic("light");
                                setExpanded((v) => !v);
                                if (!expanded && !balances) refreshBalances();
                            }}
                            className="ml-1 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            aria-label="Afficher les soldes"
                        >
                            {expanded ? (
                                <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic("medium");
                            showModal(
                                "Déconnecter le portefeuille",
                                "Voulez-vous déconnecter votre portefeuille ?",
                                "confirm",
                                async () => {
                                    closeModal();
                                    await disconnectWallet();
                                },
                                closeModal
                            );
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Déconnecter"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Balances panel */}
                {showBalances && expanded && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                        {isLoadingBalances ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                Chargement…
                            </div>
                        ) : balances ? (
                            <div className="space-y-2">
                                {/* HBAR */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">ℏ</span>
                                        <span className="text-sm font-medium text-gray-700">HBAR</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {formatHbar(balances.hbar)}
                                        <span className="ml-1 text-xs text-gray-400">HBAR</span>
                                    </span>
                                </div>

                                {/* Tokens */}
                                {balances.tokens.length > 0 && (
                                    <div className="space-y-1.5 pt-1 border-t border-gray-200">
                                        {balances.tokens.map((token) => (
                                            <div key={token.tokenId} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 truncate max-w-[140px]">
                                                    {token.symbol || token.tokenId}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {parseFloat(token.balance).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic("light");
                                        refreshBalances();
                                    }}
                                    className="mt-1 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    <ArrowPathIcon className="h-3 w-3" />
                                    Actualiser
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <ExclamationCircleIcon className="h-4 w-4" />
                                <span>Aucun solde disponible</span>
                                <button
                                    type="button"
                                    onClick={() => refreshBalances()}
                                    className="ml-auto text-xs text-emerald-600 hover:text-emerald-700"
                                >
                                    Charger
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {modal}
        </>
    );
}
