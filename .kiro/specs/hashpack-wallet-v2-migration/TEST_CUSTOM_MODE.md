# Test du Mode Personnalisé (AppKit Désactivé)

## Objectif

Vérifier que la connexion HashPack fonctionne correctement en mode personnalisé.

## Prérequis

1. ✅ HashPack installé dans le navigateur
2. ✅ Compte HashPack créé et configuré
3. ✅ `.env.local` configuré correctement

## Configuration

### Étape 1: Désactiver AppKit

Modifiez `.env.local`:

```env
# Désactiver AppKit
NEXT_PUBLIC_USE_APPKIT=false

# OU commentez/supprimez la ligne
# NEXT_PUBLIC_USE_APPKIT=true

# Vérifiez que le Project ID est présent
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=b7f40149984135cf1c643959ed0de69a
```

### Étape 2: Redémarrer le Serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm run dev
```

**Important**: Le redémarrage est OBLIGATOIRE pour que les changements d'environnement prennent effet.

## Test 1: Vérification de la Configuration

### Dans la Console du Navigateur

```javascript
// Ouvrez la console (F12)
console.log('AppKit:', process.env.NEXT_PUBLIC_USE_APPKIT);
// Devrait afficher: undefined ou "false"

console.log('Project ID:', process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
// Devrait afficher: "b7f40149984135cf1c643959ed0de69a"
```

### Résultat Attendu

- ✅ `NEXT_PUBLIC_USE_APPKIT` est `undefined` ou `"false"`
- ✅ `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` est défini
- ✅ Pas d'erreurs dans la console

## Test 2: Interface Utilisateur

### Étape 1: Navigation

1. Ouvrez `http://localhost:3000`
2. Connectez-vous à votre compte
3. Allez sur un dashboard:
   - `/fr/dashboard/farmer`
   - `/fr/dashboard/lender`
   - `/fr/dashboard/cooperative`

### Étape 2: Vérification du Bouton

**Vous devriez voir**:

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

**Vous NE devriez PAS voir**:
- ❌ Bouton AppKit stylisé
- ❌ Message "Using Reown AppKit"
- ❌ Composant `<appkit-button />`

### Résultat Attendu

- ✅ Bouton "Connecter HashPack" visible
- ✅ Style standard (pas AppKit)
- ✅ Texte en français
- ✅ Icône de wallet

## Test 3: Connexion au Wallet

### Étape 1: Préparer HashPack

1. Ouvrez l'extension HashPack
2. Assurez-vous d'être connecté à votre compte
3. Vérifiez que vous êtes sur le bon réseau (Testnet)

### Étape 2: Cliquer sur le Bouton

1. Cliquez sur "Connecter HashPack"
2. Observez ce qui se passe

### Scénario A: Modal WalletConnect S'Ouvre

**Vous devriez voir**:
- Un modal avec un QR code
- Option "HashPack" dans la liste
- Possibilité de scanner le QR code

**Actions**:
1. Cliquez sur "HashPack" dans le modal
2. OU scannez le QR code avec HashPack mobile

### Scénario B: HashPack S'Ouvre Directement

**Vous devriez voir**:
- HashPack s'ouvre automatiquement
- Demande de connexion affichée
- Détails de l'application (MazaoChain MVP)

**Actions**:
1. Vérifiez les détails de la connexion
2. Cliquez sur "Approuver" ou "Connect"

### Étape 3: Vérifier la Console

Pendant la connexion, la console devrait afficher:

```
Starting wallet connection...
Opening WalletConnect modal...
Connection check 1: ...
Connection check 2: ...
...
Wallet connected successfully: {
  accountId: "0.0.XXXXXXX",
  network: "testnet",
  isConnected: true,
  namespace: "hedera",
  chainId: "hedera:testnet"
}
```

### Résultat Attendu

- ✅ HashPack s'ouvre (modal ou extension)
- ✅ Demande de connexion visible
- ✅ Détails corrects (nom, description, URL)
- ✅ Logs dans la console

## Test 4: Approbation de la Connexion

### Dans HashPack

1. Vérifiez les informations:
   - **Nom**: MazaoChain MVP
   - **Description**: Decentralized lending platform for farmers
   - **URL**: http://localhost:3000

2. Cliquez sur "Approuver" / "Connect"

### Dans l'Application

**Vous devriez voir**:

```
┌─────────────────────────────────────┐
│  Portefeuille connecté    [Native]  │
│  0.0.XXXX...XXXX                    │
│  Réseau: Testnet                    │
│                                     │
│  [Actualiser] [Déconnecter]         │
│                                     │
│  Soldes                             │
│  HBAR: X.XXXX HBAR                  │
└─────────────────────────────────────┘
```

### Résultat Attendu

- ✅ Statut change à "Portefeuille connecté"
- ✅ Account ID affiché (format: 0.0.XXXXXXX)
- ✅ Badge "Native" visible
- ✅ Réseau affiché (Testnet)
- ✅ Boutons "Actualiser" et "Déconnecter" visibles
- ✅ Soldes commencent à se charger

## Test 5: Vérification des Soldes

### Attendre le Chargement

Les soldes peuvent prendre quelques secondes à charger.

**Vous devriez voir**:
- Solde HBAR
- Liste des tokens (si vous en avez)
- Pas d'erreur "Impossible de charger les soldes"

### Résultat Attendu

- ✅ Solde HBAR affiché correctement
- ✅ Tokens affichés (si présents)
- ✅ Pas d'erreurs dans la console

## Test 6: Actualisation des Soldes

1. Cliquez sur "Actualiser"
2. Observez l'indicateur de chargement
3. Vérifiez que les soldes se mettent à jour

### Résultat Attendu

- ✅ Bouton devient "Actualisation..."
- ✅ Spinner visible
- ✅ Soldes se rechargent
- ✅ Pas d'erreurs

## Test 7: Déconnexion

1. Cliquez sur "Déconnecter"
2. Observez le changement d'état

### Résultat Attendu

- ✅ Retour à l'état "non connecté"
- ✅ Bouton "Connecter HashPack" réapparaît
- ✅ Soldes disparaissent
- ✅ Pas d'erreurs dans la console

## Test 8: Reconnexion

1. Cliquez à nouveau sur "Connecter HashPack"
2. Vérifiez si la session est restaurée automatiquement

### Résultat Attendu

- ✅ Connexion plus rapide (session restaurée)
- OU
- ✅ Nouvelle demande d'approbation dans HashPack

## Problèmes Courants et Solutions

### Problème 1: Rien Ne Se Passe au Clic

**Symptômes**:
- Clic sur le bouton
- Aucune réaction
- Pas de modal
- HashPack ne s'ouvre pas

**Vérifications**:
```javascript
// Console du navigateur
console.log('AppKit:', process.env.NEXT_PUBLIC_USE_APPKIT);
// Doit être: undefined ou "false"

// Vérifier les erreurs
// Cherchez les messages en rouge
```

**Solutions**:
1. Vérifiez que le serveur a été redémarré
2. Vérifiez `.env.local`
3. Videz le cache du navigateur (Ctrl+Shift+Delete)
4. Rechargez la page (Ctrl+F5)

### Problème 2: Timeout après 120 Secondes

**Symptômes**:
- Modal s'ouvre
- Attente longue
- Erreur: "La connexion a expiré"

**Causes Possibles**:
- HashPack non installé
- HashPack fermé
- Mauvais réseau

**Solutions**:
1. Vérifiez que HashPack est installé
2. Ouvrez HashPack avant de cliquer
3. Vérifiez le réseau dans HashPack (Testnet)

### Problème 3: Erreur "Invalid Project ID"

**Symptômes**:
- Erreur immédiate
- Message: "WalletConnect Project ID is not configured"

**Solution**:
```env
# Dans .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=b7f40149984135cf1c643959ed0de69a
```

Redémarrez le serveur.

### Problème 4: Modal Ne Se Ferme Pas

**Symptômes**:
- Connexion réussie
- Modal reste ouvert

**Solution**:
- Cliquez en dehors du modal
- Ou rechargez la page

### Problème 5: Soldes Ne Se Chargent Pas

**Symptômes**:
- Connexion réussie
- Message: "Impossible de charger les soldes"

**Vérifications**:
```javascript
// Console
// Cherchez les erreurs liées à "balance" ou "account"
```

**Solutions**:
1. Cliquez sur "Actualiser"
2. Vérifiez la connexion internet
3. Vérifiez que le compte existe sur Testnet

## Checklist Complète

### Configuration
- [ ] `NEXT_PUBLIC_USE_APPKIT=false` dans `.env.local`
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` défini
- [ ] Serveur redémarré après les modifications
- [ ] HashPack installé et configuré

### Interface
- [ ] Bouton "Connecter HashPack" visible
- [ ] Pas de bouton AppKit
- [ ] Style standard (pas AppKit)

### Connexion
- [ ] Clic sur le bouton fonctionne
- [ ] Modal ou HashPack s'ouvre
- [ ] Demande de connexion visible
- [ ] Approbation fonctionne

### État Connecté
- [ ] Statut "Portefeuille connecté"
- [ ] Account ID affiché
- [ ] Badge "Native" visible
- [ ] Réseau affiché

### Soldes
- [ ] Solde HBAR affiché
- [ ] Tokens affichés (si présents)
- [ ] Actualisation fonctionne

### Déconnexion
- [ ] Bouton "Déconnecter" fonctionne
- [ ] Retour à l'état initial
- [ ] Pas d'erreurs

## Logs Console Attendus

### Connexion Réussie

```
Starting wallet connection...
Opening WalletConnect modal...
Connection check 1: Not initialized
Connection check 2: Not initialized
...
Wallet connected successfully: {
  accountId: "0.0.1234567",
  network: "testnet",
  isConnected: true,
  namespace: "hedera",
  chainId: "hedera:testnet"
}
```

### Chargement des Soldes

```
Loading balances for account: 0.0.1234567
Balances loaded: {
  hbar: "10.5",
  tokens: []
}
```

### Déconnexion

```
Disconnecting wallet...
Wallet disconnected successfully
```

## Résultat Final

Si tous les tests passent:

✅ **Mode personnalisé fonctionne correctement**
- Connexion HashPack opérationnelle
- Interface utilisateur correcte
- Soldes se chargent
- Déconnexion fonctionne

Si des tests échouent:

❌ **Problèmes à résoudre**
- Consultez la section "Problèmes Courants"
- Vérifiez les logs console
- Vérifiez la configuration

---

**Prochaine Étape**: Testez le mode AppKit en changeant `NEXT_PUBLIC_USE_APPKIT=true`

