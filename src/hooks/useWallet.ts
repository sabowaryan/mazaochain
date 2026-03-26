// React hook for Hedera wallet management - v2
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WalletConnection,
  WalletBalances,
  WalletErrorCode,
  WalletError,
} from "@/types/wallet";
import type { IWalletService } from "@/lib/wallet/wallet-service-factory";
import { useAuth } from "@/hooks/useAuth";

// Minimal interface for the AppKit instance methods used by this hook.
// Typed precisely to avoid `any` while remaining decoupled from the full AppKit type.
interface AppKitLike {
  /** Fires on every AppKit state change (modal open/close, loading, etc.) */
  subscribeState(cb: (state: { open: boolean }) => void): () => void;
  /** Open the AppKit modal, optionally scoped to a chain namespace. */
  open(options?: { namespace?: string; view?: string }): Promise<void>;
}

// Additional methods present on HederaWalletService but not declared in IWalletService.
// A type guard (isAppKitAware) is used to narrow to this type safely.
interface AppKitAwareService {
  /**
   * Subscribe to wallet account changes. Registers AppKit's subscribeAccount exactly
   * once at the service level and fans out to all registered callbacks.
   * Returns a real unsubscribe function scoped to the caller's callback.
   */
  subscribeToAccountChanges(
    cb: (account: { address?: string; isConnected?: boolean }) => void
  ): () => void;
  getAppKitInstance(): AppKitLike | null;
  restoreExistingSession(): Promise<WalletConnection | null>;
}

// Type guard: true when the service exposes the AppKit integration methods.
// Uses the `in` operator to avoid unsafe casting.
function isAppKitAware(
  service: IWalletService
): service is IWalletService & AppKitAwareService {
  return (
    "subscribeToAccountChanges" in service &&
    "getAppKitInstance" in service &&
    "restoreExistingSession" in service &&
    typeof (service as IWalletService & AppKitAwareService).subscribeToAccountChanges === "function" &&
    typeof (service as IWalletService & AppKitAwareService).getAppKitInstance === "function" &&
    typeof (service as IWalletService & AppKitAwareService).restoreExistingSession === "function"
  );
}

