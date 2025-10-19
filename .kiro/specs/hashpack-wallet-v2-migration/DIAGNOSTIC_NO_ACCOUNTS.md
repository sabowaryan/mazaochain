# Diagnostic: "No Applicable Accounts" dans HashPack

## Symptôme

Lors de la connexion avec HashPack via AppKit, le message "No Applicable accounts" apparaît même si des comptes testnet existent.

## Causes possibles

### 1. Mismatch de réseau (Mainnet vs Testnet)

**Vérification:**
- Application configurée pour: `testnet`
- HashPack configuré pour: `testnet` ou `mainnet`?

**Solution:**
1. Ouvrez HashPack
2. Settings → Network
3. Sélectionnez **Testnet**
4. Redémarrez la connexion

### 2. Namespace incompatible

**Problème:** HashPack filtre les comptes selon le namespace demandé.

**Namespaces:**
- `hedera` = Hedera Native (HBAR, HTS tokens)
- `eip155` = EVM (Smart contracts Solidity)

**Solution temporaire appliquée:**
Le code a été modifié pour se connecter directement en mode `hedera` (Native).

### 3. Comptes non importés correctement

**Vérification:**
1. Ouvrez HashPack
2. Vérifiez que les 3 comptes sont visibles:
   - 0.0.7071655 (FARMER)
   - 0.0.7071656 (COOPERATIVE)
   - 0.0.7071658 (LENDER)

**Si les comptes ne sont pas visibles:**
- Réimportez-les avec les clés privées du fichier `scripts/test-wallets.json`

### 4. Cache WalletConnect

**Solution:**
1. Dans HashPack: Settings → Advanced → Clear Cache
2. Fermez et rouvrez HashPack
3. Réessayez la connexion

### 5. Session WalletConnect expirée

**Solution:**
1. Dans HashPack: Settings → Connections
2. Supprimez toutes les connexions à "MazaoChain MVP"
3. Réessayez la connexion

## Tests de diagnostic

### Test 1: Vérifier le réseau dans la console

Ouvrez la console du navigateur (F12) et cherchez:
```
🌐 [AppKit] Network configuration: { network: 'testnet', isMainnet: false, usingTestnet: true }
```

Si vous voyez `isMainnet: true`, le problème est là.

### Test 2: Vérifier les comptes dans HashPack

1. Ouvrez HashPack
2. Cliquez sur le nom du wallet en haut
3. Vous devriez voir tous vos comptes
4. Vérifiez que le réseau est "Testnet" (en haut à droite)

### Test 3: Tester avec l'extension HashPack directement

Au lieu d'utiliser le QR code:
1. Utilisez l'extension HashPack dans le navigateur
2. Cliquez sur "Connecter HashPack"
3. Approuvez dans l'extension (pas le mobile)

## Solution de contournement actuelle

Le code a été modifié pour:
1. Se connecter directement en mode `hedera` (Native)
2. Sauter le sélecteur de namespace

Cela devrait fonctionner si:
- ✅ HashPack est en mode Testnet
- ✅ Les comptes sont importés
- ✅ Le serveur a été redémarré

## Si rien ne fonctionne

### Option A: Utiliser l'ancien mode HashPack

Désactivez AppKit temporairement:

```env
# Dans .env.local
NEXT_PUBLIC_USE_APPKIT=false
```

Redémarrez le serveur. L'application utilisera l'ancien système HashPack qui fonctionne.

### Option B: Créer un nouveau compte via HashPack

1. Dans HashPack (mode Testnet)
2. Créez un nouveau compte
3. Financez-le via https://portal.hedera.com/faucet
4. Essayez de vous connecter avec ce compte

### Option C: Vérifier les logs HashPack

1. Ouvrez HashPack
2. Settings → Advanced → Developer Mode
3. Regardez les logs pour voir les erreurs

## Prochaines étapes

1. Vérifiez que HashPack est en mode Testnet
2. Essayez de vous connecter
3. Si "No Applicable accounts" persiste:
   - Partagez les logs de la console
   - Partagez une capture d'écran de HashPack montrant les comptes
   - Vérifiez si les comptes ont des fonds (100 HBAR chacun)

## Logs utiles à vérifier

Dans la console du navigateur, cherchez:
- `🌐 [AppKit] Network configuration`
- `📡 [AppKitWalletService] Account update received`
- `✅ [AppKitWalletService] Connection state updated`
- Erreurs WalletConnect
- Erreurs HashPack

## Contact Support

Si le problème persiste:
- HashPack Discord: https://discord.gg/hashpack
- Hedera Discord: https://hedera.com/discord
- WalletConnect Support: https://walletconnect.com/support
