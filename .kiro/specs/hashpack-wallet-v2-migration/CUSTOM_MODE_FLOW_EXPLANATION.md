# Flux de Connexion en Mode Personnalisé (AppKit Désactivé)

## Configuration

Quand `NEXT_PUBLIC_USE_APPKIT=false` (ou non défini), le système utilise la méthode personnalisée.

## Flux Complet Étape par Étape

### 1. Clic sur le Bouton "Connecter HashPack"

**Composant**: `WalletConnection.tsx`
```typescript
<Button onClick={() => connectWallet()}>
  Connecter HashPack
</Button>
```

### 2. Appel du Hook useWallet

**Hook**: `useWallet.ts`
```typescript
const walletService = getWalletService(); // Retourne HederaWalletService
await walletService.connectWallet("hedera"); // Namespace par défaut
```

### 3. Factory Retourne le Service Personnalisé

**Factory**: `wallet-service-factory.ts`
```typescript
export function getWalletService(): IWalletService {
  if (isAppKitEnabled()) {
    return new AppKitWalletService(); // ❌ Pas utilisé si false
  }
  return hederaWalletService; // ✅ Utilisé en mode personnalisé
}
```

### 4. Initialisation du Service Hedera

**Service**: `hedera-wallet.ts`

#### 4.1 Vérification de l'Initialisation
```typescript
if (!this.isInitialized) {
  await this.initialize();
}
```

#### 4.2 Création du HederaProvider
```typescript
this.hederaProvider = await HederaProvider.init({
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: "MazaoChain MVP",
    description: "Decentralized lending platform",
    url: "http://localhost:3000",
    icons: ["http://localhost:3000/favicon.ico"]
  }
});
```

#### 4.3 Création des Adapters
```typescript
// Native Hedera Adapter (pour les transactions Hedera natives)
this.nativeAdapter = new HederaAdapter({
  projectId,
  networks: [HederaChainDefinition.Native.Testnet],
  namespace: hederaNamespace
});

// EVM Adapter (pour les transactions EVM sur Hedera)
this.evmAdapter = new HederaAdapter({
  projectId,
  networks: [HederaChainDefinition.EVM.Testnet],
  namespace: eip155Namespace
});
```

#### 4.4 Création du Modal WalletConnect (Optionnel)
```typescript
if (WalletConnectModal && typeof window !== "undefined") {
  this.modal = new WalletConnectModal({
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: ["hedera:testnet", "hedera:mainnet"],
    themeMode: "light",
    themeVariables: {
      "--wcm-accent-color": "#10b981",
      "--wcm-background-color": "#10b981"
    }
  });
}
```

### 5. Connexion au Wallet

#### 5.1 Sélection de l'Adapter
```typescript
const adapter = namespace === "hedera" 
  ? this.nativeAdapter  // ✅ Utilisé par défaut
  : this.evmAdapter;
```

#### 5.2 Ouverture du Modal (Si Disponible)
```typescript
if (this.modal) {
  console.log("Opening WalletConnect modal...");
  // Le modal WalletConnect s'affiche avec un QR code
}
```

#### 5.3 Appel de la Connexion
```typescript
const connectPromise = adapter.connect({});
```

**Ce qui se passe concrètement:**

1. **Si HashPack est installé et ouvert**:
   - HashPack détecte la demande de connexion WalletConnect
   - Une notification apparaît dans HashPack
   - L'utilisateur peut approuver ou rejeter

2. **Si le modal WalletConnect est disponible**:
   - Un modal s'ouvre avec un QR code
   - L'utilisateur peut scanner le QR code avec HashPack mobile
   - Ou cliquer sur "HashPack" pour ouvrir l'extension

3. **Si rien ne se passe**:
   - Le système attend jusqu'à 120 secondes (timeout)
   - Vérifie toutes les 500ms si une connexion est établie
   - Affiche une erreur si le timeout est atteint

#### 5.4 Vérification de la Connexion
```typescript
const checkConnection = async () => {
  // Vérifie si connectionState est défini
  if (this.connectionState?.isConnected) {
    resolve(this.connectionState);
    return;
  }

  // Vérifie les comptes du provider
  const accounts = this.hederaProvider?.getAccountAddresses();
  if (accounts && accounts.length > 0) {
    this.updateConnectionStateFromAccount(accounts[0]);
    resolve(this.connectionState);
    return;
  }

  // Continue à vérifier toutes les 500ms
  setTimeout(checkConnection, 500);
};
```

### 6. Mise à Jour de l'État

#### 6.1 Extraction des Informations du Compte
```typescript
// Format: "hedera:testnet:0.0.1234567"
const parts = accountString.split(":");
const namespace = parts[0]; // "hedera"
const network = parts[1];   // "testnet"
const accountId = parts[2]; // "0.0.1234567"
```

#### 6.2 Création de l'État de Connexion
```typescript
this.connectionState = {
  accountId: "0.0.1234567",
  network: "testnet",
  isConnected: true,
  namespace: "hedera",
  chainId: "hedera:testnet"
};
```

### 7. Retour au Hook useWallet

