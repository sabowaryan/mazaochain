# Solution pour l'erreur "Type user_role non trouvé"

## Problème
Erreur lors de l'inscription d'un nouvel utilisateur :
```
ERROR: Type user_role non trouvé pour user: f415f1cd-205c-480d-88e8-c3ad7a2bb43f (SQLSTATE P0001)
```

## Cause
1. L'enum `user_role` n'est pas défini ou accessible dans la base de données
2. Conflit entre la création manuelle du profil et le trigger automatique

## Solution appliquée

### 1. Modification du code client (✅ Fait)
**Fichier** : `src/lib/supabase/client-auth.ts`
- Suppression de la création manuelle du profil
- Le profil est maintenant créé uniquement par le trigger

### 2. Script SQL de correction
**Fichier** : `fix_user_role_clean.sql`

## Instructions pour appliquer la correction

### Étape 1 : Exécuter le script SQL
1. Ouvrez votre dashboard Supabase : https://ncjhnhyesclqzoghsnab.supabase.co
2. Allez dans "SQL Editor"
3. Copiez et exécutez le contenu du fichier `fix_user_role_clean.sql`

### Étape 2 : Tester la correction
```bash
# Tester l'inscription
node scripts/test-user-registration.js
```

### Étape 3 : Vérifier le fonctionnement
1. Essayez de créer un nouveau compte via l'interface web
2. Vérifiez que l'inscription se déroule sans erreur
3. Contrôlez que le profil utilisateur est créé automatiquement

## Ce que fait le script SQL

1. **Vérification de l'enum** : S'assure que `user_role` existe
2. **Recréation de la fonction trigger** : Améliore la gestion d'erreur
3. **Recréation du trigger** : Assure le bon fonctionnement
4. **Vérifications finales** : Confirme que tout est en place

## Résultat attendu

Après application :
- ✅ L'inscription fonctionne sans erreur
- ✅ Le profil utilisateur est créé automatiquement
- ✅ Le rôle est correctement assigné
- ✅ Pas de conflit de création de profil

## En cas de problème persistant

1. Vérifiez les logs Supabase pour plus de détails
2. Assurez-vous que les migrations précédentes ont été appliquées
3. Contactez le support si le problème persiste

## Fichiers modifiés/créés

- ✅ `src/lib/supabase/client-auth.ts` (modifié)
- ✅ `fix_user_role_clean.sql` (créé)
- ✅ `scripts/test-user-registration.js` (créé)
- ✅ Documentation complète