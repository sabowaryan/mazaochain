## Résumé des corrections (sessions, API, UI, i18n)

### 1) Erreurs API et services
- loan.ts, crop-evaluation.ts
  - Extraction correcte des messages d’erreur (`error.message`/`userMessage`).
  - Un seul `response.json()` (évite les erreurs de flux déjà lu).
  - Ajout de logs côté client pour diagnostiquer.
- api-errors.ts
  - Log de l’erreur DB réelle: `Database error details: ...`.

### 2) Hooks React
- PendingEvaluationsReview.tsx
  - Suppression du hook conditionnel; import direct de `useMazaoContracts`.

### 3) Authentification API + cookies Supabase
- src/app/api/(loans|crop-evaluations)/route.ts
  - Vérification d’auth via `supabase.auth.getUser()`.
- src/middleware.ts
  - Les routes `/api` passent par le middleware pour rafraîchir les cookies.
- src/lib/supabase/server.ts
  - Client serveur strict (cookies Next.js; aucun fallback navigateur).
- src/lib/supabase/client.ts
  - Suppression de la gestion manuelle des cookies; usage standard `@supabase/ssr`.

### 4) Redirections et persistance de session
- src/hooks/usePostLoginRedirect.ts
  - `router.push()` → `window.location.href` (rechargement complet → middleware synchronise les cookies).
- src/contexts/AuthContext.tsx
  - `signOut()`: `supabase.auth.signOut()` + redirection full reload vers `/{lang}/auth/login`.

### 5) Layout et i18n
- src/app/layout.tsx
  - Ajout de `<html>/<body>`, polices Geist, meta/icons.
- src/app/[lang]/layout.tsx
  - Les providers restent (sans `<html>/<body>` pour éviter les doublons).
- Accélération dev
  - `generateStaticParams()` limite à `fr` en développement; toutes les langues en production.

### 6) Page `unauthorized`
- Ajustée pour éviter les collisions de balises et les mauvaises routes; liens corrigés.

### 7) Correctifs API côté coopérative (UUID invalide)
- src/app/api/crop-evaluations/route.ts
- src/app/api/loans/route.ts
  - Si aucun fermier lié à la coop: retourner une liste vide (au lieu de `eq(..., 'no-match')`).

### 8) Recommandations restantes
- RLS pour coopérative
  - Autoriser SELECT sur `crop_evaluations`/`loans` via jointure: `farmer_profiles.cooperative_id = auth.uid()`.
- Validation de profil
  - `profiles.is_validated = true` pour les rôles non-agriculteurs.
- Navigation
  - Les menus doivent cibler `/{lang}/dashboard/{role}` (éviter `/{lang}/dashboard`).
- Preload logo
  - Soit supprimer, soit `<link rel="preload" href="/logo.svg" as="image">`.

---

Dernière mise à jour: automatique (compilation Turbopack)


