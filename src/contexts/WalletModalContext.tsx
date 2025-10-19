"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface WalletModalState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  type: "confirm" | "error" | "info" | "success";
  onConfirm?: () => void;
  onReject?: () => void;
  hideButtons?: boolean;
}

interface WalletModalContextType {
  modal: WalletModalState;
  showModal: (
    title: string,
    content: React.ReactNode,
    type?: "confirm" | "error" | "info" | "success",
    onConfirm?: () => void,
    onReject?: () => void,
    hideButtons?: boolean
  ) => void;
  showError: (message: string, details?: string) => void;
  showSuccess: (message: string, details?: string) => void;
  showInfo: (title: string, message: string) => void;
  closeModal: () => void;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(
  undefined
);

export function WalletModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modal, setModal] = useState<WalletModalState>({
    isOpen: false,
    title: "",
    content: null,
    type: "info",
  });

  const showModal = useCallback(
    (
      title: string,
      content: React.ReactNode,
      type: "confirm" | "error" | "info" | "success" = "info",
      onConfirm?: () => void,
      onReject?: () => void,
      hideButtons?: boolean
    ) => {
      setModal({
        isOpen: true,
        title,
        content,
        type,
        onConfirm,
        onReject,
        hideButtons,
      });
    },
    []
  );

  const showError = useCallback(
    (message: string, details?: string) => {
      const content = details ? `${message}\n\nDétails: ${details}` : message;
      showModal("Erreur", content, "error");
    },
    [showModal]
  );

  const showSuccess = useCallback(
    (message: string, details?: string) => {
      const content = details ? `${message}\n\n${details}` : message;
      showModal("Succès", content, "success");
    },
    [showModal]
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      showModal(title, message, "info");
    },
    [showModal]
  );

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <WalletModalContext.Provider
      value={{
        modal,
        showModal,
        showError,
        showSuccess,
        showInfo,
        closeModal,
      }}
    >
      {children}
    </WalletModalContext.Provider>
  );
}

export function useWalletModalContext() {
  const context = useContext(WalletModalContext);
  if (context === undefined) {
    throw new Error(
      "useWalletModalContext must be used within a WalletModalProvider"
    );
  }
  return context;
}
