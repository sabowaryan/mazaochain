# Requirements Document - Migration HashPack Wallet vers v2

## Introduction

Ce document définit les exigences pour la migration de l'intégration actuelle du wallet HashPack de la version 1.5.1 vers la version 2.x de `@hashgraph/hedera-wallet-connect`. La migration vise à résoudre les problèmes de connexion actuels et à aligner l'implémentation avec les recommandations officielles de Hedera et HashPack, incluant le support des deux namespaces (Hedera native et EVM) et l'utilisation des nouveaux adaptateurs.

## Requirements

### Requirement 1 : Mise à jour des dépendances vers v2

**User Story:** En tant que développeur, je veux mettre à jour les dépendances du wallet vers la version 2.x, afin de bénéficier des dernières fonctionnalités et corrections de bugs.

#### Acceptance Criteria

1. WHEN le package.json est mis à jour THEN `@hashgraph/hedera-wallet-connect` SHALL être à la version `^2.0.4-canary.3ca04e9.0` ou supérieure
2. WHEN les dépendances sont installées THEN `@walletconnect/universal-provider` SHALL être ajouté comme nouvelle dépendance
3. WHEN les dépendances sont mises à jour THEN toutes les dépendances WalletConnect SHALL être compatibles avec la v2
4. WHEN la migration est terminée THEN les anciennes dépendances WalletConnect v1 (comme `@walletconnect/qrcode-modal`) SHALL être supprimées

### Requirement 2 : Implémentation du HederaProvider et HederaAdapter

**User Story:** En tant que développeur, je veux utiliser les nouveaux `HederaProvider` et `HederaAdapter`, afin de suivre l'architecture recommandée par la documentation officielle.

#### Acceptance Criteria

1. WHEN le service wallet est initialisé THEN `HederaProvider` SHALL être créé avec les métadonnées de l'application et le projectId
2. WHEN le HederaProvider est créé THEN il SHALL être configuré pour supporter les namespaces `hedera` (native) et `eip155` (EVM)
3. WHEN les adaptateurs sont créés THEN un `HederaAdapter` SHALL être créé pour le namespace Hedera native
4. WHEN les adaptateurs sont créés THEN un `HederaAdapter` SHALL être créé pour le namespace EVM
5. WHEN les adaptateurs sont configurés THEN ils SHALL inclure les réseaux Mainnet et Testnet pour chaque namespace
6. WHEN le provider est initialisé THEN il SHALL utiliser les définitions de chaînes `HederaChainDefinition.Native` et `HederaChainDefinition.EVM`

### Requirement 3 : Support des deux namespaces (Native et EVM)

**User Story:** En tant qu'utilisateur de l'application, je veux pouvoir utiliser à la fois les transactions Hedera natives et les transactions EVM, afin d'avoir une flexibilité maximale dans mes interactions blockchain.

#### Acceptance Criteria

1. WHEN l'utilisateur se connecte THEN le wallet SHALL supporter les transactions via le namespace `hedera:mainnet` ou `hedera:testnet`
2. WHEN l'utilisateur se connecte THEN le wallet SHALL supporter les transactions via le namespace `eip155:295` (Mainnet) ou `eip155:296` (Testnet)
3. WHEN une transaction native Hedera est créée THEN elle SHALL utiliser le namespace `hedera`
4. WHEN une transaction EVM est créée THEN elle SHALL utiliser le namespace `eip155`
5. WHEN l'utilisateur change de réseau THEN les deux namespaces SHALL être mis à jour en conséquence

### Requirement 4 : Suppression de la configuration des node IDs dans les transactions

**User Story:** En tant que développeur, je veux que les transactions n'aient plus besoin de node IDs configurés manuellement, afin de simplifier le code et suivre les changements de la v2.

#### Acceptance Criteria

1. WHEN une transaction est créée THEN elle SHALL NOT avoir de node IDs configurés manuellement dans le code de l'application
2. WHEN une transaction est envoyée au wallet THEN le wallet SHALL gérer automatiquement la configuration des node IDs
3. WHEN le code de transaction est refactorisé THEN toutes les références à la configuration manuelle de node IDs SHALL être supprimées

### Requirement 5 : Amélioration de la gestion des sessions et événements

**User Story:** En tant qu'utilisateur, je veux que ma connexion au wallet soit stable et que les événements de session soient correctement gérés, afin d'éviter les déconnexions inattendues.

#### Acceptance Criteria

1. WHEN une session est créée THEN les événements `session_event`, `session_update`, et `session_delete` SHALL être écoutés
2. WHEN un événement de changement de compte est reçu THEN l'état de connexion SHALL être mis à jour automatiquement
3. WHEN un événement de changement de réseau est reçu THEN le réseau actif SHALL être mis à jour dans l'interface
4. WHEN une session expire THEN l'utilisateur SHALL être notifié et invité à se reconnecter
5. WHEN l'application est rechargée THEN les sessions existantes SHALL être restaurées automatiquement si elles sont toujours valides

