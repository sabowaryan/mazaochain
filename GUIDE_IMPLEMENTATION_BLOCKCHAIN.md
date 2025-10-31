# Guide d'Implémentation de la Logique Blockchain

## Méthode Smart Contract: `createCropToken`

D'après l'ABI du contrat `MazaoTokenFactory`, la méthode `createCropToken` a la signature suivante:

```solidity
function createCropToken(
    address farmer,
    uint256 estimatedValue,
    string memory cropType,
    uint256 harvestDate,
    string memory tokenSymbol
) public returns (uint256 tokenId)
```

### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `farmer` | address | Adresse wallet du fermier | `0x1234567890123456789012345678901234567890` |
| `estimatedValue` | uint256 | Valeur estimée en tokens | `1000` |
| `cropType` | string | Type de culture | `"maize"` |
| `harvestDate` | uint256 | Date de récolte (timestamp Unix) | `1735689600` |
| `tokenSymbol` | string | Symbole du token | `"MAZAO-MAIZE-2025"` |

### Retour

| Valeur | Type | Description |
|--------|------|-------------|
| `tokenId` | uint256 | ID du token créé |

## Code à Implémenter

### Étape 1: Installer les Dépendances Hedera

Si ce n'est pas déjà fait:

```bash
npm install @hashgraph/sdk
```

### Étape 2: Encoder les Paramètres

Dans `/src/app/api/evaluations/approve/route.ts`, remplacer la section simulation (lignes 114-148) par:

```typescript
// 5. Créer le token sur la blockchain
const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
const harvestDateTimestamp = Math.floor(new Date(evaluation.harvest_date).getTime() / 1000);

// Importer les modules nécessaires
const { ContractExecuteTransaction, ContractFunctionParameters } = await import("@hashgraph/sdk");

// Préparer les paramètres de la fonction
const functionParams = new ContractFunctionParameters()
  .addAddress(farmerProfile.wallet_address)  // farmer address
  .addUint256(evaluation.valeur_estimee)     // estimatedValue
  .addString(evaluation.crop_type)           // cropType
  .addUint256(harvestDateTimestamp)          // harvestDate (Unix timestamp)
  .addString(tokenSymbol);                   // tokenSymbol

// Créer la transaction
const transaction = new ContractExecuteTransaction()
  .setContractId(tokenFactoryId)
  .setGas(1000000)  // Ajuster selon les besoins
  .setFunction("createCropToken", functionParams);

// Exécuter la transaction
console.log('Exécution de la transaction createCropToken...');
const txResponse = await transaction.execute(client);

// Attendre la confirmation
console.log('Attente de la confirmation...');
const receipt = await txResponse.getReceipt(client);

// Vérifier le statut
if (receipt.status.toString() !== 'SUCCESS') {
  throw new Error(`Transaction échouée avec le statut: ${receipt.status.toString()}`);
}

// Récupérer le tokenId depuis les logs du contrat
// Note: La méthode exacte dépend de comment votre contrat émet les événements
const record = await txResponse.getRecord(client);
transactionId = txResponse.transactionId.toString();

// Le tokenId devrait être dans les logs du contrat
// Vous devrez peut-être parser les logs pour l'extraire
// Pour l'instant, on peut le récupérer via une query après création
tokenId = `0.0.${receipt.contractId?.num || 'unknown'}`;

console.log('Token créé avec succès:', {
  tokenId,
  transactionId,
  evaluationId,
  cropType: evaluation.crop_type,
  estimatedValue: evaluation.valeur_estimee,
  status: receipt.status.toString()
});
```

### Étape 3: Gestion des Erreurs Blockchain

Ajouter une gestion d'erreurs plus fine:

```typescript
try {
  // ... code de création du token ci-dessus
} catch (blockchainError) {
  console.error('Erreur lors de la création du token sur Hedera:', blockchainError);
  
  // Déterminer le type d'erreur
  let errorMessage = 'Erreur blockchain inconnue';
  
  if (blockchainError instanceof Error) {
    if (blockchainError.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
      errorMessage = 'Solde insuffisant sur le compte Hedera';
    } else if (blockchainError.message.includes('INVALID_CONTRACT_ID')) {
      errorMessage = 'ID de contrat invalide';
    } else if (blockchainError.message.includes('CONTRACT_REVERT_EXECUTED')) {
      errorMessage = 'Le contrat a rejeté la transaction';
    } else {
      errorMessage = blockchainError.message;
    }
  }
  
  // Enregistrer l'erreur dans la base de données
  await supabase
    .from('crop_evaluations')
    .update({
      status: 'failed',
      metadata: {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        errorDetails: blockchainError instanceof Error ? blockchainError.stack : undefined
      }
    })
    .eq('id', evaluationId);

  return NextResponse.json(
    { 
      error: 'Erreur lors de la tokenisation sur la blockchain',
      details: errorMessage
    },
    { status: 500 }
  );
}
```

