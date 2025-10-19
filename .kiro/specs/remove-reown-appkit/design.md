# Design Document

## Overview

Cette migration consiste à remplacer l'intégration Reown AppKit par l'utilisation directe de `@hashgraph/hedera-wallet-connect` avec DAppConnector. L'objectif est de simplifier l'architecture, réduire les dépendances, et utiliser l'approche native recommandée par Hedera.

### Motivation

- **Simplification**: Éliminer la couche d'abstraction AppKit qui ajoute de la complexité
- **Performance**: Réduire la taille du bundle en supprimant les dépendances Reown
- **Maintenance**: Utiliser l'API native Hedera qui est mieux documentée et supportée
- **Contrôle**: Avoir un contrôle direct sur la modal et l'expérience utilisateur

### Approche

La migration se fera en mettant à jour les fichiers existants sans créer de nouveaux composants ou services. Nous allons:

1. Remplacer les imports AppKit par DAppConnector dans `hedera-wallet.ts`
2. Mettre à jour la logique de connexion pour utiliser `DAppConnector.openModal()`
3. Adapter les gestionnaires d'événements pour utiliser les événements DAppConnector
4. Mettre à jour les composants UI pour fonctionner avec la nouvelle implémentation
5. Supprimer les fichiers et dépendances AppKit

## Architecture

### Structure actuelle

```
src/lib/wallet/
├── hedera-wallet.ts          # Service principal (utilise HederaProvider + AppKit)
├── appkit-config.ts          # Configuration AppKit (À SUPPRIMER)
└── wallet-service-factory.ts # Factory pour sélectionner le service

src/components/wallet/
├── WalletModal.tsx           # Modal personnalisée (À ADAPTER)
├── AppKitButton.tsx          # Bouton AppKit (À SUPPRIMER)
└── WalletConnectionWrapper.tsx # Wrapper de connexion

src/hooks/
└── useWallet.ts              # Hook React pour wallet
```

### Structure cible

```
src/lib/wallet/
├── hedera-wallet.ts          # Service principal (utilise DAppConnector)
└── wallet-service-factory.ts # Factory (simplifié)

src/components/wallet/
├── WalletModal.tsx           # Modal personnalisée (adaptée)
└── WalletConnectionWrapper.tsx # Wrapper de connexion

src/hooks/
└── useWallet.ts              # Hook React (adapté)
```

## Components and Interfaces

### 1. HederaWalletService (hedera-wallet.ts)

#### Changements principaux

**Imports**
```typescript
// AVANT
import {
  HederaProvider,
  HederaAdapter,
  HederaChainDefinition,
  hederaNamespace,
} from "@hashgraph/hedera-wallet-connect";

// APRÈS
import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
  DAppSigner,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";
import { WalletConnectModal } from "@walletconnect/modal";
```

**Propriétés de classe**
```typescript
// AVANT
private hederaProvider: HederaProvider | null = null;
private nativeAdapter: HederaAdapter | null = null;
private evmAdapter: HederaAdapter | null = null;
private modal: any = null;

// APRÈS
private dAppConnector: DAppConnector | null = null;
private signers: DAppSigner[] = [];
private walletConnectModal: WalletConnectModal | null = null;
```

**Méthode initialize()**
```typescript
async initialize(): Promise<void> {
  if (this.isInitialized) return;

  try {
    // Validation
    if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      throw new WalletError(
        WalletErrorCode.INVALID_PROJECT_ID,
        "WalletConnect Project ID is not configured"
      );
    }

    // Metadata
    const metadata = {
      name: env.NEXT_PUBLIC_HASHPACK_APP_NAME || "MazaoChain MVP",
      description: env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || "...",
      url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      icons: [`${env.NEXT_PUBLIC_APP_URL}/favicon.ico`],
    };

    // Déterminer le réseau
    const ledgerId = env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet" 
      ? LedgerId.MAINNET 
      : LedgerId.TESTNET;

    // Créer DAppConnector
    this.dAppConnector = new DAppConnector(
      metadata,
      ledgerId,
      env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Mainnet, HederaChainId.Testnet]
    );

    // Initialiser DAppConnector
    await this.dAppConnector.init({ logger: 'error' });

    // Créer WalletConnect modal
    this.walletConnectModal = new WalletConnectModal({
      projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      chains: ["hedera:mainnet", "hedera:testnet"],
    });

    // Restaurer session existante
    await this.restoreExistingSession();

    this.isInitialized = true;
  } catch (error) {
    // Gestion d'erreur
  }
}
```

