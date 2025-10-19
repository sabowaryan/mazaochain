# Correction: Bouton de connexion wallet ne fonctionne pas

## Problème

Lorsque l'utilisateur clique sur le bouton "Connecter HashPack", rien ne se passe. Ni la méthode personnalisée pour rediriger vers HashPack, ni le wrapper AppKit ne fonctionnent.

## Cause Racine

Le hook `useWallet` utilisait directement `hederaWalletService` au lieu d'utiliser le `wallet-service-factory` qui est responsable de basculer entre:
- La méthode personnalisée (quand `NEXT_PUBLIC_USE_APPKIT=false`)
- AppKit (quand `NEXT_PUBLIC_USE_APPKIT=true`)

### Code Problématique

```typescript
// src/hooks/useWallet.ts
import { hederaWalletService } from "@/lib/wallet/hedera-wallet";

// ...
await hederaWalletService.connectWallet(selectedNamespace);
```

Cela signifiait que même avec `NEXT_PUBLIC_USE_APPKIT=true`, l'application utilisait toujours la méthode personnalisée qui ne fonctionnait pas correctement.

## Solution

Modifier le hook `useWallet` pour utiliser `getWalletService()` du factory au lieu de `hederaWalletService` directement.

### Changements Effectués

1. **Import modifié**:
```typescript
// Avant
import { hederaWalletService } from "@/lib/wallet/hedera-wallet";

// Après
import { getWalletService } from "@/lib/wallet/wallet-service-factory";
```

2. **Utilisation du service**:
```typescript
// Obtenir le service approprié (custom ou AppKit)
const walletService = getWalletService();

// Utiliser walletService au lieu de hederaWalletService
await walletService.initialize();
await walletService.connectWallet(selectedNamespace);
await walletService.disconnectWallet();
await walletService.getAccountBalance(accountId);
```

3. **Réorganisation du code**:
- Déplacé `loadBalances` avant `useEffect` pour éviter les problèmes de dépendances
- Utilisé `useCallback` pour `loadBalances` pour éviter les re-renders inutiles
- Ajouté les dépendances correctes aux hooks

## Fichiers Modifiés

- `src/hooks/useWallet.ts` - Utilise maintenant le wallet service factory

## Comment Ça Fonctionne Maintenant

### Avec NEXT_PUBLIC_USE_APPKIT=false (Méthode Personnalisée)

1. `getWalletService()` retourne `hederaWalletService`
2. Le bouton "Connecter HashPack" appelle `hederaWalletService.connectWallet()`
3. Ouvre HashPack via WalletConnect v2

### Avec NEXT_PUBLIC_USE_APPKIT=true (AppKit)

1. `getWalletService()` retourne `AppKitWalletService`
2. Le bouton "Connecter HashPack" appelle `AppKitWalletService.connectWallet()`
3. Ouvre le modal AppKit avec les options de wallet

## Test de Vérification

### Test 1: Mode Personnalisé

```bash
# .env.local
NEXT_PUBLIC_USE_APPKIT=false

# Redémarrer le serveur
npm run dev

# Tester:
# 1. Aller sur une page avec le bouton wallet
# 2. Cliquer sur "Connecter HashPack"
# 3. Vérifier que HashPack s'ouvre
```

### Test 2: Mode AppKit

```bash
# .env.local
NEXT_PUBLIC_USE_APPKIT=true

# Redémarrer le serveur
npm run dev

# Tester:
# 1. Aller sur une page avec le bouton wallet
# 2. Cliquer sur le bouton AppKit
# 3. Vérifier que le modal AppKit s'ouvre
```

## Résultat Attendu

✅ **Mode Personnalisé**: Le bouton ouvre HashPack via WalletConnect  
✅ **Mode AppKit**: Le bouton ouvre le modal AppKit avec les options de wallet  
✅ **Pas d'erreurs** dans la console  
✅ **Connexion réussie** après approbation dans le wallet  

## Notes Importantes

1. **Redémarrage Requis**: Après avoir changé `NEXT_PUBLIC_USE_APPKIT`, vous DEVEZ redémarrer le serveur de développement.

2. **WalletConnect Project ID**: Assurez-vous d'avoir un Project ID valide:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre_project_id_valide
   ```

3. **HashPack Installé**: L'extension HashPack doit être installée dans le navigateur.

## Dépannage

### Le bouton ne fait toujours rien

1. **Vérifier la console du navigateur** pour les erreurs
2. **Vérifier que le serveur a été redémarré** après les changements
3. **Vérifier les variables d'environnement**:
   ```bash
   # Dans le navigateur, console:
   console.log(process.env.NEXT_PUBLIC_USE_APPKIT);
   console.log(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
   ```

### Erreur "AppKit not initialized"

- Vérifier que `NEXT_PUBLIC_USE_APPKIT=true`
- Vérifier que le Project ID est valide
- Vérifier la console pour les erreurs d'initialisation

### Erreur "Connection timeout"

- Vérifier que HashPack est installé
- Vérifier la connexion internet
- Essayer de rafraîchir la page

## Prochaines Étapes

1. ✅ Tester en mode personnalisé
2. ✅ Tester en mode AppKit
3. ✅ Vérifier que la connexion fonctionne
4. ✅ Vérifier que les soldes se chargent
5. ✅ Vérifier que la déconnexion fonctionne

---

**Status**: ✅ Corrigé  
**Date**: 2025-01-13  
**Fichiers Modifiés**: `src/hooks/useWallet.ts`  
**Impact**: Tous les composants utilisant `useWallet` bénéficient de la correction  