```typescript
// Le hook reçoit la connexion
setConnection(walletConnection);
setIsConnected(true);
setNamespace(walletConnection.namespace);

// Mise à jour du profil utilisateur
await updateUserWalletAddress(walletConnection.accountId);

// Chargement des soldes
await loadBalances(walletConnection.accountId);
```

### 8. Mise à Jour de l'Interface

Le composant `WalletConnection` affiche:
```typescript
<h3>Portefeuille connecté</h3>
<p>{formatAccountId(connection.accountId)}</p>
<p>Réseau: {connection.network}</p>
```

## Diagramme de Flux

```
Utilisateur clique sur "Connecter HashPack"
    ↓
useWallet.connectWallet()
    ↓
getWalletService() → HederaWalletService
    ↓
hederaWalletService.initialize()
    ├─ Créer HederaProvider
    ├─ Créer Native Adapter
    ├─ Créer EVM Adapter
    └─ Créer Modal WalletConnect (optionnel)
    ↓
hederaWalletService.connectWallet("hedera")
    ├─ Sélectionner nativeAdapter
    ├─ Ouvrir modal (si disponible)
    └─ Appeler adapter.connect()
    ↓
Attente de la connexion (polling toutes les 500ms)
    ├─ HashPack détecte la demande
    ├─ Utilisateur approuve dans HashPack
    └─ Connexion établie
    ↓
Récupération des informations du compte
    ↓
Mise à jour de connectionState
    ↓
Retour au hook useWallet
    ├─ Mise à jour de l'état React
    ├─ Mise à jour du profil utilisateur
    └─ Chargement des soldes
    ↓
Interface mise à jour: "Portefeuille connecté"
```

## Ce Qui Peut Mal Se Passer

### 1. HashPack Non Installé

**Symptôme**: Timeout après 120 secondes

**Erreur**:
```
WalletErrorCode.CONNECTION_TIMEOUT
"La connexion a expiré. Veuillez vérifier que HashPack est installé..."
```

**Solution**: Installer l'extension HashPack

### 2. HashPack Fermé

**Symptôme**: Aucune notification dans HashPack

**Erreur**: Timeout ou connexion rejetée

**Solution**: Ouvrir HashPack avant de cliquer sur le bouton

### 3. Project ID Invalide

**Symptôme**: Erreur immédiate lors de l'initialisation

**Erreur**:
```
WalletErrorCode.INVALID_PROJECT_ID
"WalletConnect Project ID is not configured..."
```

**Solution**: Vérifier `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` dans `.env.local`

### 4. Utilisateur Rejette la Connexion

**Symptôme**: HashPack s'ouvre mais l'utilisateur clique sur "Rejeter"

**Erreur**:
```
WalletErrorCode.CONNECTION_REJECTED
"La connexion a été fermée ou rejetée..."
```

**Solution**: Réessayer et approuver dans HashPack

### 5. Problème Réseau

**Symptôme**: Impossible de se connecter aux serveurs WalletConnect

**Erreur**:
```
WalletErrorCode.NETWORK_ERROR
"Problème de connexion réseau..."
```

**Solution**: Vérifier la connexion internet

## Différences avec AppKit

| Aspect | Mode Personnalisé | Mode AppKit |
|--------|------------------|-------------|
| **Service** | `HederaWalletService` | `AppKitWalletService` |
| **UI** | Bouton "Connecter HashPack" | Bouton AppKit stylisé |
| **Modal** | WalletConnect modal (optionnel) | AppKit modal (obligatoire) |
| **Connexion** | Direct via adapter | Via AppKit qui gère tout |
| **Polling** | Manuel (500ms) | Géré par AppKit |
| **Timeout** | 120 secondes | Géré par AppKit |
| **Wallets** | HashPack uniquement | Tous les wallets compatibles |

## Logs Console Attendus

En mode personnalisé, vous devriez voir:

```
Starting wallet connection...
Opening WalletConnect modal...
Connection check 1: [error details]
Connection check 2: [error details]
...
Wallet connected successfully: {
  accountId: "0.0.1234567",
  network: "testnet",
  isConnected: true,
  namespace: "hedera",
  chainId: "hedera:testnet"
}
```

## Vérification Rapide

Pour vérifier que le mode personnalisé est actif:

```javascript
// Dans la console du navigateur
console.log('AppKit enabled:', process.env.NEXT_PUBLIC_USE_APPKIT);
// Devrait afficher: false ou undefined

// Vérifier le service utilisé
import { isUsingAppKit } from '@/lib/wallet/wallet-service-factory';
console.log('Using AppKit:', isUsingAppKit());
// Devrait afficher: false
```

## Conclusion

En mode personnalisé (`NEXT_PUBLIC_USE_APPKIT=false`):

1. ✅ Le bouton appelle `HederaWalletService.connectWallet()`
2. ✅ Un modal WalletConnect peut s'ouvrir (si disponible)
3. ✅ HashPack détecte la demande de connexion
4. ✅ L'utilisateur approuve dans HashPack
5. ✅ La connexion est établie et l'état est mis à jour
6. ✅ L'interface affiche "Portefeuille connecté"

Le processus est **fonctionnel** mais nécessite que:
- HashPack soit installé
- Le Project ID WalletConnect soit valide
- L'utilisateur approuve la connexion dans HashPack

