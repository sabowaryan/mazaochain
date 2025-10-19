# Bugfix: Bouton "Connecter HashPack" ne répond pas

## Problème
Le bouton "Connecter HashPack" ne fait rien au clic - pas de changement d'état, pas de modal.

## Diagnostic

### Points à vérifier

1. **Le bouton est-il cliquable ?**
   - Vérifier dans la console si le clic est détecté
   - Ajouter un `console.log` dans `handleConnectClick`

2. **Le modal s'ouvre-t-il ?**
   - Vérifier `useWalletModal` 
   - Vérifier si `showModal` est appelé

3. **Y a-t-il des erreurs dans la console ?**
   - Erreurs JavaScript
   - Erreurs de réseau
   - Erreurs WalletConnect

## Solution proposée

Ajouter des logs de débogage temporaires pour identifier où le flux s'arrête :

```typescript
const handleConnectClick = () => {
  console.log('🔵 Button clicked - opening modal');
  showModal(
    "Choisir le type de connexion",
    <NamespaceSelector
      onSelect={async (selectedNamespace) => {
        console.log('🟢 Namespace selected:', selectedNamespace);
        closeModal();
        await connectWallet(selectedNamespace);
      }}
      onCancel={closeModal}
    />,
    "info",
    undefined,
    undefined,
    true
  );
  console.log('🔵 Modal should be open now');
};
```

## Actions à prendre

1. Ajouter des logs dans `WalletConnection.tsx`
2. Vérifier la console du navigateur
3. Vérifier si `useWalletModal` fonctionne correctement
4. Vérifier si le composant `NamespaceSelector` se rend correctement

## Causes possibles

- Le modal ne s'ouvre pas (problème avec `useWalletModal`)
- Le bouton est désactivé par erreur
- Une erreur silencieuse empêche l'exécution
- Le composant se re-rend et annule l'action
