"use client";

import { WalletModalProvider } from "@/contexts/WalletModalContext";
import { WalletModal } from "./WalletModal";
import { useWalletModalContext } from "@/contexts/WalletModalContext";

function WalletModalRenderer() {
  const { modal, closeModal } = useWalletModalContext();

  return (
    <WalletModal
      isOpen={modal.isOpen}
      onClose={closeModal}
      title={modal.title}
      type={modal.type}
      onConfirm={modal.onConfirm}
      onReject={modal.onReject}
      hideButtons={modal.hideButtons}
    >
      {modal.content}
    </WalletModal>
  );
}

export function WalletModalGlobalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletModalProvider>
      {children}
      <WalletModalRenderer />
    </WalletModalProvider>
  );
}
