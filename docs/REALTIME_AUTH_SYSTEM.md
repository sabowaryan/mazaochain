# Système d'authentification en temps réel MazaoChain

## ✅ Vue d'ensemble

Le système d'authentification MazaoChain a été mis à jour pour refléter l'état d'auth de l'utilisateur en temps réel avec des notifications automatiques, une protection des routes avancée, et une gestion d'état centralisée.

## 🏗️ Architecture

### 1. AuthContext (`src/contexts/AuthContext.tsx`)
**Contexte React centralisé** qui gère l'état d'authentification global :

```tsx
interface AuthContextType {
  // État
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Helpers
  isAuthenticated: boolean;
  isValidated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
```

**Fonctionnalités clés :**
- ✅ Écoute en temps réel des changements d'auth Supabase
- ✅ Gestion automatique du profil utilisateur
- ✅ Logging détaillé des événements d'auth
- ✅ Gestion d'erreurs robuste
- ✅ Helpers pour les rôles et permissions

### 2. AuthGuard (`src/components/auth/AuthGuard.tsx`)
**Composant de protection des routes** avec plusieurs variantes :

```tsx
// Protection basique
<AuthGuard requireAuth={true}>
  <ProtectedContent />
</AuthGuard>

// Protection par rôles
<RequireRoles roles={['admin', 'cooperative']}>
  <AdminContent />
</RequireRoles>

// Composants de convenance
<RequireAuth><Content /></RequireAuth>
<RequireAdmin><AdminPanel /></RequireAdmin>
<GuestOnly><LoginForm /></GuestOnly>
```

**Fonctionnalités :**
- ✅ Redirections automatiques intelligentes
- ✅ Gestion des paramètres de redirection
- ✅ Fallbacks personnalisables
- ✅ Protection par rôles multiples

### 3. AuthStatus (`src/components/auth/AuthStatus.tsx`)
**Composants d'affichage de l'état d'auth** en temps réel :

```tsx
// Badge de statut
<AuthStatus variant="badge" />

// Affichage inline
<AuthStatus variant="inline" showDetails />

// Carte complète
<AuthStatus variant="card" showDetails />

// Détails utilisateur
<UserDetails />
```

**États affichés :**
- 🔴 Non authentifié
- 🟡 En attente de validation
- 🟢 Authentifié et validé

### 4. AuthNotifications (`src/components/auth/AuthNotifications.tsx`)
**Notifications en temps réel** pour les changements d'état :

**Types de notifications :**
- ✅ Connexion réussie
- ℹ️ Déconnexion
- ✅ Compte validé
- ℹ️ Profil mis à jour

**Fonctionnalités :**
- ✅ Notifications automatiques non-intrusives
- ✅ Auto-suppression après 5 secondes
- ✅ Historique des 5 dernières notifications
- ✅ Animations fluides

## 🔧 Utilisation

### Configuration de base

1. **Wrapper l'application** avec AuthProvider :
```tsx
// src/app/[lang]/layout.tsx
<AuthProvider>
  <YourApp />
</AuthProvider>
```

2. **Utiliser le hook** dans les composants :
```tsx
function MyComponent() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isValidated,
    signOut 
  } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Bonjour {user.email}!</p>
      ) : (
        <p>Veuillez vous connecter</p>
      )}
    </div>
  );
}
```

### Protection des routes

```tsx
// Page protégée simple
export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

// Page admin
export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminPanel />
    </RequireAdmin>
  );
}

// Page avec rôles multiples
export default function CooperativePage() {
  return (
    <RequireRoles roles={['cooperative', 'admin']}>
      <CooperativeContent />
    </RequireRoles>
  );
}
```

### Affichage de l'état

```tsx
function Header() {
  return (
    <header>
      <Logo />
      <AuthStatus variant="inline" showDetails />
    </header>
  );
}

function Sidebar() {
  return (
    <aside>
      <AuthStatus variant="card" showDetails />
      <UserDetails />
    </aside>
  );
}
```

## 🚀 Fonctionnalités avancées

### 1. Gestion des rôles
```tsx
const { hasRole, hasAnyRole } = useAuth();

// Vérifier un rôle spécifique
if (hasRole('admin')) {
  // Afficher le contenu admin
}

// Vérifier plusieurs rôles
if (hasAnyRole(['cooperative', 'admin'])) {
  // Afficher le contenu pour ces rôles
}
```

### 2. Actualisation du profil
```tsx
const { refreshProfile } = useAuth();

// Actualiser après une modification
await updateUserProfile(data);
await refreshProfile();
```

### 3. Gestion des erreurs
```tsx
const { signIn } = useAuth();

const handleLogin = async (email: string, password: string) => {
  const { error } = await signIn(email, password);
  
  if (error) {
    console.error('Erreur de connexion:', error);
    // Gérer l'erreur
  }
};
```

## 📊 Monitoring et debugging

### Logs automatiques
Le système log automatiquement :
- ✅ Connexions/déconnexions
- ✅ Changements de session
- ✅ Mises à jour de profil
- ✅ Erreurs d'authentification

### Page de démonstration
Visitez `/dashboard/auth-demo` pour voir tous les composants en action.

## 🔒 Sécurité

### Fonctionnalités de sécurité
- ✅ **Validation côté serveur** : Toutes les vérifications importantes côté serveur
- ✅ **Tokens sécurisés** : Gestion automatique des tokens JWT
- ✅ **Refresh automatique** : Renouvellement transparent des sessions
- ✅ **Protection CSRF** : Protection contre les attaques CSRF
- ✅ **Validation des rôles** : Vérification des permissions en temps réel

### Bonnes pratiques
- ✅ Jamais de données sensibles côté client
- ✅ Vérifications serveur pour toutes les actions critiques
- ✅ Timeouts de session appropriés
- ✅ Logging des événements de sécurité

## 🎯 Avantages

### Pour les développeurs
- **API simple** : Hook unique `useAuth()` pour tout
- **TypeScript complet** : Types stricts pour toutes les données
- **Composants réutilisables** : Guards et status prêts à l'emploi
- **Debugging facile** : Logs détaillés et page de démo

### Pour les utilisateurs
- **Feedback immédiat** : Notifications en temps réel
- **Navigation fluide** : Redirections intelligentes
- **État visible** : Indicateurs de statut clairs
- **Expérience cohérente** : Comportement uniforme dans toute l'app

Le système d'authentification MazaoChain est maintenant robuste, sécurisé et offre une expérience utilisateur exceptionnelle avec des mises à jour en temps réel ! 🎉