export interface UseWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isRestoring: boolean;
  connection: WalletConnection | null;
  namespace: "hedera" | "eip155" | null;

  // Balance state
  balances: WalletBalances | null;
  isLoadingBalances: boolean;

  // Actions
  connectWallet: (namespace?: "hedera" | "eip155") => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  openModal: () => Promise<void>;

  // Error state
  error: string | null;
  errorCode: WalletErrorCode | null;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [namespace, setNamespace] = useState<"hedera" | "eip155" | null>(null);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<WalletErrorCode | null>(null);
  const [walletService, setWalletService] = useState<IWalletService | null>(null);

  const { user } = useAuth();

  // Refs to track latest state inside subscription callbacks (avoids stale closures).
  // Updated unconditionally after every render so they are always current.
  const isConnectedRef = useRef(isConnected);
  const isConnectingRef = useRef(isConnecting);
  useEffect(() => {
    isConnectedRef.current = isConnected;
    isConnectingRef.current = isConnecting;
  });

  // Load wallet service dynamically (browser-only, only once)
  useEffect(() => {
    if (typeof window !== "undefined" && !walletService) {
      import("@/lib/wallet/wallet-service-factory")
        .then(async (module) => {
          const service = await module.getWalletService();
          setWalletService(service);
        })
        .catch((err) => {
          console.error("Failed to load wallet service:", err);
          setError("Failed to load wallet service");
        });
    }
  }, []); // Empty deps — run once on mount

  // Load balances for a given accountId
  const loadBalances = useCallback(
    async (accountId?: string) => {
      if (!walletService) return;

      setIsLoadingBalances(true);
      try {
        const walletBalances = await walletService.getAccountBalance(accountId);
        setBalances(walletBalances);
      } catch (err) {
        console.warn("Failed to load balances:", err);

        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          setBalances({ hbar: "0", tokens: [] });
        } else {
          if (err instanceof WalletError) {
            setError(err.message);
            setErrorCode(err.code);
          } else {
            setError("Échec du chargement des soldes du portefeuille");
            setErrorCode(WalletErrorCode.UNKNOWN_ERROR);
          }
        }
      } finally {
        setIsLoadingBalances(false);
      }
    },
    [walletService]
  );

  // Initialize wallet service and attempt to restore an existing session
  useEffect(() => {
    if (!walletService) return;

    let mounted = true;

    const initializeWallet = async () => {
      setIsRestoring(true);
      try {
        await walletService.initialize();

        if (!mounted) return;

        const existingConnection = isAppKitAware(walletService)
          ? await walletService.restoreExistingSession()
          : null;
        const finalConnection =
          existingConnection || walletService.getConnectionState();
        if (finalConnection?.isConnected) {
          setConnection(finalConnection);
          setIsConnected(true);
          setNamespace(finalConnection.namespace);
          await loadBalances(finalConnection.accountId);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to initialize wallet:", err);
        if (err instanceof WalletError) {
          setError(err.message);
          setErrorCode(err.code);
        } else {
          setError("Échec de l'initialisation du service de portefeuille");
          setErrorCode(WalletErrorCode.INITIALIZATION_FAILED);
        }
      } finally {
        if (mounted) setIsRestoring(false);
      }
    };

    initializeWallet();

    return () => {
      mounted = false;
    };
  }, [walletService, loadBalances]);

  // Helper: update the user's wallet address in the remote profile
  const updateUserWalletAddress = useCallback(
    async (walletAddress: string | null) => {
      if (!user) return;
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update wallet address");
        }
      } catch (err) {
        console.error("Failed to update wallet address:", err);
        throw new Error(
          "Échec de la mise à jour de l'adresse du portefeuille dans le profil"
        );
      }
    },
    [user]
  );

  // Subscribe to AppKit state changes (subscribeState).
  // Detects modal close while in "connecting" state (user dismissed without connecting).
  // Also syncs walletService connection state if it diverges from React state.
  useEffect(() => {
    if (!walletService || isRestoring) return;
    if (!isAppKitAware(walletService)) return;

    const appKitInstance = walletService.getAppKitInstance();
    if (!appKitInstance) return;

    const unsubState = appKitInstance.subscribeState(
      (state: { open: boolean }) => {
        // Modal just closed while we were still waiting — clear the loading indicator
        if (!state.open && isConnectingRef.current && !isConnectedRef.current) {
          setIsConnecting(false);
        }

        // Keep React state in sync with the service in case of out-of-band changes
        const currentState = walletService.getConnectionState();
        const serviceConnected = currentState?.isConnected ?? false;
        if (serviceConnected !== isConnectedRef.current) {
          if (serviceConnected && currentState) {
            setConnection(currentState);
            setIsConnected(true);
            setNamespace(currentState.namespace);
            loadBalances(currentState.accountId);
          } else {
            setConnection(null);
            setIsConnected(false);
            setNamespace(null);
            setBalances(null);
          }
        }
      }
    );

    return () => {
      if (typeof unsubState === "function") unsubState();
    };
  }, [walletService, isRestoring, loadBalances]);

  // Subscribe to AppKit account changes via the service's subscribeToAccountChanges.
  // The service registers AppKit's subscribeAccount exactly once at the singleton level
  // and fans out to all hook instances. Each hook instance receives a real unsubscribe
  // function — no duplicate listeners regardless of how many components mount this hook.
  useEffect(() => {
    if (!walletService || isRestoring) return;
    if (!isAppKitAware(walletService)) return;

    const unsubAccount = walletService.subscribeToAccountChanges(
      (account: { address?: string; isConnected?: boolean }) => {
        if (account.isConnected) {
          // Wallet connected — sync state from the service.
          // Note: account.address may be '' for Hedera (HederaAdapter.connect()
          // always returns address:'' — the service enriches it from the WalletConnect
          // session, but we also fall back to walletService.getConnectionState() here
          // for defence-in-depth.
          setIsConnecting(false);
          const currentState = walletService.getConnectionState();
          if (currentState?.isConnected) {
            setConnection(currentState);
            setIsConnected(true);
            setNamespace(currentState.namespace);
            if (user && currentState.accountId) {
              updateUserWalletAddress(currentState.accountId).catch(console.error);
            }
            loadBalances(currentState.accountId).catch(console.error);
          }
        } else if (!account.isConnected) {
          // Wallet disconnected — isConnected may be false, undefined, or null
          setIsConnecting(false);
          setConnection(null);
          setIsConnected(false);
          setNamespace(null);
          setBalances(null);
          if (user) {
            updateUserWalletAddress(null).catch(console.error);
          }
        }
      }
    );

    return () => {
      if (typeof unsubAccount === "function") unsubAccount();
    };
  }, [walletService, isRestoring, user, updateUserWalletAddress, loadBalances]);

  // Open the AppKit modal, defaulting to the "hedera" namespace so the wallet picker
  // scopes itself to Hedera-compatible wallets (e.g. HashPack) without any selector UI.
  const openModal = useCallback(
    async (namespace: "hedera" | "eip155" = "hedera") => {
      if (!walletService || !isAppKitAware(walletService)) return;
      const appKitInstance = walletService.getAppKitInstance();
      if (appKitInstance) await appKitInstance.open({ namespace });
    },
    [walletService]
  );

  // Connect wallet: opens the AppKit modal scoped to the given namespace (default "hedera").
  // subscribeToAccountChanges detects the connection result and updates state.
  // subscribeState clears isConnecting if the modal is dismissed without connecting.
  const connectWallet = useCallback(
    async (namespace: "hedera" | "eip155" = "hedera") => {
      if (isConnecting || isConnected || !walletService) return;

      setIsConnecting(true);
      setError(null);
      setErrorCode(null);

      try {
        await openModal(namespace);
      } catch (err: unknown) {
        if (err instanceof WalletError) {
          switch (err.code) {
            case WalletErrorCode.CONNECTION_REJECTED:
              setError("Connexion refusée dans HashPack");
              break;
            case WalletErrorCode.CONNECTION_TIMEOUT:
              setError("La connexion a expiré. Veuillez réessayer.");
              break;
            case WalletErrorCode.WALLET_NOT_INSTALLED:
              setError(
                "HashPack n'est pas installé. Veuillez installer l'extension HashPack."
              );
              break;
            case WalletErrorCode.INVALID_PROJECT_ID:
              setError("Configuration invalide. Veuillez contacter le support.");
              break;
            case WalletErrorCode.NETWORK_ERROR:
              setError(
                "Problème de connexion réseau. Vérifiez votre connexion internet."
              );
              break;
            default:
              setError(err.message);
          }
          setErrorCode(err.code);
          setIsConnecting(false);
        } else {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Échec de la connexion au portefeuille";
          if (errorMessage !== "MODAL_CLOSED_BY_USER") {
            setError(errorMessage);
            setErrorCode(WalletErrorCode.UNKNOWN_ERROR);
          }
          setIsConnecting(false);
        }
      }
    },
    [isConnecting, isConnected, walletService, openModal]
  );

  const disconnectWallet = useCallback(async () => {
    if (!walletService) return;
    try {
      await walletService.disconnectWallet();
      setError(null);
      setErrorCode(null);
      if (user) await updateUserWalletAddress(null);
    } catch (err: unknown) {
      // Log the error but do NOT block the UI reset — the session is considered
      // locally cleared even if the remote disconnect fails.
      if (err instanceof WalletError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Échec de la déconnexion du portefeuille";
        setError(errorMessage);
        setErrorCode(WalletErrorCode.UNKNOWN_ERROR);
      }
    } finally {
      // Always clear UI state on disconnect, regardless of remote errors
      setConnection(null);
      setIsConnected(false);
      setNamespace(null);
      setBalances(null);
    }
  }, [updateUserWalletAddress, user, walletService]);

  const refreshBalances = useCallback(async () => {
    if (!connection?.accountId) return;
    await loadBalances(connection.accountId);
  }, [connection?.accountId, loadBalances]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  return {
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
    openModal,
    error,
    errorCode,
    clearError,
  };
}
