# Configuration Next.js pour Hedera SDK

## Problème Actuel

Erreur: `Cannot read properties of undefined (reading 'MAX_STRING_LENGTH')`

Cette erreur se produit car le SDK Hedera utilise des modules Node.js qui ne sont pas disponibles dans l'environnement serverless de Vercel.

## Template Officiel Hedera

Le template officiel `hedera-dev/template-hedera-agent-kit-nextjs` a une configuration **très simple**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Observation importante:** Ils n'ont PAS de configuration webpack complexe pour Buffer.constants !

## Solutions Possibles

### Option 1: Utiliser l'approche du template officiel (RECOMMANDÉ)

Le template officiel Hedera ne configure PAS Buffer.constants dans webpack. Cela suggère que:
1. Soit ils n'utilisent pas le SDK côté serveur dans les API Routes
2. Soit ils utilisent une version différente du SDK
3. Soit Vercel gère automatiquement ces polyfills

### Option 2: Externaliser complètement @hashgraph/sdk

```typescript
// next.config.ts
webpack: (config, { isServer }) => {
  if (isServer) {
    // Externaliser le SDK Hedera côté serveur
    config.externals.push('@hashgraph/sdk');
  }
  return config;
}
```

### Option 3: Utiliser une API externe au lieu de l'API Route

Au lieu d'utiliser une API Route Next.js, déployer une fonction serverless séparée (AWS Lambda, Google Cloud Functions) qui gère les transactions Hedera.

### Option 4: Simplifier la configuration webpack

Supprimer toutes les configurations Buffer.constants et laisser Next.js/Vercel gérer automatiquement.

## Recommandation

**Essayer l'Option 2 en premier** - Externaliser @hashgraph/sdk côté serveur pour que Vercel utilise la version Node.js native au lieu d'essayer de la bundler.
