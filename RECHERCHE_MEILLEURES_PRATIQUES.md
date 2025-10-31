# Recherche: Meilleures Pratiques pour Transactions Blockchain avec Next.js et Vercel

## Sources Consultées

1. **GitHub Discussion**: Keep connection alive on Vercel for long running API routes
   - URL: https://github.com/vercel/next.js/discussions/34658
   - Problème similaire: Transactions blockchain nécessitant 20-30+ secondes

2. **Documentation Next.js**: API Routes
   - URL: https://nextjs.org/docs/pages/building-your-application/routing/api-routes
   - Guide officiel sur les API Routes

3. **Template Hedera**: template-hedera-agent-kit-nextjs
   - URL: https://github.com/hedera-dev/template-hedera-agent-kit-nextjs
   - Exemple d'implémentation Hedera avec Next.js

## Meilleures Pratiques Identifiées

### 1. Utiliser les API Routes pour les Transactions Blockchain

**Principe**: Les transactions blockchain doivent être exécutées côté serveur via des API Routes Next.js, pas côté client.

**Raison**:
- **Sécurité**: Les clés privées restent côté serveur (variables d'environnement)
- **Fiabilité**: Pas de dépendance au navigateur du client
- **Performance**: Connexions optimisées au réseau blockchain
- **Compatibilité**: Fonctionne parfaitement avec Vercel

### 2. Configuration de `maxDuration` pour Vercel

**Problème**: Vercel timeout par défaut = 10 secondes (plan gratuit) ou 5 secondes (API Routes)

**Solution**: Configurer `maxDuration` dans l'API Route

```typescript
// src/app/api/evaluations/approve/route.ts
export const config = {
  maxDuration: 60, // 60 secondes max (nécessite un plan payant pour > 10s)
};
```

**Alternative pour plan gratuit**:
- Utiliser une approche asynchrone avec webhook
- Retourner immédiatement et notifier le client via WebSocket/SSE

### 3. Architecture Recommandée

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │ ──────> │  API Route   │ ──────> │   Hedera    │
│  (React)    │ <────── │  (Next.js)   │ <────── │  Blockchain │
└─────────────┘         └──────────────┘         └─────────────┘
     │                         │
     │                         │
     └────── WebSocket ────────┘
         (pour updates en temps réel)
```

### 4. Initialisation du Client Hedera Côté Serveur

**Variables d'environnement requises** (d'après template Hedera):
```bash
HEDERA_ACCOUNT_ID=""
HEDERA_PRIVATE_KEY=""
HEDERA_NETWORK=""
```

**Initialisation sécurisée**:
```typescript
import { Client, PrivateKey } from "@hashgraph/sdk";

// Côté serveur uniquement
const client = Client.forTestnet();
client.setOperator(
  process.env.HEDERA_ACCOUNT_ID!,
  PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
);
```

### 5. Gestion des Erreurs et Timeouts

**Pattern recommandé**:
```typescript
export default async function handler(req, res) {
  try {
    const result = await someBlockchainOperation();
    res.status(200).json({ result });
  } catch (err) {
    console.error('Blockchain error:', err);
    res.status(500).json({ 
      error: 'Transaction failed',
      message: err.message 
    });
  }
}
```

### 6. Approche Asynchrone (Recommandée pour Production)

**Workflow**:
1. Client soumet la demande d'approbation
2. API Route crée une tâche en background
3. Retourne immédiatement un `taskId` au client
4. Transaction blockchain s'exécute en arrière-plan
5. Client poll l'API ou reçoit une notification via WebSocket

**Avantages**:
- Pas de timeout Vercel
- Meilleure expérience utilisateur
- Gestion des erreurs plus robuste

## Recommandations Spécifiques pour MazaoChain

### Solution Immédiate (Court Terme)

1. **Créer une API Route**: `/src/app/api/evaluations/approve/route.ts`
2. **Déplacer la logique blockchain** du client vers l'API Route
3. **Configurer `maxDuration`** à 60 secondes
4. **Stocker les clés privées** dans les variables d'environnement Vercel

### Solution Optimale (Long Terme)

1. **Architecture asynchrone** avec queue de tâches
2. **WebSocket ou SSE** pour les notifications en temps réel
3. **Base de données** pour tracker l'état des transactions
4. **Retry logic** pour les transactions échouées

## Fichiers de Configuration Vercel

### vercel.json (optionnel)
```json
{
  "functions": {
    "api/evaluations/approve.ts": {
      "maxDuration": 60
    }
  }
}
```

### Variables d'Environnement Vercel
```
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet
NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792
NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID=0.0.6913794
```

## Conclusion

L'erreur "Not implemented in build environment" est due à:
1. Une implémentation stub (non fonctionnelle) côté client
2. Une architecture incorrecte (logique blockchain côté client)

La solution consiste à:
1. Créer une API Route Next.js pour gérer les approbations
2. Déplacer toute la logique blockchain côté serveur
3. Configurer correctement les timeouts Vercel
4. Sécuriser les clés privées dans les variables d'environnement