### Requirement 6 : Implémentation de la signature de transactions natives Hedera

**User Story:** En tant qu'utilisateur, je veux pouvoir signer des transactions Hedera natives via HashPack, afin d'effectuer des opérations sur le réseau Hedera.

#### Acceptance Criteria

1. WHEN une transaction native Hedera est créée THEN elle SHALL être sérialisée en bytes pour l'envoi au wallet
2. WHEN une transaction est envoyée au wallet THEN la méthode `hedera_signTransaction` SHALL être utilisée
3. WHEN l'utilisateur approuve la transaction dans HashPack THEN la transaction signée SHALL être retournée à l'application
4. WHEN la transaction signée est reçue THEN elle SHALL être désérialisée et prête à être soumise au réseau
5. WHEN une erreur de signature se produit THEN un message d'erreur clair SHALL être affiché à l'utilisateur

### Requirement 7 : Implémentation de la signature de messages

**User Story:** En tant qu'utilisateur, je veux pouvoir signer des messages avec mon wallet HashPack, afin de prouver mon identité ou autoriser des actions.

#### Acceptance Criteria

1. WHEN un message doit être signé THEN la méthode `hedera_signMessage` SHALL être utilisée
2. WHEN le message est envoyé au wallet THEN il SHALL être formaté selon les spécifications Hedera
3. WHEN l'utilisateur approuve la signature THEN la signature SHALL être retournée à l'application
4. WHEN la signature est reçue THEN elle SHALL pouvoir être vérifiée avec la clé publique du compte

### Requirement 8 : Gestion améliorée des erreurs de connexion

**User Story:** En tant qu'utilisateur, je veux recevoir des messages d'erreur clairs et utiles lorsque la connexion au wallet échoue, afin de comprendre comment résoudre le problème.

#### Acceptance Criteria

1. WHEN la connexion échoue par timeout THEN un message SHALL indiquer "La connexion a expiré. Veuillez réessayer."
2. WHEN l'utilisateur rejette la connexion THEN un message SHALL indiquer "Connexion refusée dans HashPack"
3. WHEN HashPack n'est pas installé THEN un message SHALL indiquer "HashPack n'est pas installé" avec un lien vers l'installation
4. WHEN le projectId WalletConnect est invalide THEN un message SHALL indiquer le problème de configuration
5. WHEN une erreur réseau se produit THEN un message SHALL indiquer "Problème de connexion réseau. Vérifiez votre connexion internet."

### Requirement 9 : Support optionnel de Reown AppKit

**User Story:** En tant que développeur, je veux avoir la possibilité d'utiliser Reown AppKit pour une interface utilisateur moderne, afin d'améliorer l'expérience utilisateur.

#### Acceptance Criteria

1. WHEN AppKit est activé THEN il SHALL utiliser les `HederaAdapter` pour les deux namespaces
2. WHEN AppKit est configuré THEN il SHALL inclure les définitions de réseaux Hedera
3. WHEN AppKit est utilisé THEN il SHALL fournir une interface modale moderne pour la connexion
4. WHEN AppKit n'est pas activé THEN l'approche DAppConnector directe SHALL rester fonctionnelle
5. WHEN l'utilisateur choisit entre les approches THEN la configuration SHALL être facilement modifiable via une variable d'environnement

### Requirement 10 : Tests et validation de la migration

**User Story:** En tant que développeur, je veux avoir des tests automatisés pour valider la migration, afin de m'assurer que toutes les fonctionnalités fonctionnent correctement.

#### Acceptance Criteria

1. WHEN les tests sont exécutés THEN la connexion au wallet SHALL être testée avec succès
2. WHEN les tests sont exécutés THEN la récupération des balances SHALL être testée
3. WHEN les tests sont exécutés THEN la signature de transactions SHALL être testée
4. WHEN les tests sont exécutés THEN la gestion des événements de session SHALL être testée
5. WHEN les tests sont exécutés THEN la déconnexion SHALL être testée
6. WHEN tous les tests passent THEN la migration SHALL être considérée comme réussie

### Requirement 11 : Documentation et guide de migration

**User Story:** En tant que développeur, je veux avoir une documentation claire sur les changements apportés, afin de comprendre comment utiliser la nouvelle implémentation.

#### Acceptance Criteria

1. WHEN la migration est terminée THEN un document de migration SHALL être créé listant tous les changements
2. WHEN le document est créé THEN il SHALL inclure des exemples de code pour les cas d'usage courants
3. WHEN le document est créé THEN il SHALL expliquer les différences entre v1 et v2
4. WHEN le document est créé THEN il SHALL inclure des instructions de dépannage pour les problèmes courants
5. WHEN le code est mis à jour THEN les commentaires SHALL refléter l'utilisation de la v2
