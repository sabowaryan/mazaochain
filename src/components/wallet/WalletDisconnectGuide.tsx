'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EnhancedWalletStatus } from './EnhancedWalletStatus';
import { AppKitWalletButton } from './AppKitWalletButton';
import { useWallet } from '@/hooks/useWallet';
import {
  ArrowRightOnRectangleIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export function WalletDisconnectGuide() {
  const { isConnected, disconnectWallet } = useWallet();

  if (!isConnected) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-800">
            Wallet Non Connecté
          </h3>
        </div>
        <p className="text-yellow-700 mb-4">
          Vous devez d'abord connecter un wallet pour pouvoir le déconnecter.
        </p>
        <AppKitWalletButton variant="connect" size="md" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <CursorArrowRaysIcon className="w-6 h-6" />
          Comment Se Déconnecter du Wallet
        </h2>
        <p className="text-blue-700 mb-6">
          Voici les différentes méthodes pour déconnecter votre wallet de MazaoChain :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Méthode 1: Dropdown */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">
              🎯 Méthode 1: Menu Dropdown (Recommandé)
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-blue-700">
                1. Cliquez sur votre wallet dans la navigation
              </p>
              <div className="flex justify-center">
                <EnhancedWalletStatus 
                  variant="dropdown" 
                  showBalance={true} 
                  showNetwork={true} 
                />
              </div>
              <p className="text-sm text-blue-700">
                2. Dans le menu qui s'ouvre, cliquez sur "Déconnecter" (bouton rouge)
              </p>
            </div>
          </div>

          {/* Méthode 2: Modal AppKit */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">
              🔧 Méthode 2: Modal AppKit
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-blue-700">
                1. Cliquez sur le bouton de gestion du compte
              </p>
              <div className="flex justify-center">
                <AppKitWalletButton variant="account" size="md" />
              </div>
              <p className="text-sm text-blue-700">
                2. Dans la modal AppKit, utilisez l'option de déconnexion
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Méthode 3: Déconnexion directe */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          ⚡ Méthode 3: Déconnexion Directe
        </h3>
        <p className="text-red-700 mb-4">
          Pour une déconnexion immédiate sans passer par les menus :
        </p>
        <Button
          onClick={disconnectWallet}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
          Déconnecter Maintenant
        </Button>
      </Card>

      {/* Informations importantes */}
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💡 Informations Importantes
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <p>
              <strong>Sécurité :</strong> La déconnexion supprime la session locale mais ne ferme pas votre wallet HashPack.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <p>
              <strong>Reconnexion :</strong> Vous pouvez vous reconnecter à tout moment avec le même wallet ou un autre.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <p>
              <strong>Données :</strong> Vos données de profil MazaoChain restent sauvegardées.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">⚠</span>
            <p>
              <strong>Attention :</strong> Vous ne pourrez plus effectuer de transactions blockchain après déconnexion.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}