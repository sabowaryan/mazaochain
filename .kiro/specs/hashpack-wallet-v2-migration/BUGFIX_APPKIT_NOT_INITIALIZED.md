# Correction: Erreur "AppKit not initialized"

## Problème

**Erreur affichée:**
```
Erreur de connexion au portefeuille
AppKit not initialized
Code: UNKNOWN_ERROR
```

## Cause Racine

L'erreur se produit parce que:

1. ✅ `NEXT_PUBLIC_USE_APPKIT=true` dans `.env.local`
2. ❌ Le système essaie d'utiliser `AppKitWalletService`
3. ❌ `AppKitWalletService.connectWallet()` appelle `getAppKit()`
4. ❌ `getAppKit()` retourne `null` car AppKit n'est pas initialisé
5. ❌ Erreur: "AppKit not initialized"

### Pourquoi AppKit N'Est Pas Initialisé?

L'implémentation actuelle d'AppKit a un problème d'architecture:

**Problème 1: Initialisation Séparée**
```typescript
// AppKitButton.tsx initialise AppKit
useEffect(() => {
  initializeAppKit(); // Initialise dans le composant
}, []);

// Mais AppKitWalletService essaie de l'utiliser immédiatement
async connectWallet() {
  const appKit = getAppKit(); // ❌ Peut être null!
  if (!appKit) {
    throw new Error("AppKit not initialized");
  }
}
```

**Problème 2: Timing**
- `AppKitButton` initialise AppKit de manière asynchrone
- `useWallet` peut appeler `connectWallet()` avant que l'initialisation soit terminée
- Résultat: `getAppKit()` retourne `null`

**Problème 3: Composant Non Utilisé**
- Si `AppKitButton` n'est pas rendu, AppKit n'est jamais initialisé
- Mais `useWallet` essaie quand même de l'utiliser
- Résultat: Erreur

## Solution Immédiate

**Désactiver AppKit et utiliser le mode personnalisé:**

### Étape 1: Modifier `.env.local`

```env
# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=b7f40149984135cf1c643959ed0de69a

# Désactiver AppKit (pas encore complètement implémenté)
NEXT_PUBLIC_USE_APPKIT=false
```

### Étape 2: Redémarrer le Serveur

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### Étape 3: Tester

1. Allez sur un dashboard
2. Cliquez sur "Connecter HashPack"
3. HashPack devrait s'ouvrir
4. Approuvez la connexion

## Solution à Long Terme

Pour que AppKit fonctionne correctement, il faut:

### Option 1: Initialisation dans le Service

Modifier `AppKitWalletService` pour initialiser AppKit lui-même:

```typescript
class AppKitWalletService implements IWalletService {
  private appKitInstance: any = null;

  async initialize(): Promise<void> {
    if (!this.appKitInstance) {
      this.appKitInstance = await initializeAppKit();
    }
  }

  async connectWallet(namespace: "hedera" | "eip155" = "hedera"): Promise<WalletConnection> {
    // S'assurer que AppKit est initialisé
    if (!this.appKitInstance) {
      await this.initialize();
    }

    // Maintenant on peut l'utiliser
    await this.appKitInstance.open();
    // ...
  }
}
```

### Option 2: Singleton Pattern

Créer un singleton AppKit qui s'initialise automatiquement:

```typescript
class AppKitSingleton {
  private static instance: any = null;
  private static initPromise: Promise<any> | null = null;

  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeAppKit();
    this.instance = await this.initPromise;
    this.initPromise = null;
    
    return this.instance;
  }
}
```

### Option 3: Utiliser Uniquement le Composant AppKit

Ne pas créer `AppKitWalletService`, mais utiliser uniquement `AppKitButton`:

```typescript
// Supprimer AppKitWalletService
// Utiliser uniquement le composant AppKitButton
// Le composant gère tout (initialisation + connexion)
```

## Pourquoi Le Mode Personnalisé Fonctionne

Le mode personnalisé (`NEXT_PUBLIC_USE_APPKIT=false`) fonctionne car:

1. ✅ `HederaWalletService` initialise son propre `HederaProvider`
2. ✅ L'initialisation se fait dans `initialize()` qui est appelée avant `connectWallet()`
3. ✅ Pas de dépendance sur un composant externe
4. ✅ Tout est géré dans le service lui-même

```typescript
class HederaWalletService {
  async initialize(): Promise<void> {
    // Crée son propre provider
    this.hederaProvider = await HederaProvider.init({...});
    this.isInitialized = true;
  }

  async connectWallet(): Promise<WalletConnection> {
    // S'assure d'être initialisé
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Utilise son provider
    await this.nativeAdapter.connect();
  }
}
```

## Comparaison

| Aspect | Mode Personnalisé | Mode AppKit (Actuel) |
|--------|------------------|----------------------|
| **Initialisation** | Dans le service | Dans le composant |
| **Dépendances** | Autonome | Dépend du composant |
| **Timing** | Contrôlé | Peut échouer |
| **État** | ✅ Fonctionne | ❌ Erreur |

## Recommandation

**Pour l'instant, utilisez le mode personnalisé:**

```env
NEXT_PUBLIC_USE_APPKIT=false
```

**Avantages:**
- ✅ Fonctionne immédiatement
- ✅ Pas d'erreurs
- ✅ Connexion HashPack opérationnelle
- ✅ Toutes les fonctionnalités disponibles

**Inconvénients:**
- ❌ Pas d'interface AppKit moderne
- ❌ Modal WalletConnect basique

## Test de Vérification

### Après avoir changé à `NEXT_PUBLIC_USE_APPKIT=false`:

1. **Redémarrez le serveur**
2. **Allez sur un dashboard**
3. **Cliquez sur "Connecter HashPack"**

**Résultat attendu:**
- ✅ Pas d'erreur "AppKit not initialized"
- ✅ HashPack s'ouvre (ou modal WalletConnect)
- ✅ Connexion fonctionne
- ✅ Soldes se chargent

## Logs Console

### Avec AppKit Activé (Erreur)

```
Starting wallet connection...
Error: AppKit not initialized
  at AppKitWalletService.connectWallet
  at useWallet.connectWallet
```

### Avec AppKit Désactivé (Fonctionne)

```
Starting wallet connection...
Opening WalletConnect modal...
Connection check 1: ...
Wallet connected successfully: {
  accountId: "0.0.1234567",
  network: "testnet",
  isConnected: true
}
```

## Prochaines Étapes

Pour implémenter AppKit correctement:

1. **Refactoriser `AppKitWalletService`**
   - Gérer l'initialisation dans le service
   - Ne pas dépendre du composant

2. **Tester l'initialisation**
   - Vérifier que AppKit s'initialise correctement
   - Gérer les erreurs d'initialisation

3. **Implémenter les méthodes manquantes**
   - `signTransaction()`
   - `signMessage()`
   - Gestion des événements

4. **Tester en profondeur**
   - Connexion
   - Déconnexion
   - Restauration de session
   - Transactions

## Conclusion

**Problème:** AppKit essaie de s'utiliser avant d'être initialisé

**Solution Immédiate:** Désactiver AppKit (`NEXT_PUBLIC_USE_APPKIT=false`)

**Solution Long Terme:** Refactoriser l'architecture AppKit

**État Actuel:**
- ✅ Mode personnalisé: Fonctionne
- ❌ Mode AppKit: Erreur "AppKit not initialized"

---

**Action Requise:** Redémarrez le serveur après avoir changé `.env.local`

