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
  /**
   * Fires when the connected account changes.
   * NOTE: AppKit's subscribeAccount does not return an unsubscribe handle.
   * Use a ref guard to prevent duplicate registration across re-renders.
   */
  subscribeAccount(
    cb: (account: { address?: string; isConnected?: boolean }) => void,
    namespace?: string
  ): void;
  open(): Promise<void>;
}

// Additional methods present on HederaWalletService but not declared in IWalletService.
// A type guard (isAppKitAware) is used to narrow to this type safely.
interface AppKitAwareService {
  getAppKitInstance(): AppKitLike | null;
  restoreExistingSession(): Promise<WalletConnection | null>;
}

// Type guard: true when the service exposes the AppKit integration methods.
// Uses the `in` operator to avoid unsafe casting.
function isAppKitAware(
  service: IWalletService
): service is IWalletService & AppKitAwareService {
  return (
    "getAppKitInstance" in service &&
    typeof (service as IWalletService & AppKitAwareService).getAppKitInstance === "function" &&
    "restoreExistingSession" in service &&
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

  // Guard to ensure subscribeAccount is registered at most once per AppKit instance.
  // subscribeAccount does not return an unsubscribe handle; the guard prevents the
  // duplicate-listener issue that would occur on component re-mounts.
  const accountSubRegisteredRef = useRef(false);

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

  // Subscribe to AppKit account changes (subscribeAccount).
  // Fires when a wallet connects or disconnects, providing the updated account state.
  // Drives profile updates and balance refreshes on connection events.
  //
  // Important: AppKit's subscribeAccount does not expose an unsubscribe handle.
  // The accountSubRegisteredRef guard ensures it is registered only once per
  // AppKit instance, preventing duplicate callbacks across React re-renders.
  useEffect(() => {
    if (!walletService || isRestoring) return;
    if (accountSubRegisteredRef.current) return;
    if (!isAppKitAware(walletService)) return;

    const appKitInstance = walletService.getAppKitInstance();
    if (!appKitInstance) return;

    accountSubRegisteredRef.current = true;

    appKitInstance.subscribeAccount(
      (account: { address?: string; isConnected?: boolean }) => {
        if (account.isConnected && account.address) {
          // Wallet connected — sync state from the service
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
          // Wallet disconnected
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
  }, [walletService, isRestoring, user, updateUserWalletAddress, loadBalances]);

  // Open the AppKit modal directly
  const openModal = useCallback(async () => {
    if (!walletService || !isAppKitAware(walletService)) return;
    const appKitInstance = walletService.getAppKitInstance();
    if (appKitInstance) await appKitInstance.open();
  }, [walletService]);

  // Connect wallet: opens the AppKit modal directly.
  // subscribeAccount (above) detects the connection result and updates state.
  // subscribeState clears isConnecting if the modal is dismissed without connecting.
  const connectWallet = useCallback(
    async (_namespace: "hedera" | "eip155" = "hedera") => {
      if (isConnecting || isConnected || !walletService) return;

      setIsConnecting(true);
      setError(null);
      setErrorCode(null);

      try {
        await openModal();
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
      setConnection(null);
      setIsConnected(false);
      setNamespace(null);
      setBalances(null);
      setError(null);
      setErrorCode(null);
      if (user) await updateUserWalletAddress(null);
    } catch (err: unknown) {
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