**Méthode connectWallet()**
```typescript
async connectWallet(namespace: "hedera" | "eip155" = "hedera"): Promise<WalletConnection> {
  if (!this.isInitialized) {
    await this.initialize();
  }

  if (!this.dAppConnector) {
    throw new WalletError(
      WalletErrorCode.NOT_CONNECTED,
      "DAppConnector not initialized"
    );
  }

  try {
    // Vérifier si déjà connecté
    if (this.connectionState?.isConnected) {
      return this.connectionState;
    }

    console.log("Opening WalletConnect modal...");

    // Ouvrir la modal WalletConnect
    const session = await this.dAppConnector.openModal();

    // Extraire les signers de la session
    this.signers = this.createSignersFromSession(session);

    // Mettre à jour l'état de connexion
    if (this.signers.length > 0) {
      const firstSigner = this.signers[0];
      const accountId = firstSigner.getAccountId().toString();
      
      this.connectionState = {
        accountId,
        network: env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet",
        isConnected: true,
        namespace: "hedera",
        chainId: `hedera:${env.NEXT_PUBLIC_HEDERA_NETWORK}`,
      };

      // Sauvegarder la session
      this.saveSession();

      return this.connectionState;
    }

    throw new WalletError(
      WalletErrorCode.CONNECTION_FAILED,
      "No signers created from session"
    );
  } catch (error) {
    // Gestion d'erreur
  }
}
```

**Nouvelle méthode: createSignersFromSession()**
```typescript
private createSignersFromSession(session: SessionTypes.Struct): DAppSigner[] {
  const signers: DAppSigner[] = [];
  
  // Extraire les comptes de la session
  const accounts = Object.values(session.namespaces)
    .flatMap(namespace => namespace.accounts);

  for (const account of accounts) {
    // Format: hedera:testnet:0.0.12345
    const parts = account.split(':');
    if (parts.length >= 3 && parts[0] === 'hedera') {
      const accountId = parts[2];
      const network = parts[1];
      
      // Créer un signer via DAppConnector
      const signer = this.dAppConnector!.getSigner(
        AccountId.fromString(accountId)
      );
      
      signers.push(signer);
    }
  }

  return signers;
}
```

**Méthode signTransaction()**
```typescript
async signTransaction(transaction: Transaction): Promise<Transaction> {
  if (!this.connectionState || !this.dAppConnector) {
    throw new WalletError(
      WalletErrorCode.NOT_CONNECTED,
      "Wallet not connected"
    );
  }

  try {
    // Obtenir le signer approprié
    const signer = this.signers[0]; // Utiliser le premier signer
    if (!signer) {
      throw new WalletError(
        WalletErrorCode.NOT_CONNECTED,
        "No signer available"
      );
    }

    // Signer la transaction
    const signedTransaction = await signer.signTransaction(transaction);
    
    return signedTransaction;
  } catch (error) {
    // Gestion d'erreur
  }
}
```

**Méthode signMessage()**
```typescript
async signMessage(message: string): Promise<{ signatureMap: string }> {
  if (!this.connectionState || !this.dAppConnector) {
    throw new WalletError(
      WalletErrorCode.NOT_CONNECTED,
      "Wallet not connected"
    );
  }

  try {
    const signerAccountId = `hedera:${this.connectionState.network}:${this.connectionState.accountId}`;
    
    const result = await this.dAppConnector.signMessage({
      signerAccountId,
      message,
    });

    return result;
  } catch (error) {
    // Gestion d'erreur
  }
}
```

**Méthode disconnectWallet()**
```typescript
async disconnectWallet(): Promise<void> {
  try {
    if (this.dAppConnector) {
      // Déconnecter tous les signers
      for (const signer of this.signers) {
        await this.dAppConnector.disconnect(signer.topic);
      }
    }

    // Nettoyer l'état
    this.signers = [];
    this.connectionState = null;
    this.clearSavedSession();

    console.log("Wallet disconnected successfully");
  } catch (error) {
    // Gestion d'erreur
  }
}
```

**Gestion des événements**
```typescript
private setupSessionListeners(): void {
  if (!this.dAppConnector) return;

  // Les événements sont gérés automatiquement par DAppConnector
  // via les listeners internes configurés lors de l'initialisation
  
  // Note: DAppConnector gère automatiquement:
  // - session_event
  // - session_update
  // - session_delete
  // - pairing_delete
  
  // Les signers sont mis à jour automatiquement par DAppConnector
}
```

### 2. useWallet Hook (useWallet.ts)

#### Changements

