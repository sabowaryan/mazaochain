// React hook for Hedera wallet management
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  hederaWalletService,
  WalletConnection,
  WalletBalances,
} from "@/lib/wallet/hedera-wallet";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export interface UseWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connection: WalletConnection | null;

  // Balance state
  balances: WalletBalances | null;
  isLoadingBalances: boolean;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;

  // Error state
  error: string | null;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Initialize wallet service and check existing connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await hederaWalletService.initialize();

        // Check if there's an existing connection
        const existingConnection = hederaWalletService.getConnectionState();
        if (existingConnection && existingConnection.isConnected) {
          setConnection(existingConnection);
          setIsConnected(true);

          // Load balances if connected
          await loadBalances(existingConnection.accountId);
        }
      } catch (err) {
        console.error("Failed to initialize wallet:", err);
        setError("Échec de l'initialisation du service de portefeuille");
      }
    };

    initializeWallet();
  }, []);

  const loadBalances = async (accountId?: string) => {
    setIsLoadingBalances(true);
    try {
      const walletBalances = await hederaWalletService.getAccountBalance(
        accountId
      );
      setBalances(walletBalances);
    } catch (err) {
      console.error("Failed to load balances:", err);
      setError("Échec du chargement des soldes du portefeuille");
    } finally {
      setIsLoadingBalances(false);
    }
  };

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

  const connectWallet = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const walletConnection = await hederaWalletService.connectWallet();

      setConnection(walletConnection);
      setIsConnected(true);

      // Update user profile with wallet address
      if (user && walletConnection.accountId) {
        await updateUserWalletAddress(walletConnection.accountId);
      }

      // Load balances
      await loadBalances(walletConnection.accountId);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Échec de la connexion au portefeuille"
      );
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, user, updateUserWalletAddress]);

  const disconnectWallet = useCallback(async () => {
    try {
      await hederaWalletService.disconnectWallet();

      setConnection(null);
      setIsConnected(false);
      setBalances(null);

      // Remove wallet address from user profile
      if (user) {
        await updateUserWalletAddress(null);
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Échec de la déconnexion du portefeuille"
      );
    }
  }, [updateUserWalletAddress, user]);

  const refreshBalances = useCallback(async () => {
    if (!connection?.accountId) return;
    await loadBalances(connection.accountId);
  }, [connection?.accountId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    connection,
    balances,
    isLoadingBalances,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    error,
    clearError,
  };
}
