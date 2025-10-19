# Implémentation du Context pour le Modal Wallet

## Problème résolu

Le modal ne s'affichait pas car l'état était local au composant `WalletConnection`. Chaque re-rendu du composant (causé par les mises à jour de `useWallet`) réinitialisait le hook `useWalletModal`, perdant ainsi l'état `isOpen: true`.

## Solution : Context React Global

### Architecture

```
App Layout
  └── WalletModalGlobalProvider
        ├── WalletModalContext (état global)
        ├── Children (toute l'app)
        └── WalletModalRenderer (modal global)
```

### Fichiers créés

1. **`src/contexts/WalletModalContext.tsx`**
   - Context React pour gérer l'état du modal globalement
   - Fournit `showModal`, `showError`, `showSuccess`, `showInfo`, `closeModal`
   - L'état persiste entre les re-rendus des composants enfants

2. **`src/components/wallet/WalletModalGlobalProvider.tsx`**
   - Provider qui wrap l'application
   - Rend le `WalletModal` une seule fois au niveau global
   - Le modal est toujours monté et écoute les changements d'état

### Fichiers modifiés

1. **`src/hooks/useWalletModal.ts`**
   - Simplifié pour utiliser le Context au lieu d'un état local
   - Maintient la même API pour la compatibilité

2. **`src/app/[lang]/layout.tsx`**
   - Ajout du `WalletModalGlobalProvider` autour de l'app

3. **`src/components/wallet/WalletConnection.tsx`**
   - Retiré le `<WalletModal>` local (maintenant global)
   - Utilise toujours `useWalletModal()` avec la même API

## Avantages

✅ **État persistant** : L'état du modal ne se perd plus lors des re-rendus  
✅ **Performance** : Un seul modal pour toute l'app au lieu d'un par composant  
✅ **Simplicité** : API inchangée, migration transparente  
✅ **Réutilisable** : N'importe quel composant peut ouvrir le modal  

## Utilisation

```typescript
// Dans n'importe quel composant
const { showModal, showError, showInfo, closeModal } = useWalletModal();

// Ouvrir un modal
showModal("Titre", <MonComposant />, "info");

// Afficher une erreur
showError("Message d'erreur", "Détails optionnels");

// Afficher un succès
showSuccess("Opération réussie!");
```

## Test

Le modal devrait maintenant s'afficher correctement quand on clique sur "Connecter HashPack" ! 🎉
