# Guide d'Application de la Migration RLS

## Problème Résolu

L'erreur `ERROR: 42501: permission denied for schema auth` a été corrigée en déplaçant la fonction helper du schéma `auth` vers le schéma `public`.

## Changements Effectués

### 1. Fonction Helper Corrigée

**Avant** (causait l'erreur):
```sql
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $
BEGIN
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Après** (corrigé):
```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 2. Toutes les Politiques Mises à Jour

Toutes les politiques RLS utilisent maintenant `public.get_user_role()` au lieu de `auth.user_role()`.

## Comment Appliquer la Migration

### Option 1: Via Supabase CLI (Recommandé)

```bash
# Assurez-vous d'être dans le répertoire du projet
cd /path/to/mazaochain

# Appliquez la migration
supabase db push

# Ou appliquez une migration spécifique
supabase migration up
```

### Option 2: Via l'Interface Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet MazaoChain
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `supabase/migrations/20251008000002_enable_comprehensive_rls.sql`
5. Copiez tout le contenu
6. Collez-le dans l'éditeur SQL
7. Cliquez sur **Run** pour exécuter la migration

### Option 3: Via psql (Ligne de Commande)

```bash
# Connectez-vous à votre base de données
psql "postgresql://postgres:[YOUR-PASSWORD]@db.rzdfamlgkzkxdkezdmja.supabase.co:5432/postgres"

# Exécutez la migration
\i supabase/migrations/20251008000002_enable_comprehensive_rls.sql

# Ou en une seule commande
psql "postgresql://postgres:[YOUR-PASSWORD]@db.rzdfamlgkzkxdkezdmja.supabase.co:5432/postgres" -f supabase/migrations/20251008000002_enable_comprehensive_rls.sql
```

## Vérification de l'Application

### 1. Vérifier que RLS est Activé

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Toutes les tables devraient avoir `rowsecurity = true`.

### 2. Vérifier les Politiques

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

Vous devriez voir des politiques pour toutes les tables.

### 3. Vérifier la Fonction Helper

```sql
SELECT proname, pronamespace::regnamespace 
FROM pg_proc 
WHERE proname = 'get_user_role';
```

Devrait retourner: `get_user_role | public`

### 4. Utiliser le Script de Vérification

```bash
# Définir les variables d'environnement
$env:NEXT_PUBLIC_SUPABASE_URL="https://rzdfamlgkzkxdkezdmja.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Exécuter le script
npx tsx scripts/verify-rls-policies.ts
```

Le script devrait afficher:
```
✅ RLS Status:        PASS
✅ Policies:          PASS
✅ Helper Functions:  PASS
✅ Views:             PASS
✅ Basic Access:      PASS
```

## Résolution des Problèmes

### Erreur: "permission denied for schema auth"

**Cause**: Tentative de créer une fonction dans le schéma `auth` sans permissions suffisantes.

**Solution**: La migration corrigée utilise maintenant `public.get_user_role()` au lieu de `auth.user_role()`.

### Erreur: "relation does not exist"

**Cause**: Une table référencée dans les politiques n'existe pas.

**Solution**: Assurez-vous que toutes les migrations précédentes ont été appliquées:
```bash
supabase migration list
```

### Erreur: "infinite recursion detected"

**Cause**: Une politique RLS qui se référence elle-même.

**Solution**: La migration corrigée utilise la fonction `public.get_user_role()` qui est marquée comme `SECURITY DEFINER` pour éviter la récursion.

### Les Vues ne Sont Pas Créées

**Cause**: Permissions insuffisantes ou conflit de noms.

**Solution**: Supprimez les vues existantes et réappliquez:
```sql
DROP VIEW IF EXISTS rls_status CASCADE;
DROP VIEW IF EXISTS rls_policies CASCADE;
```

Puis réexécutez la migration.

## Rollback (Si Nécessaire)

Si vous devez annuler la migration:

```sql
-- Désactiver RLS sur toutes les tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE crop_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE tokenization_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts DISABLE ROW LEVEL SECURITY;

-- Supprimer la fonction helper
DROP FUNCTION IF EXISTS public.get_user_role();

-- Supprimer les vues
DROP VIEW IF EXISTS rls_status;
DROP VIEW IF EXISTS rls_policies;
```

**⚠️ ATTENTION**: Désactiver RLS supprime toute la sécurité au niveau des lignes. Ne faites cela qu'en environnement de développement!

## Prochaines Étapes

Après avoir appliqué la migration avec succès:

1. ✅ Exécutez le script de vérification
2. ✅ Testez l'accès avec différents rôles d'utilisateurs
3. ✅ Vérifiez que les agriculteurs ne peuvent voir que leurs propres données
4. ✅ Vérifiez que les coopératives peuvent voir les données des agriculteurs
5. ✅ Vérifiez que les prêteurs ne peuvent voir que leurs investissements
6. ✅ Exécutez les tests automatisés: `npm run test src/__tests__/database/rls-policies.test.ts`

## Support

Si vous rencontrez des problèmes:

1. Consultez `RLS_POLICIES_DOCUMENTATION.md` pour la documentation complète
2. Consultez `TASK_17_RLS_POLICIES_COMPLETION.md` pour le résumé de la tâche
3. Vérifiez les logs Supabase dans le Dashboard
4. Exécutez le script de vérification pour identifier les problèmes

## Résumé

- ✅ Migration corrigée pour éviter l'erreur de permission
- ✅ Fonction helper déplacée vers le schéma `public`
- ✅ Toutes les politiques RLS mises à jour
- ✅ 18 tables avec RLS activé
- ✅ 50+ politiques créées
- ✅ Vues de vérification créées
- ✅ Script de vérification mis à jour

**La migration est prête à être appliquée!**
