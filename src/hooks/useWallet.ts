// React hook for Hedera wallet management - v2
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WalletConnection,
  WalletBalances,
  WalletErrorCode,
  WalletError,
} from "@/types/wallet";
import { useAuth } from "@/hooks/useAuth";

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
  const [walletService, setWalletService] = useState<any>(null);

  const { user } = useAuth();

  // Refs to track latest state inside subscription callbacks (avoids stale closures)
  const isConnectedRef = useRef(isConnected);
  const isConnectingRef = useRef(isConnecting);
  useEffect(() => {
    isConnectedRef.current = isConnected;
    isConnectingRef.current = isConnecting;
  });

  // Load wallet service dynamically (only once)
  useEffect(() => {
    if (typeof window !== 'undefined' && !walletService) {
      import("@/lib/wallet/wallet-service-factory").then(async (module) => {
        const service = await module.getWalletService();
        setWalletService(service);
      }).catch(err => {
        console.error('Failed to load wallet service:', err);
        setError('Failed to load wallet service');
      });
    }
  }, []); // Empty deps - only run once

  // Load balances function
  const loadBalances = useCallback(async (accountId?: string) => {
    if (!walletService) return;
    
    setIsLoadingBalances(true);
    try {
      const walletBalances = await walletService.getAccountBalance(accountId);
      setBalances(walletBalances);
    } catch (err) {
      console.warn("Failed to load balances:", err);
      
      // If account doesn't exist (404), show zero balance instead of error
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
  }, [walletService]);

  // Initialize wallet service and restore existing session (only once per service instance)
  useEffect(() => {
    if (!walletService) return;

    let mounted = true;
    
    const initializeWallet = async () => {
      setIsRestoring(true);
      try {
        // Initialize will return immediately if already initialized (singleton pattern)
        await walletService.initialize();

        if (!mounted) return;

        // Attempt to restore existing session
        const existingConnection = await walletService.restoreExistingSession();
        const finalConnection = existingConnection || walletService.getConnectionState();
        if (finalConnection && finalConnection.isConnected) {
          setConnection(finalConnection);
          setIsConnected(true);
          setNamespace(finalConnection.namespace);

          // Load balances if connected
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
        if (mounted) {
          setIsRestoring(false);
        }
      }
    };

    initializeWallet();

    return () => {
      mounted = false;
    };
  }, [walletService, loadBalances]);

  // Helper to update the user's wallet address in the profile
  const updateUserWalletAddress = useCallback(
    async (walletAddress: string | null) => {
      if (!user) return;

      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update wallet address');
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

  // Subscribe to AppKit state changes (subscribeState) to detect modal open/close.
  // When the modal closes without a connection being established, clear isConnecting.
  // Also syncs connection state if walletService detects a change.
  useEffect(() => {
    if (!walletService || isRestoring) return;

    const appKitInstance = (walletService as any).getAppKitInstance?.();
    if (!appKitInstance || typeof appKitInstance.subscribeState !== "function") return;

    const unsubState = appKitInstance.subscribeState((state: { open: boolean }) => {
      // Modal just closed while we were waiting for a connection — clear loading state
      if (!state.open && isConnectingRef.current && !isConnectedRef.current) {
        setIsConnecting(false);
      }

      // Sync walletService connection state in case it changed outside of the events path
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
    });

    return () => {
      if (typeof unsubState === "function") unsubState();
    };
  }, [walletService, isRestoring, loadBalances]);

  // Subscribe to AppKit account events (subscribeEvents) for CONNECT_SUCCESS /
  // DISCONNECT_SUCCESS. These provide authoritative notification of wallet state
  // changes and drive profile updates + balance refreshes.
  useEffect(() => {
    if (!walletService || isRestoring) return;

    const appKitInstance = (walletService as any).getAppKitInstance?.();
    if (!appKitInstance || typeof appKitInstance.subscribeEvents !== "function") return;

    const unsubEvents = appKitInstance.subscribeEvents(async (events: any) => {
      const eventName = events?.data?.event as string | undefined;

      if (eventName === "CONNECT_SUCCESS") {
        setIsConnecting(false);
        const currentState = walletService.getConnectionState();
        if (currentState?.isConnected) {
          setConnection(currentState);
          setIsConnected(true);
          setNamespace(currentState.namespace);
          // Persist wallet address to user profile
          if (user && currentState.accountId) {
            await updateUserWalletAddress(currentState.accountId).catch(console.error);
          }
          await loadBalances(currentState.accountId).catch(console.error);
        }
      } else if (eventName === "DISCONNECT_SUCCESS") {
        setIsConnecting(false);
        setConnection(null);
        setIsConnected(false);
        setNamespace(null);
        setBalances(null);
        if (user) {
          await updateUserWalletAddress(null).catch(console.error);
        }
      }
    });

    return () => {
      if (typeof unsubEvents === "function") unsubEvents();
    };
  }, [walletService, isRestoring, user, updateUserWalletAddress, loadBalances]);

  // Open the AppKit modal directly using the AppKit instance.
  // Works for both initial connection and account management views.
  const openModal = useCallback(async () => {
    if (!walletService) return;
    const appKitInstance = (walletService as any).getAppKitInstance?.();
    if (appKitInstance) {
      await appKitInstance.open();
    }
  }, [walletService]);

  // Connect wallet: opens the AppKit modal directly and lets reactive subscriptions
  // (subscribeState + subscribeEvents) handle state synchronisation.
  const connectWallet = useCallback(
    async (_namespace: "hedera" | "eip155" = "hedera") => {
      if (isConnecting || isConnected || !walletService) return;

      setIsConnecting(true);
      setError(null);
      setErrorCode(null);

      try {
        // Open AppKit modal — the user picks their wallet inside the modal.
        // CONNECT_SUCCESS / DISCONNECT_SUCCESS events (subscribeEvents above) drive
        // the actual state update; subscribeState clears isConnecting if modal closes
        // without a connection.
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

      // Remove wallet address from user profile
      if (user) {
        await updateUserWalletAddress(null);
      }
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
