# Implementation Plan

- [x] 1. Préparer l'environnement et vérifier les dépendances





  - Vérifier que `@hashgraph/hedera-wallet-connect` est installé et à jour
  - Vérifier que `@walletconnect/modal` est installé
  - Créer une sauvegarde du code actuel
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Mettre à jour le service HederaWalletService (hedera-wallet.ts)






  - [x] 2.1 Remplacer les imports AppKit par DAppConnector

    - Supprimer les imports HederaProvider, HederaAdapter, HederaChainDefinition, hederaNamespace
    - Ajouter les imports DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId, DAppSigner
    - Ajouter l'import LedgerId depuis @hashgraph/sdk
    - Ajouter l'import WalletConnectModal depuis @walletconnect/modal
    - _Requirements: 1.1, 8.1_



  - [x] 2.2 Mettre à jour les propriétés de classe







    - Remplacer `hederaProvider: HederaProvider | null` par `dAppConnector: DAppConnector | null`
    - Supprimer `nativeAdapter` et `evmAdapter`
    - Ajouter `signers: DAppSigner[]`
    - Remplacer `modal: any` par `walletConnectModal: WalletConnectModal | null`


    - _Requirements: 1.1, 8.2_

  - [x] 2.3 Réécrire la méthode initialize()





    - Créer l'objet metadata avec les informations de l'application
    - Déterminer le LedgerId (MAINNET ou TESTNET) depuis la configuration
    - Instancier DAppConnector avec metadata, ledgerId, projectId, methods, events, chains
    - Appeler `dAppConnector.init({ logger: 'error' })`


    - Créer WalletConnectModal avec projectId et chains
    - Supprimer la logique createAdapters()
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3_

  - [x] 2.4 Réécrire la méthode connectWallet()





    - Supprimer la logique de sélection d'adapter
    - Appeler `dAppConnector.openModal()` pour ouvrir la modal WalletConnect
    - Attendre la résolution de la promesse de session


    - Extraire les signers de la session avec createSignersFromSession()
    - Mettre à jour connectionState avec les informations du premier signer
    - Sauvegarder la session dans localStorage
    - Gérer les erreurs (timeout, rejection, etc.)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.3_



  - [ ] 2.5 Créer la méthode createSignersFromSession()
    - Extraire les comptes depuis session.namespaces
    - Parser chaque compte au format "hedera:network:accountId"
    - Créer un DAppSigner pour chaque compte via `dAppConnector.getSigner()`
    - Retourner le tableau de signers


    - _Requirements: 2.5, 5.1_

  - [ ] 2.6 Mettre à jour la méthode signTransaction()
    - Supprimer l'appel à `hederaProvider.hedera_signTransaction`
    - Obtenir le premier signer depuis `this.signers`
    - Appeler `signer.signTransaction(transaction)`


    - Retourner la transaction signée
    - Gérer les erreurs de signature
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_

  - [ ] 2.7 Mettre à jour la méthode signMessage()
    - Remplacer `hederaProvider.hedera_signMessage` par `dAppConnector.signMessage`


    - Formater signerAccountId au format HIP-30 (hedera:network:accountId)
    - Passer les paramètres { signerAccountId, message }
    - Retourner le résultat de signature
    - Gérer les erreurs de signature

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


  - [ ] 2.8 Mettre à jour la méthode disconnectWallet()
    - Parcourir tous les signers dans `this.signers`
    - Appeler `dAppConnector.disconnect(signer.topic)` pour chaque signer
    - Vider le tableau `this.signers`
    - Nettoyer `connectionState`
    - Appeler `clearSavedSession()`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 8.5_

  - [ ] 2.9 Simplifier la méthode setupSessionListeners()
    - Supprimer tous les listeners manuels (session_update, session_delete, etc.)
    - Ajouter un commentaire expliquant que DAppConnector gère les événements automatiquement
    - Conserver la méthode vide ou la supprimer si non utilisée ailleurs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 2.10 Supprimer les méthodes obsolètes
    - Supprimer la méthode `createAdapters()`
    - Supprimer les méthodes de gestion d'événements manuels si elles ne sont plus nécessaires
    - Nettoyer les imports inutilisés
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Mettre à jour wallet-service-factory.ts





  - Supprimer la fonction `isAppKitEnabled()` ou sa logique
  - Simplifier `getWalletService()` pour retourner directement `hederaWalletService`
  - Supprimer les imports liés à AppKit
  - _Requirements: 7.1, 7.2, 7.3, 8.1_

