# Guide des Fonctionnalités Offline - MazaoChain

## Vue d'ensemble

MazaoChain implémente des fonctionnalités offline complètes pour permettre aux utilisateurs de continuer à utiliser l'application même sans connexion internet. Les données créées hors ligne sont automatiquement synchronisées lorsque la connexion est rétablie.

## Composants Principaux

### 1. OfflineIndicator

**Emplacement:** `src/components/pwa/OfflineIndicator.tsx`

**Fonctionnalités:**
- Détecte automatiquement le statut de connexion (online/offline)
- Vérifie la connectivité réelle en faisant une requête réseau
- Affiche un indicateur visuel lorsque l'utilisateur est hors ligne
- Affiche une notification lorsque la connexion est rétablie
- Déclenche automatiquement la synchronisation des données au retour en ligne

**Utilisation:**
Le composant est déjà intégré dans le layout principal (`src/app/[lang]/layout.tsx`) et fonctionne automatiquement.

### 2. OfflineSyncStatus

**Emplacement:** `src/components/pwa/OfflineSyncStatus.tsx`

**Fonctionnalités:**
- Affiche le nombre d'éléments en attente de synchronisation
- Permet de déclencher manuellement la synchronisation
- Affiche l'état de synchronisation en cours
- Informe l'utilisateur que les données seront synchronisées automatiquement

**Utilisation:**
```tsx
import { OfflineSyncStatus } from '@/components/pwa/OfflineSyncStatus';

export default function DashboardPage() {
  return (
    <div>
      <OfflineSyncStatus />
      {/* Reste du contenu */}
    </div>
  );
}
```

### 3. Service Worker

**Emplacement:** `public/sw.js`

**Fonctionnalités:**
- Met en cache les ressources statiques (images, manifest, etc.)
- Met en cache les pages essentielles pour un accès hors ligne
- Met en cache les réponses API pour consultation hors ligne
- Gère la synchronisation en arrière-plan (Background Sync API)
- Synchronise automatiquement les données lorsque la connexion est rétablie

**Pages mises en cache:**
- Dashboards (farmer, cooperative, lender) en français et lingala
- Ressources statiques (logo, icônes, manifest)
- Réponses API récentes

### 4. Offline Storage (IndexedDB)

**Emplacement:** `src/lib/utils/offline-storage.ts`

**Fonctionnalités:**
- Stocke les données créées hors ligne dans IndexedDB
- Gère trois types de données:
  - `evaluation`: Évaluations de cultures
  - `loan_request`: Demandes de prêt
  - `profile_update`: Mises à jour de profil
- Marque les données comme synchronisées après envoi réussi
- Nettoie automatiquement les données synchronisées

**Utilisation:**
```tsx
import { useOfflineStorage } from '@/lib/utils/offline-storage';

function MyComponent() {
  const { saveForLater, syncPendingData, getPendingCount } = useOfflineStorage();

  const handleSubmit = async (data) => {
    try {
      // Essayer d'envoyer normalement
      await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      // Si hors ligne, sauvegarder pour plus tard
      if (!navigator.onLine) {
        await saveForLater('evaluation', data);
        toast.info('Données sauvegardées. Elles seront synchronisées au retour en ligne.');
      }
    }
  };

  return (/* ... */);
}
```

### 5. useOfflineSync Hook

**Emplacement:** `src/hooks/useOfflineSync.ts`

**Fonctionnalités:**
- Fournit l'état de connexion en temps réel
- Gère la synchronisation automatique et manuelle
- Compte les éléments en attente de synchronisation
- Écoute les messages du service worker

**Utilisation:**
```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';

function MyComponent() {
  const { isOnline, isSyncing, pendingCount, handleSync } = useOfflineSync();

  return (
    <div>
      <p>Statut: {isOnline ? 'En ligne' : 'Hors ligne'}</p>
      {pendingCount > 0 && (
        <button onClick={handleSync} disabled={isSyncing}>
          Synchroniser {pendingCount} élément(s)
        </button>
      )}
    </div>
  );
}
```

## Workflow de Synchronisation

### 1. Création de Données Hors Ligne

```
Utilisateur crée des données
         ↓
Application détecte qu'elle est hors ligne
         ↓
Données sauvegardées dans IndexedDB
         ↓
Background Sync enregistré (si supporté)
         ↓
Notification à l'utilisateur
```

