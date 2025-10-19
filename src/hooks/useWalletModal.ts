// Hook for managing wallet-related modals
// Now uses WalletModalContext for global state management
"use client";

import { useCallback } from "react";
import { Transaction } from "@hashgraph/sdk";
import { useWalletModalContext } from "@/contexts/WalletModalContext";

export function useWalletModal() {
  const context = useWalletModalContext();

  const showTransactionConfirm = useCallback(
    (transaction: Transaction, onConfirm: () => void, onReject: () => void) => {
      context.showModal(
        "Confirmer la transaction",
        "Veuillez vérifier les détails de la transaction avant de confirmer.",
        "confirm",
        onConfirm,
        onReject
      );
    },
    [context]
  );

  return {
    ...context,
    showTransactionConfirm,
  };
}