- [x] 4. Supprimer les fichiers AppKit





  - Supprimer `src/lib/wallet/appkit-config.ts`
  - Supprimer `src/components/wallet/AppKitButton.tsx`
  - Vérifier qu'aucun autre fichier n'importe ces fichiers supprimés
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Mettre à jour les composants utilisant AppKit






  - [x] 5.1 Vérifier WalletConnectionWrapper.tsx

    - S'assurer qu'il n'importe pas AppKitButton
    - Vérifier qu'il utilise correctement le service wallet
    - Mettre à jour si nécessaire
    - _Requirements: 9.1, 9.2, 9.3, 9.4_


  - [x] 5.2 Vérifier Navigation.tsx et autres composants

    - Rechercher les imports de AppKitButton
    - Remplacer par des boutons personnalisés si nécessaire
    - Vérifier que les composants utilisent useWallet correctement
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Mettre à jour le hook useWallet





  - Vérifier que le hook fonctionne avec la nouvelle implémentation
  - S'assurer que le polling de l'état fonctionne correctement
  - Vérifier la gestion des événements
  - Tester la mise à jour de l'état de connexion
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7. Supprimer les dépendances Reown du package.json






  - Exécuter `npm uninstall @reown/appkit`
  - Supprimer toutes les dépendances `@reown/*` si présentes
  - Exécuter `npm install` pour nettoyer package-lock.json
  - Vérifier qu'aucune erreur de dépendance n'apparaît
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Mettre à jour les tests wallet
  - [ ] 8.1 Mettre à jour appkit-integration.test.ts
    - Renommer en `dappconnector-integration.test.ts`
    - Remplacer les mocks AppKit par des mocks DAppConnector
    - Tester l'initialisation de DAppConnector
    - Tester la création de signers depuis une session
    - Tester la connexion et déconnexion
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 8.2 Mettre à jour appkit-modal-opening.test.tsx
    - Renommer en `wallet-modal-opening.test.tsx`
    - Remplacer les tests AppKit par des tests DAppConnector.openModal()
    - Tester la gestion des événements de session
    - Vérifier la création de signers
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [ ]* 8.3 Exécuter la suite de tests complète
    - Exécuter `npm test` pour vérifier tous les tests
    - Corriger les tests qui échouent
    - Vérifier la couverture de code
    - _Requirements: 11.5_

- [ ] 9. Tests manuels et validation
  - [ ] 9.1 Tester la connexion wallet
    - Démarrer l'application en mode développement
    - Cliquer sur le bouton de connexion wallet
    - Vérifier que la modal WalletConnect s'ouvre
    - Se connecter avec HashPack
    - Vérifier que l'état de connexion est mis à jour
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 9.2 Tester la signature de transaction
    - Créer une transaction de test
    - Signer la transaction avec le wallet connecté
    - Vérifier que HashPack affiche la demande de signature
    - Approuver la signature
    - Vérifier que la transaction signée est retournée
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 9.3 Tester la déconnexion
    - Cliquer sur le bouton de déconnexion
    - Vérifier que l'état de connexion est nettoyé
    - Vérifier que localStorage est nettoyé
    - Vérifier que l'UI est mise à jour
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 9.4 Tester la restauration de session
    - Se connecter au wallet
    - Rafraîchir la page
    - Vérifier que la session est restaurée automatiquement
    - Vérifier que l'état de connexion est correct
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 9.5 Tester la gestion des erreurs
    - Tester le rejet de connexion dans HashPack
    - Tester le timeout de connexion
    - Tester le rejet de signature
    - Vérifier que les messages d'erreur sont affichés correctement
    - _Requirements: 5.4, 6.4_

- [ ] 10. Documentation et nettoyage final
  - [ ] 10.1 Mettre à jour le README
    - Documenter la nouvelle approche avec DAppConnector
    - Supprimer les références à AppKit
    - Ajouter des exemples d'utilisation
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.2 Mettre à jour les commentaires de code
    - Vérifier que les commentaires reflètent la nouvelle implémentation
    - Supprimer les commentaires obsolètes sur AppKit
    - Ajouter des commentaires sur DAppConnector si nécessaire
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.3 Vérifier les diagnostics TypeScript
    - Exécuter `npm run type-check` ou équivalent
    - Corriger les erreurs de type
    - Vérifier qu'il n'y a pas d'imports inutilisés
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 10.4 Créer un document de migration
    - Documenter les changements effectués
    - Lister les fichiers modifiés et supprimés
    - Documenter les breaking changes potentiels
    - Ajouter des notes pour les développeurs
    - _Requirements: 7.1, 7.2, 7.3_
