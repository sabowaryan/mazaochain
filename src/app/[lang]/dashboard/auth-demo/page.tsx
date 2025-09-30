import { RequireAuth } from '@/components/auth/AuthGuard';
import { AuthStatus, UserDetails } from '@/components/auth/AuthStatus';
import { AuthActionButtons } from '@/components/auth/AuthActionButtons';

export default function AuthDemoPage() {
  return (
    <RequireAuth>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Démonstration du système d'authentification
          </h1>
          <p className="text-muted-foreground">
            Cette page démontre le système d'authentification en temps réel de MazaoChain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Badge */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Badge de statut</h2>
            <AuthStatus variant="badge" />
          </div>

          {/* Status Inline */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Statut inline</h2>
            <AuthStatus variant="inline" showDetails />
          </div>

          {/* Status Card */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold">Carte de statut</h2>
            <AuthStatus variant="card" showDetails />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Détails utilisateur</h2>
            <div className="p-4 rounded-lg border bg-card">
              <UserDetails />
            </div>
          </div>

          {/* Auth Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Actions d'authentification</h2>
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <AuthActionsDemo />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Informations système</h2>
          <div className="p-4 rounded-lg border bg-card">
            <SystemInfo />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

function AuthActionsDemo() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Les notifications d'authentification apparaîtront automatiquement lors des changements d&apos;état.
      </p>
      
      <div className="flex flex-wrap gap-2">
        <AuthActionButtons />
      </div>
    </div>
  );
}

function SystemInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 className="font-medium text-foreground mb-2">Fonctionnalités actives</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li>✅ Authentification en temps réel</li>
          <li>✅ Notifications automatiques</li>
          <li>✅ Protection des routes</li>
          <li>✅ Gestion des rôles</li>
          <li>✅ Validation des comptes</li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-medium text-foreground mb-2">Composants disponibles</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li>• AuthProvider (Contexte)</li>
          <li>• AuthGuard (Protection)</li>
          <li>• AuthStatus (Affichage)</li>
          <li>• AuthNotifications (Temps réel)</li>
          <li>• UserDetails (Informations)</li>
        </ul>
      </div>
    </div>
  );
}