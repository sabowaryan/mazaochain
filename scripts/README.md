# Scripts de Test MazaoChain

## Créer des Comptes Wallet de Test

### Prérequis

1. Avoir Node.js installé
2. Avoir un compte serveur Hedera avec des fonds (configuré dans `.env.local`)
3. Installer les dépendances: `npm install`

### Utilisation

```bash
node scripts/create-test-wallets.js
```

### Ce que fait le script

Le script crée **3 comptes de test** sur Hedera Testnet:

1. **FARMER** - Compte pour tester les fonctionnalités agriculteur
2. **COOPERATIVE** - Compte pour tester les fonctionnalités coopérative
3. **LENDER** - Compte pour tester les fonctionnalités prêteur

Chaque compte reçoit:
- ✅ 10 HBAR de balance initiale
- ✅ Une paire de clés (publique/privée) unique
- ✅ Un Account ID Hedera

### Résultat

Le script génère:

1. **Affichage console** avec tous les détails des comptes
2. **Fichier `test-wallets.json`** avec les informations complètes
3. **Variables d'environnement** à copier dans `.env.local`

### Exemple de sortie

```
✨ TEST WALLETS CREATED SUCCESSFULLY!

📍 FARMER ACCOUNT
   Account ID:  0.0.1234567
   Public Key:  302a300506032b6570032100...
   Private Key: 302e020100300506032b657004220420...
   Balance:     10 ℏ
   HashScan:    https://hashscan.io/testnet/account/0.0.1234567

📍 COOPERATIVE ACCOUNT
   Account ID:  0.0.1234568
   ...

📍 LENDER ACCOUNT
   Account ID:  0.0.1234569
   ...
```

### Utilisation des comptes créés

#### Option 1: Import dans HashPack (Recommandé pour tests UI)

1. Ouvrez HashPack
2. Cliquez sur "Import Account"
3. Collez la **Private Key** du compte
4. Le compte sera importé avec son solde

#### Option 2: Utilisation programmatique

Ajoutez les variables dans `.env.local`:

```env
# Test Accounts
TEST_FARMER_ACCOUNT_ID=0.0.1234567
TEST_FARMER_PRIVATE_KEY=302e020100300506032b657004220420...

TEST_COOPERATIVE_ACCOUNT_ID=0.0.1234568
TEST_COOPERATIVE_PRIVATE_KEY=302e020100300506032b657004220420...

TEST_LENDER_ACCOUNT_ID=0.0.1234569
TEST_LENDER_PRIVATE_KEY=302e020100300506032b657004220420...
```

### Coût

- Création d'un compte: ~1 HBAR
- Balance initiale par compte: 10 HBAR
- **Total nécessaire: ~33 HBAR** (3 comptes × 11 HBAR)

### Obtenir des HBAR de test

Si votre compte serveur n'a pas assez de fonds:

```
https://portal.hedera.com/faucet
```

Entrez votre `HEDERA_ACCOUNT_ID` et recevez 10,000 HBAR de test gratuits.

### Sécurité

⚠️ **IMPORTANT:**

- Ces comptes sont pour **TESTNET UNIQUEMENT**
- Ne JAMAIS utiliser ces clés sur mainnet
- Ne JAMAIS committer `test-wallets.json` dans Git
- Le fichier est automatiquement ignoré par `.gitignore`
- Pour la production, les utilisateurs utiliseront leurs propres wallets HashPack

### Vérification des comptes

Vérifiez vos comptes sur HashScan:

```
https://hashscan.io/testnet/account/VOTRE_ACCOUNT_ID
```

### Dépannage

**Erreur: "Insufficient balance"**
- Votre compte serveur n'a pas assez de HBAR
- Utilisez le faucet pour obtenir plus de fonds

**Erreur: "Missing HEDERA_ACCOUNT_ID"**
- Vérifiez que `.env.local` contient les variables Hedera
- Assurez-vous que le fichier est à la racine du projet

**Erreur: "Invalid operator key"**
- Vérifiez que `HEDERA_PRIVATE_KEY` est correct
- La clé doit être au format hexadécimal (64 caractères)

### Nettoyage

Pour supprimer les comptes de test (optionnel):

```bash
# Les comptes restent sur la blockchain mais vous pouvez supprimer le fichier local
rm scripts/test-wallets.json
```

Note: Les comptes Hedera ne peuvent pas être supprimés de la blockchain, mais ils peuvent être vidés de leurs fonds.
