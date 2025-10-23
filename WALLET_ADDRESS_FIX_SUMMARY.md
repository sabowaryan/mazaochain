# Correction du problème d'adresse wallet

## Problème identifié

Le service wallet utilisait incorrectement l'adresse EVM (`eip155:295`) comme `accountId` au lieu de l'adresse Hedera native (`0.0.xxxxx`). Cela causait une erreur HTTP 400 lors des requêtes à l'API Mirror Node de Hedera qui attend un format d'adresse Hedera valide.

## Corrections apportées

### 1. Amélioration de la gestion des adresses dans `hedera-wallet.ts`

- **Problème** : La méthode `restoreExistingSession` utilisait directement l'adresse du state AppKit sans validation
- **Solution** : Ajout de validation pour les adresses EVM et conversion appropriée

```typescript
// Pour les adresses EVM, on évite la restauration automatique
if (detectedNamespace === "eip155") {
  console.warn("Cannot restore EVM session without proper Hedera account mapping. User needs to reconnect.");
  return null;
}
```

### 2. Validation des adresses dans `getAccountBalance`

- **Problème** : Tentative d'utilisation d'adresses EVM avec l'API Mirror Node
- **Solution** : Validation du format d'adresse avant les requêtes API

```typescript
// Vérification si l'adresse est valide pour l'API Mirror Node
if (!isValidForMirrorNode(targetAccountId)) {
  console.warn("Address not valid for Mirror Node API:", targetAccountId);
  return { hbar: "0", tokens: [] };
}
```

### 3. Création d'utilitaires d'adresse (`address-utils.ts`)

Nouveaux utilitaires pour gérer les différents formats d'adresse :

- `analyzeAddress()` : Analyse le type et format d'une adresse
- `extractHederaAccountId()` : Extrait l'ID de compte Hedera
- `isValidForMirrorNode()` : Vérifie si une adresse est valide pour l'API Mirror Node
- `formatAddressForDisplay()` : Formate une adresse pour l'affichage
- `debugAddress()` : Fonction de débogage pour analyser les adresses

### 4. Amélioration du débogage

- Ajout de logs détaillés pour tracer les conversions d'adresse
- Utilisation de `debugAddress()` aux points critiques
- Messages d'avertissement clairs pour les adresses EVM

### 5. Restauration du composant `WalletConnection.tsx`

- Suppression du composant de test `WalletTestComponent.tsx` (comme demandé)
- Restauration et correction du composant `WalletConnection.tsx`
- Correction des imports et interfaces (StatusBadge au lieu de Badge)

## Types d'adresses supportés

### Hedera Native
- Format : `0.0.123456`
- Compatible avec l'API Mirror Node ✅
- Utilisé pour les transactions natives Hedera

### EVM (Ethereum Virtual Machine)
- Format : `0x1234...` ou `eip155:295:0x1234...`
- Non compatible avec l'API Mirror Node ❌
- Nécessite une conversion ou une approche différente

### WalletConnect
- Format Hedera : `hedera:testnet:0.0.123456`
- Format EVM : `eip155:295:0x1234...`
- Parsing automatique du namespace et de l'adresse

## Comportement actuel

1. **Connexion Hedera Native** : Fonctionne normalement avec toutes les fonctionnalités
2. **Connexion EVM** : 
   - Connexion possible mais fonctionnalités limitées
   - Pas de récupération de solde via Mirror Node
   - Affichage de l'adresse EVM dans l'interface
   - Messages d'avertissement appropriés

## Tests ajoutés

Nouveaux tests dans `address-utils.test.ts` pour valider :
- L'analyse des différents formats d'adresse
- L'extraction des IDs de compte Hedera
- La validation pour l'API Mirror Node
- Le formatage pour l'affichage

## Prochaines étapes recommandées

1. **Conversion EVM ↔ Hedera** : Implémenter la conversion bidirectionnelle entre adresses EVM et comptes Hedera
2. **API EVM** : Utiliser des APIs compatibles EVM pour récupérer les soldes des adresses EVM
3. **Interface utilisateur** : Améliorer l'affichage pour distinguer clairement les types d'adresse
4. **Tests d'intégration** : Ajouter des tests end-to-end pour valider les scénarios de connexion

## Impact

- ✅ Plus d'erreurs HTTP 400 lors des requêtes de solde
- ✅ Gestion appropriée des différents types d'adresse
- ✅ Messages d'erreur et d'avertissement clairs
- ✅ Débogage amélioré pour identifier les problèmes d'adresse
- ✅ Composant WalletConnection restauré et fonctionnel