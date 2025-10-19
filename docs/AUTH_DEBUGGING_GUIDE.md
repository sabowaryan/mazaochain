# Guide de Débogage - Problème d'Authentification

## Symptôme

Après connexion réussie, l'utilisateur est redirigé vers :
```
http://localhost:3000/fr/auth/login?returnUrl=%2Ffr%2Fdashboard&reason=authentication_required
```

Cela indique que le middleware ne trouve pas de session valide.

## Diagnostic Étape par Étape

### 1. Vérifier que la Connexion Fonctionne

**Dans la console du navigateur**, après avoir cliqué sur "Se connecter" :

```javascript
// Ouvrir DevTools > Console
// Taper :
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

**Résultat attendu** :
- `session` devrait contenir un objet avec `access_token`, `refresh_token`, etc.
- `user` devrait contenir les informations de l'utilisateur

**Si null** : La connexion n'a pas fonctionné côté client.

### 2. Vérifier les Cookies

**Dans DevTools > Application > Cookies > localhost:3000**

Cherchez des cookies commençant par `sb-` :
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token-code-verifier`

**Si absents** : Les cookies ne sont pas créés.

**Si présents** : Notez leur valeur et leurs attributs (Path, SameSite, Secure, HttpOnly).

### 3. Vérifier les Logs du Middleware

**Dans le terminal du serveur**, cherchez :

```
🔒 Protecting route: /dashboard
❌ Authentication failed for /dashboard: [RAISON]
```

**Raisons possibles** :
- `No active session` : Le middleware ne trouve pas de session
- `Profile not found` : L'utilisateur n'a pas de profil
- `Account not validated` : Le compte n'est pas validé

### 4. Vérifier la Configuration Supabase

**Fichier `.env.local`** :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Vérifications** :
- ✅ Les variables sont bien définies
- ✅ L'URL est correcte (pas de trailing slash)
- ✅ Les clés sont valides
- ✅ Le fichier est bien nommé `.env.local` (pas `.env`)

### 5. Test Manuel de l'API

**Dans le terminal** :

```bash
# Test de connexion
curl -X POST 'https://[project-ref].supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Résultat attendu** : Un objet JSON avec `access_token` et `refresh_token`.

## Solutions Possibles

### Solution 1 : Forcer le Rafraîchissement de la Session

**Dans `src/middleware.ts`**, après avoir créé le client middleware :

```typescript
const supabase = createMiddlewareClient(request, response);

// Forcer le rafraîchissement de la session
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError) {
  console.log('Session error:', sessionError);
}

if (!session) {
  // Essayer de rafraîchir
  const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
  if (refreshedSession) {
    console.log('✅ Session refreshed successfully');
  }
}
```

### Solution 2 : Vérifier le Timing

Le problème peut être un timing : la session n'est pas encore établie quand le middleware vérifie.

**Ajouter un délai dans AuthContext** après connexion :

```typescript
const signIn = useCallback(async (email: string, password: string) => {
  setAuthState(prev => ({ ...prev, loading: true }));
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    // Attendre que la session soit établie
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Forcer un rafraîchissement
    await supabase.auth.getSession();
  }

  setAuthState(prev => ({ ...prev, loading: false }));
  return { error };
}, [supabase.auth]);
```

### Solution 3 : Désactiver Temporairement le Middleware

Pour tester si le problème vient du middleware :

**Dans `src/middleware.ts`**, commentez temporairement la vérification :

```typescript
// Check if route requires protection
if (isProtectedRoute(cleanPathname)) {
  console.log(`🔒 Protecting route: ${cleanPathname}`);
  
  // TEMPORAIRE : Désactiver la vérification
  // const authResult = await handleAuthentication(request, response);
  // if (!authResult.authenticated) { ... }
  
  // Laisser passer temporairement
  console.log('⚠️ MIDDLEWARE DISABLED FOR TESTING');
}
```

**Si ça fonctionne** : Le problème est dans le middleware.
**Si ça ne fonctionne pas** : Le problème est dans la connexion elle-même.

### Solution 4 : Vérifier les RLS Policies

Le middleware essaie de lire le profil depuis la base de données. Si les RLS policies bloquent, ça échouera.

**Dans Supabase Dashboard > SQL Editor** :

```sql
-- Vérifier les policies sur la table profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Tester l'accès
SELECT * FROM profiles WHERE id = '[USER_ID]';
```

**Si erreur "permission denied"** : Les RLS policies bloquent l'accès.

**Solution** : Ajouter une policy pour le service role :

```sql
CREATE POLICY "Service role can read all profiles"
ON profiles FOR SELECT
TO service_role
USING (true);
```

### Solution 5 : Utiliser un Cookie de Session Personnalisé

Si Supabase ne fonctionne pas bien, créer notre propre cookie :

**Après connexion réussie** :

```typescript
// Côté client, après signIn
if (!error) {
  // Créer un cookie de session simple
  document.cookie = `mazao_session=true; path=/; max-age=86400; samesite=lax`;
  
  // Rediriger
  router.push('/fr/dashboard');
}
```

**Dans le middleware** :

```typescript
// Vérifier d'abord notre cookie
const sessionCookie = request.cookies.get('mazao_session');
if (sessionCookie) {
  // Vérifier avec Supabase
  const authResult = await handleAuthentication(request, response);
  // ...
} else {
  // Pas de cookie, rediriger vers login
  return NextResponse.redirect(loginUrl);
}
```

## Checklist de Débogage

- [ ] La connexion fonctionne (session visible dans console)
- [ ] Les cookies Supabase sont créés
- [ ] Les variables d'environnement sont correctes
- [ ] Le middleware reçoit les cookies
- [ ] Le middleware peut lire la session
- [ ] Le profil existe dans la base de données
- [ ] Les RLS policies permettent l'accès
- [ ] Le compte est validé (si nécessaire)

## Commandes Utiles

```bash
# Voir les cookies dans le terminal
curl -v http://localhost:3000/fr/dashboard

# Tester le middleware
curl -v -H "Cookie: sb-xxx-auth-token=..." http://localhost:3000/fr/dashboard

# Voir les logs en temps réel
npm run dev | grep -E "(🔒|❌|✅)"
```

## Prochaines Étapes

1. **Activer les logs détaillés** dans le middleware
2. **Vérifier les cookies** dans DevTools
3. **Tester la session** dans la console
4. **Vérifier les RLS policies** dans Supabase
5. **Essayer les solutions** une par une

---

**Besoin d'aide ?** Partagez :
- Les logs du middleware
- Les cookies visibles dans DevTools
- Le résultat de `supabase.auth.getSession()` dans la console
