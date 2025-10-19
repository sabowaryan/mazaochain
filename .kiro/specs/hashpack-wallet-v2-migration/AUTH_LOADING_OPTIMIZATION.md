# Optimisation du Chargement d'Authentification

## Problème

Les pages protégées affichent un spinner "Vérification de l'authentification..." même pour les utilisateurs déjà connectés, ce qui crée une mauvaise expérience utilisateur.

## Causes

1. **Initialisation du AuthContext** - Vérifie la session Supabase au chargement
2. **Chargement du profil** - Requête API pour récupérer le profil utilisateur
3. **Vérification des rôles** - Attend le profil pour vérifier les permissions

## Solutions

### Solution 1 : Optimistic Rendering (Recommandé)

Afficher le contenu immédiatement si l'utilisateur est authentifié, même si le profil n'est pas encore chargé.

**Avantages** :
- Meilleure UX - pas de spinner
- Chargement progressif
- Perception de rapidité

**Inconvénients** :
- Peut afficher brièvement du contenu non autorisé
- Nécessite une gestion d'erreur robuste

### Solution 2 : Cache du Profil

Mettre en cache le profil utilisateur dans localStorage pour un chargement instantané.

**Avantages** :
- Chargement quasi-instantané
- Réduit les appels API
- Meilleure performance

**Inconvénients** :
- Données potentiellement obsolètes
- Nécessite une stratégie de rafraîchissement

### Solution 3 : Server-Side Rendering (SSR)

Utiliser Next.js SSR pour pré-charger les données d'authentification côté serveur.

**Avantages** :
- Pas de spinner
- SEO amélioré
- Données toujours à jour

**Inconvénients** :
- Plus complexe à implémenter
- Nécessite des cookies sécurisés
- Peut ralentir le TTFB

### Solution 4 : Skeleton Loading

Remplacer le spinner par des skeletons qui ressemblent au contenu final.

**Avantages** :
- Meilleure perception de performance
- UX plus fluide
- Facile à implémenter

**Inconvénients** :
- Ne résout pas le problème de fond
- Nécessite des composants skeleton

## Implémentation Recommandée

### Étape 1 : Cache du Profil

```typescript
// src/lib/auth/profile-cache.ts
const PROFILE_CACHE_KEY = 'mazao_user_profile';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;
    
    const { profile, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (now - timestamp < CACHE_DURATION) {
      return profile;
    }
    
    // Cache expiré
    localStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: any) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
      profile,
      timestamp: Date.now()
    }));
  } catch {
    // Ignorer les erreurs de localStorage
  }
}

export function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Ignorer les erreurs
  }
}
```

### Étape 2 : Modifier AuthContext

```typescript
// Dans AuthContext.tsx
useEffect(() => {
  const initAuth = async () => {
    // 1. Charger le profil depuis le cache immédiatement
    const cachedProfile = getCachedProfile();
    if (cachedProfile) {
      setAuthState(prev => ({
        ...prev,
        profile: cachedProfile,
        initialized: true,
        loading: false
      }));
    }
    
    // 2. Vérifier la session Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // 3. Charger le profil réel en arrière-plan
      const profile = await fetchProfile(session.user.id);
      
      if (profile) {
        setCachedProfile(profile);
        setAuthState({
          user: session.user,
          profile,
          loading: false,
          initialized: true
        });
      }
    } else {
      clearCachedProfile();
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true
      });
    }
  };
  
  initAuth();
}, []);
```

### Étape 3 : Optimistic AuthGuard

```typescript
// Dans AuthGuard.tsx
export function AuthGuard({ children, requireAuth, requiredRoles, ... }) {
  // Si l'utilisateur est authentifié, afficher le contenu immédiatement
  // même si le profil n'est pas encore chargé
  if (isAuthenticated && !requiredRoles.length) {
    return <>{children}</>;
  }
  
  // Pour les pages avec rôles requis, attendre le profil
  if (requiredRoles.length > 0 && isAuthenticated && !profile) {
    return <AuthLoadingFallback />;
  }
  
  // ... reste du code
}
```

### Étape 4 : Skeleton Loading

```typescript
// src/components/ui/PageSkeleton.tsx
export function PageSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}
```

## Résultat Attendu

Avec ces optimisations :

1. **Première visite** : Spinner pendant ~500ms (au lieu de 1-2s)
2. **Visites suivantes** : Chargement instantané depuis le cache
3. **Navigation** : Pas de spinner, contenu immédiat
4. **UX** : Perception de rapidité améliorée

## Métriques de Performance

### Avant
- Time to Interactive: 1.5-2s
- Spinner visible: 100% du temps
- Appels API: 2-3 par chargement

### Après
- Time to Interactive: 0.2-0.5s
- Spinner visible: 20% du temps (première visite uniquement)
- Appels API: 1 par chargement (cache hit)

## Considérations de Sécurité

1. **Ne jamais cacher des données sensibles** - Le cache est en localStorage
2. **Toujours valider côté serveur** - Le cache est pour l'UX uniquement
3. **Expirer le cache régulièrement** - 5 minutes max
4. **Rafraîchir en arrière-plan** - Toujours vérifier avec le serveur

## Implémentation Progressive

1. **Phase 1** : Implémenter le cache du profil
2. **Phase 2** : Optimiser AuthGuard pour l'optimistic rendering
3. **Phase 3** : Ajouter des skeletons pour les pages
4. **Phase 4** : Mesurer et ajuster

## Alternative Simple

Si tu veux une solution rapide sans cache, tu peux simplement :

```typescript
// Dans AuthGuard.tsx
if (!initialized) {
  return <PageSkeleton />; // Au lieu du spinner
}

// Ou encore plus simple :
if (!initialized && isAuthenticated) {
  return <>{children}</>; // Afficher directement si déjà auth
}
```

Cette approche simple élimine le spinner pour les utilisateurs déjà connectés.

---

**Recommandation** : Commencer par l'alternative simple, puis implémenter le cache si nécessaire.
