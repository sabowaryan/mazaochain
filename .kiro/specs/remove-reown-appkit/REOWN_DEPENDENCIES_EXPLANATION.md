# Explication des dépendances Reown

## Contexte

Bien que notre application utilise uniquement l'approche **DAppConnector** (v1) de `@hashgraph/hedera-wallet-connect`, nous devons quand même installer les packages Reown AppKit.

## Pourquoi ?

Le package `@hashgraph/hedera-wallet-connect` version 2.0.3 contient du code pour **deux approches différentes** :

1. **DAppConnector** (v1) - Ce que nous utilisons
   - Utilise `@walletconnect/modal` directement
   - N'a pas besoin de Reown AppKit pour fonctionner
   
2. **Reown AppKit Adapter** (v2) - Ce que nous n'utilisons PAS
   - Situé dans `node_modules/@hashgraph/hedera-wallet-connect/dist/reown/`
   - Importe `@reown/appkit`, `@reown/appkit-common`, etc.

## Le problème

Même si nous n'utilisons pas l'adaptateur Reown, Next.js/Turbopack analyse **tout le package** `@hashgraph/hedera-wallet-connect` lors du build, y compris le dossier `dist/reown/`. 

Cela provoque des erreurs de module manquant :
```
Module not found: Can't resolve '@reown/appkit/adapters'
```

## La solution

Nous avons **trois options** :

### Option 1 : Installer les peer dependencies (CHOISI) ✅
- Installer `@reown/appkit` et `@reown/appkit-common`
- Ces packages seront dans `node_modules` mais ne seront pas utilisés par notre code
- Avantage : Simple, fiable, pas de configuration complexe
- Inconvénient : Packages inutilisés dans node_modules (~2-3 MB)

### Option 2 : Utiliser webpack/turbopack alias
- Configurer Next.js pour ignorer ces imports
- **Problème** : Turbopack n'accepte pas `false` comme valeur d'alias
- Webpack pourrait fonctionner mais seulement en production build

### Option 3 : Créer un wrapper personnalisé
- Importer uniquement les sous-modules DAppConnector
- **Problème** : Le package n'exporte pas les sous-modules individuellement de manière stable
- Risque de casser lors des mises à jour

## Décision finale

Nous gardons les packages Reown suivants comme dépendances directes pour éviter les erreurs de build :
- `@reown/appkit@1.7.16` (version spécifique requise par hedera-wallet-connect)
- `@reown/appkit-common@1.7.16`
- `@reown/walletkit@1.2.8`

**Important** : La version 1.7.16 de `@reown/appkit` est requise car c'est celle avec laquelle `@hashgraph/hedera-wallet-connect@2.0.3` a été compilé. Les versions plus récentes (1.8.x) ont changé leur API et ne sont pas compatibles.

## Vérification

Pour confirmer que nous n'utilisons pas Reown dans notre code :

```bash
# Rechercher les imports Reown dans notre code source
grep -r "from '@reown" src/
# Résultat : Aucun import trouvé
```

Notre code utilise uniquement :
- `DAppConnector` de `@hashgraph/hedera-wallet-connect`
- `@walletconnect/modal` pour l'UI
- `@hashgraph/sdk` pour les transactions Hedera
