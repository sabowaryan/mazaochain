# Système de Protection des Routes - MazaoChain

## 🔒 Vue d'ensemble

Le système de protection des routes de MazaoChain utilise une approche à deux niveaux :

1. **Protection côté serveur** (Middleware Next.js)
2. **Protection côté client** (Composants React)

Cette architecture garantit une sécurité robuste tout en offrant une expérience utilisateur fluide.

---

## 🛡️ Protection Côté Serveur (Middleware)

### Fichiers principaux :
- `src/middleware.ts` - Middleware principal
- `src/lib/auth/middleware-auth.ts` - Utilitaires d'authentification

### Fonctionnalités :

#### 1. Authentification automatique
```typescript
// Vérification du token dans les cookies
const token = extractAuthToken(request);
const authResult = await validateAuthToken(token);
```

#### 2. Autorisation basée sur les rôles
```typescript
// Vérification des permissions
const requiredRole = getRequiredRole(pathname);
if (!hasPermission(userRole, requiredRole)) {
  // Redirection vers /unauthorized
}
```

#### 3. Gestion de l'internationalisation
```typescript
// Support automatique FR/EN/LN
const locale = getLocale(request);
const localizedPath = `/${locale}${pathname}`;
```

#### 4. Headers de sécurité
```typescript
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

---

## 🎯 Configuration des Routes

### Routes Publiques
```typescript
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/unauthorized',
  '/api/health'
];
```

### Routes Protégées par Rôle
```typescript
const PROTECTED_ROUTES = {
  DASHBOARD: ['/dashboard'],           // Authentification requise
  FARMER: ['/dashboard/farmer'],       // Rôle 'agriculteur'
  COOPERATIVE: ['/dashboard/cooperative'], // Rôle 'cooperative'
  LENDER: ['/dashboard/lender'],       // Rôle 'preteur'
  ADMIN: ['/admin']                    // Rôle 'admin'
};
```

---

## 🔐 Protection Côté Client

### Composants de Protection

#### 1. AuthGuard (Principal)
```tsx
<AuthGuard requireAuth={true} requiredRoles={['agriculteur']}>
  <FarmerDashboard />
</AuthGuard>
```

#### 2. RouteProtection (Nouveau)
```tsx
<RouteProtection requiredRole="cooperative">
  <CooperativePanel />
</RouteProtection>
```

#### 3. RoleGate (Conditionnel)
```tsx
<RoleGate allowedRoles={['admin', 'cooperative']}>
  <AdminPanel />
</RoleGate>
```

### Hooks Personnalisés

#### 1. useMiddlewareAuth
```tsx
const { isAuthenticated, userRole, userId } = useMiddlewareAuth();
```

#### 2. useRoleCheck
```tsx
const { hasRole, isLoading } = useRoleCheck('admin');
```

#### 3. useRouteAuth
```tsx
const { hasAccess, reason } = useRouteAuth('/dashboard/farmer');
```

---

## 🚀 Utilisation Pratique

### 1. Protéger une Page Complète
```tsx
// pages/dashboard/farmer/page.tsx
import { FarmerProtection } from '@/components/auth/RouteProtection';

export default function FarmerPage() {
  return (
    <FarmerProtection>
      <FarmerDashboard />
    </FarmerProtection>
  );
}
```

### 2. Protéger un Composant Spécifique
```tsx
// Affichage conditionnel basé sur le rôle
function NavigationMenu() {
  return (
    <nav>
      <Link href="/dashboard">Tableau de bord</Link>
      
      <RoleGate allowedRoles={['agriculteur']}>
        <Link href="/dashboard/farmer">Mon Exploitation</Link>
      </RoleGate>
      
      <RoleGate allowedRoles={['cooperative']}>
        <Link href="/dashboard/cooperative">Gestion Coop</Link>
      </RoleGate>
      
      <RoleGate allowedRoles={['admin']}>
        <Link href="/admin">Administration</Link>
      </RoleGate>
    </nav>
  );
}
```

### 3. HOC pour Protection Automatique
```tsx
// Wrapper automatique
const ProtectedFarmerPage = withPageProtection(FarmerPage, 'agriculteur');
```

---

## 🔄 Flux d'Authentification

### 1. Utilisateur accède à une route protégée
```
/dashboard/farmer → Middleware vérifie → Token valide ? → Rôle correct ?
```

### 2. Redirection automatique si nécessaire
```
Non authentifié → /auth/login?returnUrl=/dashboard/farmer
Rôle incorrect → /unauthorized?reason=insufficient_permissions
```

### 3. Accès accordé avec headers
```
Headers ajoutés:
- x-user-id: uuid
- x-user-role: agriculteur
- x-user-email: user@example.com
- x-user-authenticated: true
```

---

## 🛠️ Configuration des Rôles

### Hiérarchie des Rôles
```typescript
const ROLE_HIERARCHY = {
  'agriculteur': 1,    // Accès de base
  'cooperative': 2,    // Accès étendu
  'preteur': 2,        // Accès étendu
  'admin': 10          // Accès total
};
```

### Permissions Spéciales
- **Admin** : Accès à toutes les routes
- **Cooperative** : Peut voir les profils agriculteurs
- **Preteur** : Peut voir les opportunités de prêt
- **Agriculteur** : Accès limité à ses propres données

---

## 🔧 Développement et Debug

### Mode Développement
```typescript
// Routes de test accessibles uniquement en dev
if (isDevelopment && pathname.startsWith('/test-')) {
  return NextResponse.next();
}
```

### Logs de Debug
```typescript
console.log(`🔒 Protecting route: ${cleanPathname}`);
console.log(`✅ Access granted to ${cleanPathname} for user ${email} (${role})`);
console.log(`❌ Authentication failed: ${error}`);
```

### Composant DevOnly
```tsx
<DevOnlyProtection>
  <TestingPanel />
