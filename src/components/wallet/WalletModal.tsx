"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: "confirm" | "error" | "info" | "success";
  onConfirm?: () => void;
  onReject?: () => void;
  hideButtons?: boolean;
}

/**
 * Reusable modal component for wallet-related dialogs
 */
export function WalletModal({
  isOpen,
  onClose,
  title,
  children,
  type = "info",
  onConfirm,
  onReject,
  hideButtons = false,
}: WalletModalProps) {
  console.log('🟪 [WalletModal] Render with isOpen:', isOpen, 'title:', title);
  
  if (!isOpen) {
    console.log('🟪 [WalletModal] Not rendering - isOpen is false');
    return null;
  }
  
  console.log('🟪 [WalletModal] Rendering modal!');

  const getIconColor = () => {
    switch (type) {
      case "error":
        return "text-red-600 bg-red-100";
      case "success":
        return "text-green-600 bg-green-100";
      case "confirm":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "success":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "confirm":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="relative w-full max-w-screen-md transform transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start space-x-4 mb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getIconColor()}`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">{children}</div>

            {/* Buttons */}
            {!hideButtons && (
              <div className="flex space-x-3">
                {type === "confirm" && onConfirm && onReject ? (
                  <>
                    <Button
                      onClick={() => {
                        onReject();
                        onClose();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className="flex-1"
                    >
                      Confirmer
                    </Button>
                  </>
                ) : (
                  <Button onClick={onClose} className="w-full">
                    Fermer
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

