'use client';

import { Card } from '@/components/ui/Card';
import { AppKitWalletButton } from './AppKitWalletButton';
import { EnhancedWalletStatus } from './EnhancedWalletStatus';
import { useWallet } from '@/hooks/useWallet';

export function WalletShowcase() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Wallet Components Showcase
        </h2>
        <p className="text-gray-600">
          Démonstration des composants wallet avec intégration AppKit
        </p>
      </div>

      {/* AppKit Wallet Buttons */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          AppKit Wallet Buttons
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Connect Button</h4>
            <AppKitWalletButton variant="connect" size="sm" />
            <AppKitWalletButton variant="connect" size="md" />
            <AppKitWalletButton variant="connect" size="lg" />
          </div>
          
          {isConnected && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Account Button</h4>
                <AppKitWalletButton variant="account" size="sm" />
                <AppKitWalletButton variant="account" size="md" />
                <AppKitWalletButton variant="account" size="lg" />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Network Button</h4>
                <AppKitWalletButton variant="network" size="sm" />
                <AppKitWalletButton variant="network" size="md" />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Enhanced Wallet Status */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Enhanced Wallet Status
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Compact Variant</h4>
            <EnhancedWalletStatus variant="compact" showNetwork={true} />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Variant</h4>
            <EnhancedWalletStatus 
              variant="detailed" 
              showBalance={true} 
              showNetwork={true} 
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Dropdown Variant</h4>
            <div className="flex justify-start">
              <EnhancedWalletStatus 
                variant="dropdown" 
                showBalance={true} 
                showNetwork={true} 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Features Overview */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🚀 Fonctionnalités AppKit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-emerald-700">Modales Natives</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Modal de connexion wallet</li>
              <li>• Modal de détails du compte</li>
              <li>• Modal de sélection réseau</li>
              <li>• Modal de gestion des tokens</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-emerald-700">Interactions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Connexion/Déconnexion</li>
              <li>• Changement de réseau</li>
              <li>• Copie d'adresses</li>
              <li>• Feedback haptique</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200">
          <p className="text-sm text-gray-700">
            <strong>💡 Astuce :</strong> Tous les composants utilisent les modales AppKit natives 
            pour une expérience utilisateur cohérente et moderne. Les modales s'ouvrent 
            automatiquement selon le contexte (connexion, compte, réseau).
          </p>
        </div>
      </Card>
    </div>
  );
}