# Guide: Créer des Comptes de Test Manuellement

Puisque la clé privée du compte serveur ne fonctionne pas, voici comment créer les 3 comptes de test manuellement.

## Méthode 1: Via Hedera Portal (Plus Simple)

### Étape 1: Créer le compte FARMER

1. Allez sur https://portal.hedera.com/
2. Cliquez sur "Create Account"
3. Sélectionnez "Testnet"
4. Notez les informations:
   ```
   Account ID: 0.0.XXXXXXX
   Public Key: 302a300506032b6570032100...
   Private Key: 302e020100300506032b657004220420...
   ```
5. Vous recevrez automatiquement 10,000 HBAR

### Étape 2: Créer le compte COOPERATIVE

Répétez l'étape 1 pour créer un deuxième compte.

### Étape 3: Créer le compte LENDER

Répétez l'étape 1 pour créer un troisième compte.

### Étape 4: Sauvegarder les informations

Créez un fichier `scripts/test-wallets.json`:

```json
{
  "created": "2025-10-16T15:30:00.000Z",
  "network": "testnet",
  "accounts": [
    {
      "type": "FARMER",
      "accountId": "0.0.XXXXXXX",
      "publicKey": "302a300506032b6570032100...",
      "privateKey": "302e020100300506032b657004220420...",
      "balance": "10000 ℏ"
    },
    {
      "type": "COOPERATIVE",
      "accountId": "0.0.YYYYYYY",
      "publicKey": "302a300506032b6570032100...",
      "privateKey": "302e020100300506032b657004220420...",
      "balance": "10000 ℏ"
    },
    {
      "type": "LENDER",
      "accountId": "0.0.ZZZZZZZ",
      "publicKey": "302a300506032b6570032100...",
      "privateKey": "302e020100300506032b657004220420...",
      "balance": "10000 ℏ"
    }
  ]
}
```

### Étape 5: Ajouter à .env.local

```env
# Test Accounts
TEST_FARMER_ACCOUNT_ID=0.0.XXXXXXX
TEST_FARMER_PRIVATE_KEY=302e020100300506032b657004220420...
TEST_FARMER_PUBLIC_KEY=302a300506032b6570032100...

TEST_COOPERATIVE_ACCOUNT_ID=0.0.YYYYYYY
TEST_COOPERATIVE_PRIVATE_KEY=302e020100300506032b657004220420...
TEST_COOPERATIVE_PUBLIC_KEY=302a300506032b6570032100...

TEST_LENDER_ACCOUNT_ID=0.0.ZZZZZZZ
TEST_LENDER_PRIVATE_KEY=302e020100300506032b657004220420...
TEST_LENDER_PUBLIC_KEY=302a300506032b6570032100...
```

## Méthode 2: Via HashPack (Pour tests UI)

### Étape 1: Installer HashPack

https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk

### Étape 2: Créer 3 wallets

1. **Wallet FARMER:**
   - Ouvrez HashPack
   - "Create New Wallet"
   - Sauvegardez la seed phrase
   - Passez en mode Testnet (Settings → Network → Testnet)
   - Notez l'Account ID

2. **Wallet COOPERATIVE:**
   - Dans HashPack, cliquez sur le nom du wallet en haut
   - "Add Account" → "Create New Account"
   - Notez l'Account ID

3. **Wallet LENDER:**
   - Répétez pour créer un 3ème compte

### Étape 3: Financer les comptes

Pour chaque compte:
1. Copiez l'Account ID
2. Allez sur https://portal.hedera.com/faucet
3. Collez l'Account ID
4. Cliquez sur "Receive Testnet HBAR"
5. Vous recevrez 10,000 HBAR

### Étape 4: Exporter les clés privées

Pour chaque compte dans HashPack:
1. Cliquez sur le compte
2. Settings → Security → Export Private Key
3. Entrez votre mot de passe
4. Copiez la clé privée

## Vérification

Vérifiez vos comptes sur HashScan:

```
https://hashscan.io/testnet/account/0.0.XXXXXXX
https://hashscan.io/testnet/account/0.0.YYYYYYY
https://hashscan.io/testnet/account/0.0.ZZZZZZZ
```

## Utilisation

Une fois créés, vous pouvez:

1. **Tester l'UI:** Utilisez HashPack pour vous connecter avec chaque compte
2. **Tests automatisés:** Utilisez les clés privées dans vos tests
3. **Développement:** Simulez différents rôles (farmer, cooperative, lender)

## Sécurité

⚠️ **IMPORTANT:**
- Ces comptes sont pour TESTNET uniquement
- Ne JAMAIS utiliser sur mainnet
- Ne JAMAIS committer les clés privées dans Git
- Gardez `test-wallets.json` local (déjà dans .gitignore)

## Problème avec le compte serveur

Le compte serveur `0.0.6913540` existe mais la clé privée dans `.env.local` ne correspond pas.

Pour corriger:
1. Créez un nouveau compte sur https://portal.hedera.com/
2. Remplacez `HEDERA_ACCOUNT_ID` et `HEDERA_PRIVATE_KEY` dans `.env.local`
3. Ou obtenez la bonne clé privée pour le compte existant

## Support

Si vous avez des questions:
- Documentation Hedera: https://docs.hedera.com/
- HashPack Support: https://www.hashpack.app/support
- Hedera Discord: https://hedera.com/discord