### 2. Retour en Ligne

```
Connexion rétablie
         ↓
OfflineIndicator détecte le changement
         ↓
Vérification de la connectivité réelle
         ↓
Déclenchement automatique de la synchronisation (après 2 secondes)
         ↓
Service Worker ou Hook synchronise les données
         ↓
Données envoyées aux API endpoints
         ↓
Marquage comme synchronisées dans IndexedDB
         ↓
Nettoyage des données synchronisées
         ↓
Notification de succès à l'utilisateur
```

## Configuration

### Variables d'Environnement

Aucune variable d'environnement spécifique n'est requise pour les fonctionnalités offline.

### Cache Strategy

Le service worker utilise une stratégie de cache "Network First, Cache Fallback":
- Essaie d'abord de récupérer depuis le réseau
- Si le réseau échoue, utilise le cache
- Met à jour le cache avec les nouvelles réponses

### Durée de Vie du Cache

- **Nom du cache:** `mazaochain-v2`
- **Nettoyage:** Les anciens caches sont automatiquement supprimés lors de l'activation d'un nouveau service worker
- **Mise à jour:** Le cache est mis à jour à chaque nouvelle version du service worker

## Tests

### Tests Unitaires

Les tests sont disponibles dans `src/__tests__/pwa/offline-functionality.test.ts`

**Exécuter les tests:**
```bash
npm run test -- src/__tests__/pwa/offline-functionality.test.ts --run
```

### Tests Manuels

1. **Tester la détection offline:**
   - Ouvrir l'application
   - Ouvrir les DevTools (F12)
   - Aller dans l'onglet Network
   - Sélectionner "Offline" dans le dropdown
   - Vérifier que l'indicateur offline s'affiche

2. **Tester la sauvegarde offline:**
   - Passer en mode offline
   - Créer une évaluation de culture
   - Vérifier que les données sont sauvegardées localement
   - Ouvrir IndexedDB dans DevTools > Application > Storage
   - Vérifier la présence des données dans `mazaochain-offline`

3. **Tester la synchronisation:**
   - Avec des données en attente, repasser en ligne
   - Vérifier que la synchronisation se déclenche automatiquement
   - Vérifier que les données apparaissent sur le serveur
   - Vérifier que le compteur de données en attente revient à 0

## Limitations

1. **Background Sync API:**
   - Non supporté sur tous les navigateurs (principalement Chrome/Edge)
   - Fallback: synchronisation immédiate au retour en ligne

2. **Taille du Cache:**
   - IndexedDB a des limites de stockage selon le navigateur
   - Recommandation: nettoyer régulièrement les données synchronisées

3. **Types de Données:**
   - Seules certaines opérations sont supportées hors ligne
   - Les opérations blockchain nécessitent une connexion

## Dépannage

### Le service worker ne s'enregistre pas

**Solution:**
- Vérifier que l'application est servie en HTTPS (ou localhost)
- Vérifier la console pour les erreurs
- Vérifier que `public/sw.js` existe et est accessible

### Les données ne se synchronisent pas

**Solution:**
- Vérifier la console pour les erreurs de synchronisation
- Vérifier que les endpoints API sont corrects
- Vérifier que l'authentification est valide
- Déclencher manuellement la synchronisation avec le bouton

### L'indicateur offline ne s'affiche pas

**Solution:**
- Vérifier que le composant est bien dans le layout
- Vérifier les traductions dans `messages/fr.json` et `messages/ln.json`
- Vérifier la console pour les erreurs

## Améliorations Futures

1. **Synchronisation Sélective:**
   - Permettre à l'utilisateur de choisir quelles données synchroniser

2. **Gestion des Conflits:**
   - Détecter et résoudre les conflits de données

3. **Compression des Données:**
   - Compresser les données avant stockage pour économiser l'espace

4. **Synchronisation Incrémentale:**
   - Ne synchroniser que les changements depuis la dernière sync

5. **Indicateur de Progression:**
   - Afficher la progression détaillée de la synchronisation

## Support

Pour toute question ou problème concernant les fonctionnalités offline, consulter:
- La documentation du service worker: `public/sw.js`
- Les tests: `src/__tests__/pwa/offline-functionality.test.ts`
- Le design document: `.kiro/specs/mazaochain-integration-audit/design.md`
