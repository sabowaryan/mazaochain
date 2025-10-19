"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface NamespaceSelectorProps {
  onSelect: (namespace: "hedera" | "eip155") => void;
  onCancel?: () => void;
}

/**
 * Component for selecting between Hedera Native and EVM namespaces
 */
export function NamespaceSelector({
  onSelect,
  onCancel,
}: NamespaceSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choisissez le type de connexion pour votre wallet HashPack:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hedera Native */}
        <Card
          className="p-4 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all"
          onClick={() => onSelect("hedera")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Hedera Native
              </h3>
              <p className="text-sm text-gray-600">
                Pour les transactions HBAR et tokens HTS (Hedera Token Service)
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Recommandé
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Hedera EVM */}
        <Card
          className="p-4 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all"
          onClick={() => onSelect("eip155")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Hedera EVM</h3>
              <p className="text-sm text-gray-600">
                Pour les smart contracts Solidity et compatibilité Ethereum
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Avancé
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Conseil:</strong> Si vous n&apos;êtes pas sûr, choisissez{" "}
              <strong>Hedera Native</strong>. C&apos;est le mode standard pour
              les transactions HBAR et tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

