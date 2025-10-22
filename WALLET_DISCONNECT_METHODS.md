# 🔌 Guide de Déconnexion Wallet - MazaoChain

## 🎯 **Comment Se Déconnecter du Wallet**

Voici toutes les méthodes disponibles pour déconnecter votre wallet de MazaoChain :

### **1. 🎪 Menu Dropdown (Recommandé)**

**Composant** : `EnhancedWalletStatus` variant `dropdown`

**Comment faire** :
1. Cliquez sur votre wallet dans la navigation (header)
2. Un menu dropdown s'ouvre avec toutes les informations
3. Cliquez sur le bouton rouge "Déconnecter" en bas du menu

**Avantages** :
- ✅ Accès rapide depuis n'importe où
- ✅ Voir les informations avant de déconnecter
- ✅ Confirmation visuelle

```typescript
<EnhancedWalletStatus 
  variant="dropdown" 
  showBalance={true} 
  showNetwork={true} 
/>
```

### **2. 🔧 Modal AppKit Native**

**Composant** : `AppKitWalletButton` variant `account`

**Comment faire** :
1. Cliquez sur le bouton "Gérer le compte" ou similaire
2. La modal AppKit native s'ouvre
3. Utilisez l'option de déconnexion dans la modal

**Avantages** :
- ✅ Interface native AppKit
- ✅ Toutes les fonctionnalités wallet
- ✅ Changement de wallet possible

```typescript
<AppKitWalletButton variant="account" size="md" />
```

### **3. ⚡ Déconnexion Directe**

**Composant** : `QuickDisconnectButton`

**Comment faire** :
1. Cliquez directement sur le bouton de déconnexion
2. Confirmation optionnelle
3. Déconnexion immédiate

**Avantages** :
- ✅ Déconnexion immédiate
- ✅ Pas de menus à naviguer
- ✅ Confirmation optionnelle

```typescript
<QuickDisconnectButton 
  variant="button" 
  size="md" 
  showConfirmation={true} 
/>
```

### **4. 📱 Menu Utilisateur (Navigation)**

**Localisation** : Menu utilisateur dans la navigation

**Comment faire** :
1. Cliquez sur votre avatar utilisateur (coin supérieur droit)
2. Dans le menu déroulant, cliquez sur le bouton wallet
3. Gérez votre wallet via la modal AppKit

**Avantages** :
- ✅ Intégré au menu utilisateur
- ✅ Accessible depuis toutes les pages
- ✅ Contexte utilisateur clair

## 🎨 **Composants Disponibles**

### **EnhancedWalletStatus**
```typescript
// Dropdown complet avec déconnexion
<EnhancedWalletStatus 
  variant="dropdown" 
  showBalance={true} 
  showNetwork={true} 
/>

// Compact pour navigation
<EnhancedWalletStatus variant="compact" showNetwork={true} />

// Détaillé pour dashboards
<EnhancedWalletStatus 
  variant="detailed" 
  showBalance={true} 
  showNetwork={true} 
/>
```

### **AppKitWalletButton**
```typescript
// Bouton de gestion du compte
<AppKitWalletButton variant="account" size="md" />

// Bouton de connexion
<AppKitWalletButton variant="connect" size="lg" />

// Sélection de réseau
<AppKitWalletButton variant="network" size="sm" />
```

### **QuickDisconnectButton**
```typescript
// Bouton complet
<QuickDisconnectButton variant="button" size="md" />

// Icône seulement
<QuickDisconnectButton variant="icon" size="sm" />

// Texte seulement
<QuickDisconnectButton variant="text" />
```

## 🔧 **Intégration dans l'Application**

### **Navigation Header**
```typescript
// Desktop - Menu dropdown
<EnhancedWalletStatus 
  variant="dropdown" 
  showBalance={true} 
  showNetwork={true} 
/>

// Mobile - Détaillé
<EnhancedWalletStatus 
  variant="detailed" 
  showBalance={true} 
  showNetwork={true} 
/>
```

### **Menu Utilisateur**
```typescript
// Bouton de gestion wallet
<AppKitWalletButton 
  variant="account" 
  size="sm" 
  className="w-full justify-start"
/>
```

### **Pages Dashboard**
```typescript
// Déconnexion rapide
<QuickDisconnectButton 
  variant="button" 
  size="md" 
  showConfirmation={true} 
/>
```

## 🛡️ **Sécurité et Comportement**

### **Que se passe-t-il lors de la déconnexion ?**

1. **Session locale supprimée** : La connexion avec MazaoChain est fermée
2. **Wallet reste ouvert** : HashPack ou autre wallet reste actif
3. **Données préservées** : Votre profil MazaoChain est sauvegardé
4. **Transactions bloquées** : Plus de transactions blockchain possibles

### **Reconnexion**
- ✅ Même wallet : Reconnexion rapide
- ✅ Autre wallet : Changement de wallet possible
- ✅ Autre réseau : Mainnet ↔ Testnet
- ✅ Données intactes : Profil et historique préservés

## 📊 **Recommandations d'Usage**

### **Pour la Navigation**
- **Desktop** : `EnhancedWalletStatus` dropdown
- **Mobile** : `EnhancedWalletStatus` detailed

### **Pour les Dashboards**
- **Page wallet** : `AppKitWalletButton` account
- **Actions rapides** : `QuickDisconnectButton`

### **Pour les Formulaires**
- **Changement requis** : `AppKitWalletButton` connect
- **Déconnexion urgente** : `QuickDisconnectButton` icon

## 🎯 **Cas d'Usage Spécifiques**

### **Changement de Wallet**
1. Ouvrir modal AppKit via `AppKitWalletButton`
2. Déconnecter le wallet actuel
3. Connecter le nouveau wallet

### **Changement de Réseau**
1. Utiliser `AppKitWalletButton` variant `network`
2. Sélectionner Mainnet ou Testnet
3. Confirmer le changement

### **Déconnexion d'Urgence**
1. Utiliser `QuickDisconnectButton` sans confirmation
2. Déconnexion immédiate
3. Reconnexion possible à tout moment

---

*Toutes les méthodes de déconnexion sont maintenant disponibles ! 🎉*

**Méthode recommandée** : Menu dropdown `EnhancedWalletStatus` pour un accès complet et intuitif.