</DevOnlyProtection>
```

---

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **authentication_required** : Token manquant/invalide
2. **insufficient_permissions** : Rôle insuffisant
3. **account_not_validated** : Compte non validé
4. **admin_required** : Accès admin requis

### Pages d'Erreur
- `/unauthorized` : Accès refusé avec raison
- `/auth/login` : Redirection avec returnUrl
- Fallback components pour erreurs gracieuses

---

## 📱 Expérience Mobile

### Optimisations
- Vérification rapide des tokens
- Cache des informations utilisateur
- Transitions fluides entre routes
- Messages d'erreur adaptés

### Performance
- Validation côté serveur (rapide)
- Cache des rôles utilisateur
- Préchargement des routes autorisées

---

## 🔒 Sécurité Avancée

### Headers de Sécurité
```typescript
'X-Frame-Options': 'DENY',              // Anti-clickjacking
'X-Content-Type-Options': 'nosniff',    // Anti-MIME sniffing
'Referrer-Policy': 'strict-origin-when-cross-origin'
```

### Protection CSRF
- Tokens dans cookies sécurisés
- Validation côté serveur
- Headers personnalisés

### Rate Limiting (Futur)
```typescript
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,    // par 15 minutes
  API_REQUESTS: 100,    // par minute
  PASSWORD_RESET: 3     // par heure
};
```

---

## 📚 Exemples d'Implémentation

### Page Dashboard Agriculteur
```tsx
// src/app/[lang]/dashboard/farmer/page.tsx
import { FarmerProtection } from '@/components/auth/RouteProtection';
import { FarmerDashboard } from '@/components/farmer/FarmerDashboard';

export default function FarmerPage() {
  return (
    <FarmerProtection>
      <FarmerDashboard />
    </FarmerProtection>
  );
}
```

### Navigation Conditionnelle
```tsx
// src/components/Navigation.tsx
import { RoleGate } from '@/components/auth/RouteProtection';

export function Navigation() {
  return (
    <nav className="space-y-2">
      <NavLink href="/dashboard">Accueil</NavLink>
      
      <RoleGate allowedRoles={['agriculteur']}>
        <NavLink href="/dashboard/farmer/profile">Mon Profil</NavLink>
        <NavLink href="/dashboard/farmer/loans">Mes Prêts</NavLink>
      </RoleGate>
      
      <RoleGate allowedRoles={['cooperative']}>
        <NavLink href="/dashboard/cooperative/farmers">Agriculteurs</NavLink>
        <NavLink href="/dashboard/cooperative/evaluations">Évaluations</NavLink>
      </RoleGate>
      
      <RoleGate allowedRoles={['admin']}>
        <NavLink href="/admin">Administration</NavLink>
      </RoleGate>
    </nav>
  );
}
```

---

## ✅ Checklist de Sécurité

- [x] Middleware de protection des routes
- [x] Validation des tokens côté serveur
- [x] Autorisation basée sur les rôles
- [x] Headers de sécurité
- [x] Gestion des erreurs gracieuse
- [x] Support de l'internationalisation
- [x] Protection côté client
- [x] Hooks personnalisés
- [x] Composants de protection
- [x] Mode développement sécurisé
- [ ] Rate limiting (à implémenter)
- [ ] Audit logs (à implémenter)
- [ ] Session management avancé (à implémenter)

---

**Le système de protection des routes de MazaoChain garantit une sécurité robuste tout en maintenant une expérience utilisateur fluide et intuitive.**