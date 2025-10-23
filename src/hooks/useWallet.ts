// React hook for Hedera wallet management - v2
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  WalletConnection,
  WalletBalances,
  WalletErrorCode,
  WalletError,
} from "@/types/wallet";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

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
      const walletBalances = await walletService.getAccountBalance(
        accountId
      );
      setBalances(walletBalances);
    } catch (err) {
      console.warn("Failed to load balances:", err);
      
      // If account doesn't exist (404), show zero balance instead of error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setBalances({
          hbar: "0",
          tokens: [],
        });
      } else {
        // Only show error for non-404 errors
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

        // Note: Session event listeners are set up in the service itself
        // The service handles accountsChanged, chainChanged, session_update, and session_delete events
        // This hook will poll the service state when needed

        // Attempt to restore existing session
        const existingConnection = walletService.getConnectionState();
        if (existingConnection && existingConnection.isConnected) {
          setConnection(existingConnection);
          setIsConnected(true);
          setNamespace(existingConnection.namespace);

          // Load balances if connected
          await loadBalances(existingConnection.accountId);
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

  // Poll wallet service state to detect connection changes (reduced frequency)
  useEffect(() => {
    if (!walletService || isRestoring) return;
    
    const pollInterval = setInterval(() => {
      const currentState = walletService.getConnectionState();
      
      // Update state if connection status changed
      if (currentState?.isConnected !== isConnected) {
        if (currentState?.isConnected) {
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
    }, 2000); // Poll every 2 seconds (reduced from 1s)

    return () => clearInterval(pollInterval);
  }, [walletService, isConnected, isRestoring, loadBalances]);

  const updateUserWalletAddress = useCallback(
    async (walletAddress: string | null) => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ wallet_address: walletAddress })
          .eq("id", user.id);

        if (updateError) {
          throw updateError;
        }

        // Note: Profile will be updated automatically via useAuth subscription
      } catch (err) {
        console.error("Failed to update wallet address:", err);
        throw new Error(
          "Échec de la mise à jour de l'adresse du portefeuille dans le profil"
        );
      }
    },
    [user]
  );

  const connectWallet = useCallback(
    async (selectedNamespace: "hedera" | "eip155" = "hedera") => {
      if (isConnecting || isConnected || !walletService) return;

      setIsConnecting(true);
      setError(null);
      setErrorCode(null);

      try {
        const walletConnection = await walletService.connectWallet(
          selectedNamespace
        );

        setConnection(walletConnection);
        setIsConnected(true);
        setNamespace(walletConnection.namespace);

        // Update user profile with wallet address
        if (user && walletConnection.accountId) {
          await updateUserWalletAddress(walletConnection.accountId);
        }

        // Load balances
        await loadBalances(walletConnection.accountId);
      } catch (err: unknown) {
        if (err instanceof WalletError) {
          // Handle specific error codes
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
              setError(
                "Configuration invalide. Veuillez contacter le support."
              );
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
        } else {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Échec de la connexion au portefeuille";

          // Si l'utilisateur a fermé le modal, ne pas afficher d'erreur
          if (errorMessage !== "MODAL_CLOSED_BY_USER") {
            setError(errorMessage);
            setErrorCode(WalletErrorCode.UNKNOWN_ERROR);
          }
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [isConnecting, isConnected, user, updateUserWalletAddress, walletService, loadBalances]
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
    error,
    errorCode,
    clearError,
  };
}