Le hook `useWallet` reste largement inchangé car il utilise déjà l'abstraction `walletService`. Les seuls changements concernent:

1. **Polling de l'état**: Le polling existant continuera de fonctionner car il interroge `walletService.getConnectionState()`

2. **Gestion des événements**: Les événements sont maintenant gérés par DAppConnector en interne, donc pas de changement nécessaire dans le hook

3. **Pas de changements d'interface**: L'interface publique du hook reste identique

### 3. WalletModal Component (WalletModal.tsx)

#### Changements

Le composant `WalletModal` est déjà une modal personnalisée qui ne dépend pas d'AppKit. Aucun changement n'est nécessaire car:

1. Il affiche du contenu générique passé via `children`
2. Il ne fait pas d'appels directs à AppKit
3. Il est utilisé pour afficher des messages et confirmations

### 4. Suppression de fichiers

Les fichiers suivants seront supprimés:

1. **src/lib/wallet/appkit-config.ts** - Configuration AppKit non nécessaire
2. **src/components/wallet/AppKitButton.tsx** - Bouton AppKit non utilisé avec DAppConnector

### 5. wallet-service-factory.ts

#### Changements

Simplifier la factory pour supprimer la logique AppKit:

```typescript
// AVANT
export function getWalletService(): HederaWalletService {
  if (isAppKitEnabled()) {
    // Retourner service AppKit
  }
  return hederaWalletService;
}

// APRÈS
export function getWalletService(): HederaWalletService {
  return hederaWalletService;
}
```

## Data Models

### Session Data

**Format actuel (AppKit)**
```typescript
{
  accountId: string;
  network: "mainnet" | "testnet";
  namespace: "hedera" | "eip155";
  chainId: string;
  timestamp: number;
}
```

**Format cible (DAppConnector)**
```typescript
// Identique - pas de changement nécessaire
{
  accountId: string;
  network: "mainnet" | "testnet";
  namespace: "hedera" | "eip155";
  chainId: string;
  timestamp: number;
}
```

### DAppSigner

DAppConnector fournit des instances `DAppSigner` qui encapsulent:
- L'AccountId Hedera
- Le topic de session WalletConnect
- Les méthodes de signature (signTransaction, signMessage, etc.)

```typescript
interface DAppSigner {
  getAccountId(): AccountId;
  getMetadata(): SignClientTypes.Metadata;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAndExecuteTransaction(transaction: Transaction): Promise<TransactionResponse>;
  signMessage(message: string): Promise<SignMessageResult>;
  // ... autres méthodes
}
```

## Error Handling

### Codes d'erreur existants

Les codes d'erreur `WalletErrorCode` restent inchangés:
- `INITIALIZATION_FAILED`
- `NOT_CONNECTED`
- `CONNECTION_REJECTED`
- `CONNECTION_TIMEOUT`
- `TRANSACTION_REJECTED`
- `TRANSACTION_FAILED`
- `INSUFFICIENT_BALANCE`
- `INVALID_TRANSACTION`
- `NETWORK_ERROR`
- `WALLET_NOT_INSTALLED`
- `INVALID_PROJECT_ID`
- `UNKNOWN_ERROR`

### Mapping des erreurs DAppConnector

```typescript
// Erreurs DAppConnector -> WalletErrorCode
try {
  await dAppConnector.openModal();
} catch (error) {
  const errorMessage = error?.message || String(error);
  
  if (errorMessage.includes("User rejected")) {
    throw new WalletError(WalletErrorCode.CONNECTION_REJECTED, "...");
  } else if (errorMessage.includes("timeout") || errorMessage.includes("Proposal expired")) {
    throw new WalletError(WalletErrorCode.CONNECTION_TIMEOUT, "...");
  } else if (errorMessage.includes("Project ID")) {
    throw new WalletError(WalletErrorCode.INVALID_PROJECT_ID, "...");
  } else {
    throw new WalletError(WalletErrorCode.UNKNOWN_ERROR, "...", error);
  }
}
```

## Testing Strategy

### Tests à mettre à jour

1. **src/__tests__/wallet/appkit-integration.test.ts**
   - Renommer en `dappconnector-integration.test.ts`
   - Remplacer les mocks AppKit par des mocks DAppConnector
   - Tester l'initialisation de DAppConnector
   - Tester la création de signers depuis une session

2. **src/__tests__/wallet/appkit-modal-opening.test.tsx**
   - Renommer en `wallet-modal-opening.test.tsx`
   - Tester `dAppConnector.openModal()` au lieu d'AppKit
   - Vérifier la gestion des événements de session

