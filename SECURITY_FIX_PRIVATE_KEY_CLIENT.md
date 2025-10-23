# Fix de sécurité: Clé privée utilisée côté client

## 🚨 Problème de sécurité critique

```
Failed to initialize MazaoContracts client: TypeError: can't access property "startsWith", text is undefined
decode hex.browser.js:29
fromStringECDSA PrivateKey.js:205
```

### Cause racine

Le code tentait d'utiliser `env.HEDERA_PRIVATE_KEY` côté client (navigateur) :

```typescript
// ❌ DANGEREUX - Clé privée côté client
this.operatorPrivateKey = PrivateKey.fromStringECDSA(
  env.HEDERA_PRIVATE_KEY  // undefined côté client
);
```

## 🔐 Pourquoi c'est un problème de sécurité

### 1. Exposition de la clé privée
Si `HEDERA_PRIVATE_KEY` était accessible côté client :
- ❌ La clé serait visible dans le code JavaScript du navigateur
- ❌ N'importe qui pourrait l'extraire et voler les fonds
- ❌ Accès complet au compte Hedera

### 2. Variables d'environnement côté client
En Next.js :
- Variables avec `NEXT_PUBLIC_*` → Accessibles côté client
- Variables sans `NEXT_PUBLIC_*` → Uniquement côté serveur
- `HEDERA_PRIVATE_KEY` n'a pas le préfixe → `undefined` côté client

### 3. Architecture incorrecte
Les clés privées ne doivent **JAMAIS** être utilisées côté client :
- ❌ Client-side: Pas de clés privées
- ✅ Client-side: Utiliser le wallet de l'utilisateur (HashPack, etc.)
- ✅ Server-side: Clés privées pour les opérations backend

## ✅ Solution implémentée

### 1. Mode lecture seule côté client

```typescript
// ✅ SÉCURISÉ - Client en mode lecture seule
private async initializeClient() {
  if (!this.client) {
    // SECURITY: Private keys should NEVER be used in client-side code
    // This service should only be used for READ operations from the client
    // WRITE operations (transactions) should go through the wallet or backend API
    
    const { Client } = await import("@hashgraph/sdk");
    
    // Initialize Hedera client WITHOUT operator (read-only mode)
    this.client =
      env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
        ? Client.forMainnet()
        : Client.forTestnet();
    
    // Pas d'opérateur = pas de clé privée = lecture seule
    console.log("MazaoContracts initialized (read-only mode)");
  }
}
```

### 2. Suppression des propriétés inutiles

```typescript
// Avant
export class MazaoContractsServiceImpl {
  private client: any;
  private operatorAccountId: any;      // ❌ Supprimé
  private operatorPrivateKey: any;     // ❌ Supprimé
  private tokenFactoryId!: string;
  private loanManagerId!: string;
}

// Après
export class MazaoContractsServiceImpl {
  private client: any;
  private tokenFactoryId!: string;
  private loanManagerId!: string;
}
```

## 🏗️ Architecture correcte

### Opérations de lecture (côté client)
```typescript
// ✅ Utiliser le client en mode lecture seule
const balance = await mazaoContractsService.getFarmerTotalBalance(address);
const holdings = await mazaoContractsService.getFarmerTokenHoldings(address);
```

### Opérations d'écriture (transactions)

#### Option 1: Via le wallet de l'utilisateur
```typescript
// ✅ L'utilisateur signe avec son wallet (HashPack)
const { signTransaction } = useWallet();
const signedTx = await signTransaction(transaction);
```

#### Option 2: Via une API backend
```typescript
// ✅ Backend API avec clé privée sécurisée
// Client → API → Hedera
const response = await fetch('/api/contracts/create-token', {
  method: 'POST',
  body: JSON.stringify({ farmerAddress, cropType, ... })
});
```

## 📋 Checklist de sécurité

### ✅ Ce qui est correct maintenant
- [x] Pas de clé privée côté client
- [x] Client Hedera en mode lecture seule
- [x] Variables d'environnement correctement utilisées
- [x] Opérations de lecture fonctionnelles

### ⚠️ À implémenter pour les transactions
- [ ] API backend pour les opérations d'écriture
- [ ] Authentification des requêtes API
- [ ] Validation des paramètres côté serveur
- [ ] Rate limiting sur les endpoints sensibles

## 🔄 Migration des opérations d'écriture

Pour les méthodes qui créent des transactions (actuellement non fonctionnelles côté client) :

### Méthodes à migrer vers le backend
```typescript
// Ces méthodes nécessitent une clé privée → Backend API
- createCropToken()
- mintTokens()
- requestLoan()
- tokenizeApprovedEvaluation()
```

### Exemple de migration

#### Avant (côté client - non sécurisé)
```typescript
// ❌ Ne fonctionne pas sans clé privée
const result = await mazaoContractsService.createCropToken(
  farmerAddress,
  estimatedValue,
  cropType,
  harvestDate,
  tokenSymbol
);
```

#### Après (via API backend)
```typescript
// ✅ Sécurisé - Backend gère la clé privée
const response = await fetch('/api/contracts/create-crop-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    farmerAddress,
    estimatedValue,
    cropType,
    harvestDate,
    tokenSymbol
  })
});

const result = await response.json();
```

## 📝 Variables d'environnement

### Côté client (NEXT_PUBLIC_*)
```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.12345
NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792
NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID=0.0.6913794
```

### Côté serveur uniquement
```env
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
# ⚠️ Cette variable n'est JAMAIS accessible côté client
```

## 🎯 Résultats

### Avant
- ❌ Erreur: "can't access property startsWith, text is undefined"
- ❌ Tentative d'utilisation de clé privée côté client
- ❌ Risque de sécurité si la clé était exposée

### Après
- ✅ Client initialisé en mode lecture seule
- ✅ Pas de clé privée côté client
- ✅ Opérations de lecture fonctionnelles
- ✅ Architecture sécurisée

## 📚 Bonnes pratiques

### 1. Séparation des responsabilités
```
Client (Browser)
├── Lecture de données publiques ✅
├── Affichage UI ✅
└── Transactions via wallet utilisateur ✅

Backend (Server)
├── Opérations avec clé privée ✅
├── Validation business logic ✅
└── Accès base de données ✅
```

### 2. Principe du moindre privilège
- Le client ne devrait avoir accès qu'aux données nécessaires
- Les opérations sensibles passent par le backend
- Chaque utilisateur signe ses propres transactions

### 3. Défense en profondeur
- Validation côté client (UX)
- Validation côté serveur (sécurité)
- Rate limiting
- Authentification/autorisation

## 🔍 Test

Pour vérifier que la correction fonctionne :

1. Ouvrir le dashboard agriculteur
2. ✅ Plus d'erreur "can't access property startsWith"
3. ✅ Le client s'initialise en mode lecture seule
4. ✅ Les opérations de lecture fonctionnent (balance, holdings)
5. ⚠️ Les opérations d'écriture retournent des erreurs (normal - à migrer vers backend)

## 📖 Références

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Hedera SDK Security Best Practices](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