### Étape 4: Récupérer le TokenId Exact

Si le tokenId n'est pas directement disponible dans le receipt, vous pouvez:

**Option A: Query le contrat après création**

```typescript
import { ContractCallQuery } from "@hashgraph/sdk";

// Après la transaction réussie, query le nextTokenId - 1
const query = new ContractCallQuery()
  .setContractId(tokenFactoryId)
  .setGas(100000)
  .setFunction("nextTokenId");

const result = await query.execute(client);
const nextTokenId = result.getUint256(0);
tokenId = `0.0.${nextTokenId - 1}`;
```

**Option B: Parser les logs du contrat**

```typescript
// Si votre contrat émet un événement TokenCreated
const record = await txResponse.getRecord(client);
const logs = record.contractFunctionResult?.logs || [];

// Parser les logs pour extraire le tokenId
// La structure exacte dépend de votre contrat
for (const log of logs) {
  // Exemple de parsing (à adapter selon votre contrat)
  // const tokenId = log.data.slice(0, 32); // Premier paramètre du log
}
```

## Variables d'Environnement Requises

Assurez-vous que ces variables sont configurées sur Vercel:

```bash
# Compte opérateur Hedera
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Réseau
NEXT_PUBLIC_HEDERA_NETWORK=testnet  # ou mainnet

# Contrat
NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792
```

## Test Local

### 1. Créer un fichier `.env.local`

```bash
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792
```

### 2. Lancer le serveur

```bash
npm run dev
```

### 3. Tester l'API Route

```bash
curl -X POST http://localhost:3000/api/evaluations/approve \
  -H "Content-Type: application/json" \
  -d '{"evaluationId": "votre-evaluation-id"}'
```

## Déploiement sur Vercel

### 1. Configurer les Variables d'Environnement

```bash
# Via CLI Vercel
vercel env add HEDERA_ACCOUNT_ID
vercel env add HEDERA_PRIVATE_KEY
vercel env add NEXT_PUBLIC_HEDERA_NETWORK
vercel env add NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID
```

### 2. Déployer

```bash
vercel --prod
```

### 3. Vérifier les Logs

```bash
vercel logs
```

## Coûts Hedera

### Estimation des Coûts par Transaction

| Opération | Coût Estimé (HBAR) | Coût USD (@ $0.05/HBAR) |
|-----------|-------------------|-------------------------|
| ContractExecuteTransaction | ~0.05 HBAR | ~$0.0025 |
| ContractCallQuery | ~0.001 HBAR | ~$0.00005 |

### Recommandations

1. **Testnet d'abord**: Testez toujours sur testnet avant mainnet
2. **Monitoring**: Surveillez le solde du compte opérateur
3. **Alertes**: Configurez des alertes si le solde < 10 HBAR
4. **Optimisation**: Minimisez les queries inutiles

## Sécurité

### ✅ Checklist de Sécurité

- [ ] Clés privées stockées dans variables d'environnement Vercel
- [ ] Clés privées JAMAIS committées dans Git
- [ ] Validation des paramètres avant envoi à la blockchain
- [ ] Gestion des erreurs complète
- [ ] Logs détaillés pour audit
- [ ] Rate limiting sur l'API Route
- [ ] Vérification des permissions (seules les coopératives peuvent approuver)

## Troubleshooting

### Erreur: "INSUFFICIENT_ACCOUNT_BALANCE"

**Cause**: Le compte opérateur n'a pas assez de HBAR

**Solution**: 
1. Vérifier le solde: https://hashscan.io/testnet/account/YOUR_ACCOUNT_ID
2. Recharger le compte via le faucet (testnet) ou acheter des HBAR (mainnet)

### Erreur: "INVALID_CONTRACT_ID"

**Cause**: L'ID du contrat est incorrect

**Solution**: Vérifier `NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID`

### Erreur: "CONTRACT_REVERT_EXECUTED"

**Cause**: Le contrat a rejeté la transaction (require/revert)

**Solution**: 
1. Vérifier les paramètres envoyés
2. Vérifier les conditions du contrat (permissions, état, etc.)
3. Consulter les logs du contrat sur HashScan

### Erreur: "Timeout"

**Cause**: La transaction prend trop de temps

**Solution**:
1. Augmenter `maxDuration` dans `vercel.json`
2. Optimiser le gas de la transaction
3. Implémenter une approche asynchrone

## Ressources

- [Documentation Hedera SDK](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Hedera Testnet Faucet](https://portal.hedera.com/faucet)
- [HashScan Explorer](https://hashscan.io/)
- [Hedera Status](https://status.hedera.com/)

## Support

Pour toute question technique:
1. Consulter la documentation Hedera
2. Vérifier les exemples dans `/contracts/__tests__/`
3. Tester sur testnet en premier
4. Consulter les logs Vercel pour les erreurs détaillées