### Stratégie de test

```typescript
// Mock DAppConnector
jest.mock('@hashgraph/hedera-wallet-connect', () => ({
  DAppConnector: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    openModal: jest.fn().mockResolvedValue({
      topic: 'test-topic',
      namespaces: {
        hedera: {
          accounts: ['hedera:testnet:0.0.12345'],
        },
      },
    }),
    getSigner: jest.fn().mockReturnValue({
      getAccountId: () => ({ toString: () => '0.0.12345' }),
      signTransaction: jest.fn(),
      signMessage: jest.fn(),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
  HederaSessionEvent: {
    ChainChanged: 'chainChanged',
    AccountsChanged: 'accountsChanged',
  },
  HederaJsonRpcMethod: {
    SignTransaction: 'hedera_signTransaction',
    SignMessage: 'hedera_signMessage',
  },
  HederaChainId: {
    Mainnet: 'hedera:mainnet',
    Testnet: 'hedera:testnet',
  },
}));
```

## Migration Steps

### Phase 1: Préparation
1. Vérifier que `@hashgraph/hedera-wallet-connect` est à jour
2. Vérifier que `@walletconnect/modal` est installé
3. Créer une branche de migration

### Phase 2: Mise à jour du service
1. Mettre à jour `hedera-wallet.ts` avec DAppConnector
2. Tester l'initialisation
3. Tester la connexion wallet
4. Tester la signature de transactions

### Phase 3: Nettoyage
1. Supprimer `appkit-config.ts`
2. Supprimer `AppKitButton.tsx`
3. Simplifier `wallet-service-factory.ts`
4. Supprimer les dépendances Reown du `package.json`

### Phase 4: Tests
1. Mettre à jour les tests existants
2. Exécuter la suite de tests complète
3. Tester manuellement la connexion wallet
4. Tester la signature de transactions

### Phase 5: Documentation
1. Mettre à jour le README avec les nouvelles instructions
2. Documenter les changements dans CHANGELOG
3. Mettre à jour les commentaires de code

## Dependencies

### Dépendances à conserver
- `@hashgraph/hedera-wallet-connect` (déjà installé)
- `@hashgraph/sdk` (déjà installé)
- `@walletconnect/modal` (déjà installé)

### Dépendances à supprimer
- `@reown/appkit`
- `@reown/appkit-adapter-wagmi` (si présent)
- Toutes autres dépendances `@reown/*`

### Commande de nettoyage
```bash
npm uninstall @reown/appkit @reown/appkit-adapter-wagmi
npm install # Pour nettoyer package-lock.json
```

## Rollback Plan

En cas de problème, le rollback est simple:

1. Revenir au commit précédent la migration
2. Restaurer les fichiers supprimés depuis Git
3. Réinstaller les dépendances Reown si nécessaire

Les données utilisateur (sessions localStorage) restent compatibles car le format n'a pas changé.

## Performance Considerations

### Amélioration de la taille du bundle

Suppression estimée:
- `@reown/appkit`: ~200KB
- Dépendances associées: ~100KB
- Total: ~300KB de réduction

### Amélioration du temps de chargement

- Moins de code à parser et exécuter
- Moins de dépendances à résoudre
- Initialisation plus rapide (pas de couche AppKit)

### Mémoire

- Moins d'objets en mémoire (pas de HederaProvider + HederaAdapter + AppKit)
- Un seul DAppConnector au lieu de multiples instances

## Security Considerations

### Pas de changement de sécurité

La migration n'affecte pas la sécurité car:

1. **Même protocole WalletConnect**: Utilise toujours WalletConnect v2
2. **Même cryptographie**: Les signatures utilisent les mêmes algorithmes
3. **Même gestion de session**: Les sessions sont gérées de la même manière
4. **Pas de clés privées**: Aucune clé privée n'est stockée (comme avant)

### Validation

- Les transactions sont toujours signées dans le wallet (HashPack)
- L'utilisateur doit toujours approuver chaque transaction
- Les sessions expirent après 24 heures (comme avant)

## Conclusion

Cette migration simplifie considérablement l'architecture wallet en utilisant directement DAppConnector au lieu de passer par AppKit. Les bénéfices incluent:

- Code plus simple et maintenable
- Bundle plus léger
- Meilleur contrôle sur l'UX
- API native Hedera mieux documentée

La migration est relativement simple car elle se concentre sur la mise à jour de `hedera-wallet.ts` et la suppression de fichiers inutilisés, sans créer de nouveaux composants.
