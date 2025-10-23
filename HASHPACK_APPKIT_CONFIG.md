# Configuration AppKit pour HashPack

## Vue d'ensemble

La configuration AppKit a été optimisée pour utiliser HashPack comme wallet principal et préféré pour MazaoChain. Cette configuration garantit que les QR codes et les liens de connexion ouvrent exclusivement HashPack.

## Modifications Apportées

### 1. **Wallet IDs Spécifiques**

```typescript
includeWalletIds: [
  "hashpack", // HashPack wallet ID standard
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // HashPack official ID
],
```

Cette configuration force AppKit à n'afficher que HashPack dans la liste des wallets disponibles.

### 2. **Configuration Wallet Personnalisée**

```typescript
customWallets: [
  {
    id: "hashpack_custom",
    name: "HashPack",
    homepage: "https://hashpack.app/",
    mobile_link: "hashpack://app",        // Deep link pour mobile
    desktop_link: "https://hashpack.app/", // Lien pour desktop
    webapp_link: "https://hashpack.app/",  // Application web
    app_store: "https://apps.apple.com/app/hashpack/id1580324734",
    play_store: "https://play.google.com/store/apps/details?id=com.hashpack.wallet",
  }
]
```

### 3. **Liens et Intégrations**

| Plateforme | Lien | Description |
|------------|------|-------------|
| **Mobile iOS/Android** | `hashpack://app` | Deep link direct vers l'app |
| **Desktop** | `https://hashpack.app/` | Extension navigateur |
| **Web App** | `https://hashpack.app/` | Application web |
| **App Store** | Apple App Store | Installation iOS |
| **Play Store** | Google Play Store | Installation Android |

## Avantages de cette Configuration

### ✅ **Expérience Utilisateur Simplifiée**
- **Un seul wallet** affiché dans AppKit
- **Pas de confusion** avec d'autres wallets
- **Connexion directe** vers HashPack

### ✅ **QR Code Optimisé**
- **QR codes spécifiques** à HashPack
- **Ouverture automatique** de l'app mobile
- **Pas de sélection** de wallet nécessaire

### ✅ **Support Multi-Plateforme**
- **Mobile** : Deep link `hashpack://app`
- **Desktop** : Extension navigateur
- **Web** : Application web HashPack

### ✅ **Installation Facilitée**
- **Liens directs** vers les stores
- **Redirection automatique** selon la plateforme
- **Expérience fluide** pour les nouveaux utilisateurs

## Flux d'Utilisation

### **Mobile (iOS/Android)**
```
1. Utilisateur scanne QR code
2. QR code contient: hashpack://app?uri=...
3. Système ouvre HashPack automatiquement
4. Connexion directe sans étapes supplémentaires
```

### **Desktop**
```
1. Utilisateur clique "Se connecter"
2. Modal AppKit s'ouvre avec HashPack uniquement
3. Clic sur HashPack → Redirection vers hashpack.app
4. Connexion via extension navigateur
```

### **Nouveaux Utilisateurs**
```
1. HashPack non installé détecté
2. Redirection automatique vers App Store/Play Store
3. Installation guidée
4. Retour à MazaoChain pour connexion
```

## Configuration Technique

### **Variables d'Environnement Utilisées**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_HASHPACK_APP_NAME=MazaoChain MVP
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Decentralized lending platform for farmers
NEXT_PUBLIC_APP_URL=https://mazaochain.com
```

### **Réseaux Supportés**
- **Hedera Mainnet** (Native + EVM)
- **Hedera Testnet** (Native + EVM)

### **Fonctionnalités Désactivées**
```typescript
features: {
  analytics: false,  // Pas de tracking
  email: false,      // Pas de connexion email
  socials: [],       // Pas de connexion sociale
}
```

## Thème MazaoChain

### **Couleurs Personnalisées**
```typescript
themeVariables: {
  "--w3m-accent": "#10b981",              // Vert MazaoChain (emerald-500)
  "--w3m-border-radius-master": "8px",    // Coins arrondis
}
```

### **Mode d'Affichage**
- **Mode clair** par défaut
- **Cohérent** avec le design MazaoChain
- **Branding** intégré

## Tests Recommandés

### **Mobile**
1. ✅ Scanner QR code ouvre HashPack
2. ✅ Deep link fonctionne correctement
3. ✅ Redirection App Store si non installé

### **Desktop**
1. ✅ Modal n'affiche que HashPack
2. ✅ Clic redirige vers hashpack.app
3. ✅ Extension navigateur se connecte

### **Nouveaux Utilisateurs**
1. ✅ Détection HashPack non installé
2. ✅ Redirection vers stores appropriés
3. ✅ Retour fluide après installation

## Maintenance

### **Mise à Jour des IDs**
Si HashPack change ses identifiants :
1. Mettre à jour `includeWalletIds`
2. Vérifier `customWallets.id`
3. Tester la connexion

### **Nouveaux Liens**
Si HashPack met à jour ses URLs :
1. Mettre à jour `mobile_link`, `desktop_link`, `webapp_link`
2. Vérifier `app_store` et `play_store`
3. Tester sur toutes les plateformes

Cette configuration garantit une expérience HashPack optimale et cohérente pour tous les utilisateurs de MazaoChain ! 🚀