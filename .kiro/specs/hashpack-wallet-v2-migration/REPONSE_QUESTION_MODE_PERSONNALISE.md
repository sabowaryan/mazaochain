# Réponse: Que Se Passe-t-il Quand AppKit Est Désactivé?

## Question

> Si AppKit est désactivé, lorsque l'on clique sur le bouton, qu'est-ce qui se passe concrètement?

## Réponse Courte

Quand `NEXT_PUBLIC_USE_APPKIT=false` (ou non défini), le système utilise **HederaWalletService** qui:

1. ✅ Peut ouvrir un **modal WalletConnect** avec un QR code
2. ✅ Ou ouvre **HashPack directement** (si l'extension détecte la demande)
3. ✅ Attend que l'utilisateur **approuve dans HashPack**
4. ✅ Établit la connexion via **WalletConnect v2**

## Réponse Détaillée

### Flux Complet

```
Clic sur "Connecter HashPack"
    ↓
useWallet.connectWallet()
    ↓
getWalletService() retourne HederaWalletService
    ↓
HederaWalletService.initialize()
    ├─ Créer HederaProvider (WalletConnect v2)
    ├─ Créer HederaAdapter (Native + EVM)
    └─ Créer WalletConnectModal (optionnel)
    ↓
HederaWalletService.connectWallet("hedera")
    ↓
adapter.connect() est appelé
    ↓
┌─────────────────────────────────────┐
│  DEUX SCÉNARIOS POSSIBLES:          │
└─────────────────────────────────────┘
    ↓
Scénario A: Modal WalletConnect
    ├─ Un modal s'ouvre avec QR code
    ├─ Liste des wallets compatibles
    ├─ Option "HashPack" visible
    └─ Utilisateur clique sur HashPack
    ↓
Scénario B: HashPack Direct
    ├─ HashPack détecte la demande
    ├─ Extension s'ouvre automatiquement
    └─ Demande de connexion affichée
    ↓
Dans HashPack:
    ├─ Affiche les détails de l'app
    ├─ Nom: "MazaoChain MVP"
    ├─ URL: "http://localhost:3000"
    └─ Utilisateur clique "Approuver"
    ↓
Connexion établie via WalletConnect v2
    ↓
HederaWalletService reçoit les infos
    ├─ Account ID: "0.0.XXXXXXX"
    ├─ Network: "testnet"
    └─ Namespace: "hedera"
    ↓
useWallet met à jour l'état React
    ├─ isConnected = true
    ├─ connection = {...}
    └─ Charge les soldes
    ↓
Interface affiche "Portefeuille connecté"
```

## Ce Qui S'Affiche Concrètement

### 1. Avant le Clic

```
┌─────────────────────────────────────┐
│  [Icône Wallet]                     │
│                                     │
│  Connecter HashPack                 │
│                                     │
│  Connectez votre portefeuille       │
│  HashPack pour accéder aux          │
│  fonctionnalités blockchain         │
│                                     │
│  [Bouton: Connecter HashPack]       │
└─────────────────────────────────────┘
```

### 2. Pendant la Connexion (Scénario A)

**Modal WalletConnect s'ouvre:**

```
┌─────────────────────────────────────┐
│  Connect your wallet                │
│                                     │
│  [QR Code]                          │
│                                     │
│  Scan with your wallet              │
│                                     │
│  Or choose a wallet:                │
│  ┌─────────────────────────────┐   │
│  │ [Logo] HashPack             │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [Logo] Other Wallet         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 3. Pendant la Connexion (Scénario B)

**HashPack s'ouvre directement:**

```
┌─────────────────────────────────────┐
│  HashPack                           │
│                                     │
│  Connection Request                 │
│                                     │
│  MazaoChain MVP wants to connect    │
│                                     │
│  URL: http://localhost:3000         │
│  Description: Decentralized lending │
│               platform for farmers  │
│                                     │
│  [Reject]  [Approve]                │
└─────────────────────────────────────┘
```

### 4. Après Approbation

```
┌─────────────────────────────────────┐
│  Portefeuille connecté    [Native]  │
│  0.0.1234...5678                    │
│  Réseau: Testnet                    │
│                                     │
│  [Actualiser] [Déconnecter]         │
│                                     │
│  Soldes                             │
│  ┌─────────────────────────────┐   │
│  │ HBAR    10.5000 HBAR        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Différence avec AppKit

| Aspect | Mode Personnalisé (AppKit=false) | Mode AppKit (AppKit=true) |
|--------|----------------------------------|---------------------------|
| **Bouton** | "Connecter HashPack" | Bouton AppKit stylisé |
| **Modal** | WalletConnect modal (optionnel) | AppKit modal (obligatoire) |
| **Apparence** | QR code + liste simple | Interface moderne AppKit |
| **Wallets** | Tous compatibles WalletConnect | Tous + gestion AppKit |
| **Connexion** | Via HederaAdapter | Via AppKit qui gère tout |
| **Code** | `HederaWalletService` | `AppKitWalletService` |

## Logs Console

Quand vous cliquez sur le bouton en mode personnalisé:

```javascript
// 1. Début de la connexion
Starting wallet connection...

// 2. Ouverture du modal (si disponible)
Opening WalletConnect modal...

// 3. Vérifications périodiques (toutes les 500ms)
Connection check 1: Not initialized
Connection check 2: Not initialized
Connection check 3: Not initialized
...

// 4. Connexion réussie
Wallet connected successfully: {
  accountId: "0.0.1234567",
  network: "testnet",
  isConnected: true,
  namespace: "hedera",
  chainId: "hedera:testnet"
}

// 5. Chargement des soldes
Loading balances for account: 0.0.1234567
Balances loaded: { hbar: "10.5", tokens: [] }
```

## Pourquoi Ça Peut Ne Pas Fonctionner

### 1. HashPack Non Installé

**Symptôme**: Timeout après 120 secondes

**Ce qui se passe**:
- Modal s'ouvre avec QR code
- Aucun wallet ne répond
- Timeout après 2 minutes
- Erreur: "La connexion a expiré"

**Solution**: Installer HashPack

### 2. HashPack Fermé

**Symptôme**: Pas de notification

**Ce qui se passe**:
- Demande de connexion envoyée
- HashPack ne détecte pas (fermé)
- Timeout

**Solution**: Ouvrir HashPack avant de cliquer

### 3. Project ID Invalide

**Symptôme**: Erreur immédiate

**Ce qui se passe**:
- Tentative d'initialisation
- WalletConnect rejette le Project ID
- Erreur: "Invalid Project ID"

**Solution**: Vérifier `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### 4. Utilisateur Rejette

**Symptôme**: HashPack s'ouvre puis se ferme

**Ce qui se passe**:
- HashPack affiche la demande
- Utilisateur clique "Reject"
- Erreur: "Connexion rejetée"

**Solution**: Réessayer et approuver

## Vérification Rapide

Pour vérifier que le mode personnalisé est actif:

```javascript
// Dans la console du navigateur (F12)

// 1. Vérifier la variable d'environnement
console.log('AppKit:', process.env.NEXT_PUBLIC_USE_APPKIT);
// Devrait afficher: undefined ou "false"

// 2. Vérifier le service utilisé
// (Regardez le code source de la page)
// Vous devriez voir "Connecter HashPack" et non un bouton AppKit

// 3. Vérifier les logs
// Après avoir cliqué, vous devriez voir:
// "Starting wallet connection..."
// "Opening WalletConnect modal..."
```

## Résumé

**Quand AppKit est désactivé et que vous cliquez sur "Connecter HashPack":**

1. 🔄 Le système initialise **HederaWalletService**
2. 📱 Un **modal WalletConnect** peut s'ouvrir (avec QR code)
3. 🔗 **HashPack détecte** la demande de connexion
4. ✅ L'utilisateur **approuve dans HashPack**
5. 🎉 La **connexion est établie** via WalletConnect v2
6. 💰 Les **soldes se chargent** automatiquement
7. ✨ L'interface affiche **"Portefeuille connecté"**

**C'est une connexion WalletConnect v2 standard**, similaire à ce que vous verriez sur d'autres dApps, mais sans l'interface moderne d'AppKit.

---

**Documentation Complète**: Voir `CUSTOM_MODE_FLOW_EXPLANATION.md` pour tous les détails techniques.

