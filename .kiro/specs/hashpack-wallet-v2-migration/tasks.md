# Implementation Plan - Migration HashPack Wallet vers v2

- [x] 1. Préparation et mise à jour des dépendances





  - Créer une branche de backup du code actuel
  - Mettre à jour package.json avec les nouvelles dépendances v2
  - Supprimer les dépendances obsolètes de WalletConnect v1
  - Installer et vérifier les nouvelles dépendances
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Créer les nouvelles interfaces et types TypeScript





  - Créer l'interface `WalletSession` pour la gestion des sessions v2
  - Mettre à jour l'interface `WalletConnection` avec les champs namespace et chainId
  - Créer l'interface `TransactionRequest` pour les requêtes de transaction
  - Créer l'enum `WalletErrorCode` pour les codes d'erreur standardisés
  - Créer les types pour les événements de session (SessionEvent, SessionUpdate, SessionDelete)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Refactoriser le service HederaWalletService pour la v2





- [x] 3.1 Implémenter l'initialisation du HederaProvider


  - Remplacer l'initialisation de DAppConnector par HederaProvider.init()
  - Configurer les métadonnées de l'application (name, description, url, icons)
  - Gérer les erreurs d'initialisation avec des messages clairs
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Créer et configurer les HederaAdapter (Native et EVM)


  - Créer le HederaAdapter pour le namespace Hedera native avec les réseaux Mainnet/Testnet
  - Créer le HederaAdapter pour le namespace EVM avec les chainIds 295/296
  - Configurer les méthodes et événements supportés pour chaque adapter
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.3 Implémenter la gestion des sessions v2


  - Créer la méthode setupSessionListeners() pour écouter les événements de session
  - Implémenter handleSessionEvent() pour gérer les événements génériques
  - Implémenter handleSessionUpdate() pour les mises à jour de session
  - Implémenter handleSessionDelete() pour les suppressions de session
  - Créer restoreExistingSession() pour restaurer les sessions au démarrage
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.4 Mettre à jour la méthode connectWallet()


  - Adapter la logique de connexion pour utiliser HederaProvider
  - Ajouter le support du paramètre namespace optionnel
  - Améliorer la détection de connexion réussie avec les nouvelles sessions
  - Gérer les timeouts et erreurs de connexion avec les nouveaux codes d'erreur
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3.5 Implémenter la signature de transactions natives Hedera


  - Créer la méthode signTransaction() utilisant hedera_signTransaction
  - Implémenter la sérialisation de Transaction en bytes
  - Gérer la désérialisation de la transaction signée retournée
  - Supprimer la configuration manuelle des node IDs
  - Ajouter la gestion des erreurs de signature
  - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.6 Implémenter la signature de messages


  - Créer la méthode signMessage() utilisant hedera_signMessage
  - Formater le message selon les spécifications Hedera
  - Gérer la réponse avec la signature
  - Ajouter la validation de la signature
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 3.7 Mettre à jour la méthode disconnectWallet()




  - Adapter la déconnexion pour utiliser les méthodes v2
  - Nettoyer correctement toutes les sessions actives
  - Réinitialiser l'état de connexion
  - _Requirements: 5.4_

- [x] 4. Améliorer le gestionnaire d'erreurs wallet-error-handler.ts




  - Ajouter les nouveaux codes d'erreur WalletErrorCode
  - Créer des messages d'erreur spécifiques pour chaque code
  - Améliorer la fonction handleWalletError() pour les erreurs v2
  - Ajouter la gestion des erreurs de session expirée
  - Mettre à jour suppressWalletConnectErrors() pour les nouvelles erreurs v2
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Mettre à jour le hook useWallet





  - Adapter les appels au service pour utiliser les nouvelles méthodes
  - Ajouter la gestion du namespace dans l'état
  - Implémenter la restauration automatique de session au chargement
  - Améliorer la gestion des erreurs avec les nouveaux codes
  - Ajouter la gestion des événements de changement de compte/réseau
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 6. Mettre à jour le composant WalletConnection





  - Ajouter l'affichage du namespace actif (Native/EVM)
  - Améliorer les messages d'erreur avec les nouveaux codes
  - Ajouter un indicateur de restauration de session
  - Mettre à jour l'UI pour refléter les nouveaux états de connexion
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 7. Mettre à jour les variables d'environnement





  - Documenter NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID comme requis
  - Ajouter NEXT_PUBLIC_USE_APPKIT pour le mode optionnel AppKit
  - Mettre à jour le fichier .env.example
  - Mettre à jour env.ts pour valider le projectId
  - _Requirements: 1.1, 9.5_

- [x] 8. Créer les tests unitaires pour HederaWalletService v2


















  - Tester l'initialisation du HederaProvider et des adapters
  - Tester la création et restauration de sessions
  - Tester la gestion des événements de session
  - Tester la signature de transactions
  - Tester la signature de messages
  - Tester la récupération des balances
  - Tester la gestion des erreurs
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Créer les tests unitaires pour useWallet hook






  - Tester les états de connexion
  - Tester les actions de connexion/déconnexion
  - Tester la mise à jour des balances
  - Tester la gestion des erreurs
  - Tester la synchronisation avec le profil utilisateur
  - Tester la restauration de session
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Créer les tests d'intégration






  - Tester le flux complet de connexion
  - Tester la restauration de session après rechargement
  - Tester la gestion de l'expiration de session
  - Tester le flux de signature de transaction
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11. Créer la documentation de migration







  - Créer un document MIGRATION_V2.md listant tous les changements
  - Documenter les breaking changes et comment les gérer
  - Ajouter des exemples de code pour les cas d'usage courants
  - Documenter les différences entre v1 et v2
  - Créer un guide de dépannage pour les problèmes courants
  - Mettre à jour le README.md avec les nouvelles instructions
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Validation et tests manuels





  - Tester la connexion avec HashPack extension Chrome
  - Tester la connexion avec HashPack mobile via WalletConnect
  - Valider le scénario de première connexion
  - Valider la reconnexion avec session existante
  - Tester le changement de compte dans HashPack
  - Tester le changement de réseau (testnet/mainnet)
  - Tester la déconnexion depuis HashPack
  - Tester la déconnexion depuis l'application
  - Valider la récupération des balances HBAR et tokens
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 13. Implémentation optionnelle de Reown AppKit









  - Installer les dépendances AppKit si NEXT_PUBLIC_USE_APPKIT=true
  - Créer la configuration AppKit avec les HederaAdapter
  - Créer un composant wrapper pour AppKit
  - Ajouter la logique de basculement entre la personnalisation et AppKit
  - Tester l'interface AppKit
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
