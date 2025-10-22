# Requirements Document - AppKit with HederaProvider Integration

## Introduction

Ce document définit les exigences pour l'intégration de Reown AppKit avec HederaProvider et HederaAdapter de `@hashgraph/hedera-wallet-connect`. Cette approche combine la modal UI moderne d'AppKit avec l'architecture robuste de HederaProvider, offrant une solution complète pour la connexion wallet avec support des namespaces Hedera native et EVM.

## Glossary

- **HederaProvider**: Provider central de `@hashgraph/hedera-wallet-connect` qui gère la communication avec WalletConnect
- **HederaAdapter**: Adaptateur spécifique pour un namespace (hedera ou eip155) permettant d'interagir avec Hedera
- **Reown AppKit**: Bibliothèque UI moderne (anciennement WalletConnect AppKit) pour les connexions wallet
- **UniversalProvider**: Provider WalletConnect utilisé en interne par HederaProvider
- **HederaChainDefinition**: Définitions des réseaux Hedera (Native.Mainnet, Native.Testnet, EVM.Mainnet, EVM.Testnet)
- **createAppKit**: Fonction pour initialiser AppKit avec les adapters Hedera
- **Namespace**: Espace de noms pour les transactions (hedera pour native, eip155 pour EVM)
- **Modal**: Interface utilisateur AppKit pour sélectionner et connecter un wallet

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux initialiser HederaProvider avec les métadonnées de l'application, afin d'établir la connexion WalletConnect de base.

#### Acceptance Criteria

1. WHEN THE System initializes, THE System SHALL call HederaProvider.init with projectId and metadata
2. WHEN initializing HederaProvider, THE System SHALL provide application name, description, url, and icons in metadata
3. WHEN HederaProvider initialization completes, THE System SHALL cast the result to UniversalProvider type for AppKit compatibility
4. WHEN HederaProvider fails to initialize, THE System SHALL throw a WalletError with INITIALIZATION_FAILED code
5. WHEN HederaProvider is initialized, THE System SHALL store the instance for subsequent adapter creation

### Requirement 2

**User Story:** En tant que développeur, je veux créer des HederaAdapter pour les namespaces native et EVM, afin de supporter les deux types de transactions Hedera.

#### Acceptance Criteria

1. WHEN creating native adapter, THE System SHALL configure HederaAdapter with namespace 'hedera' and HederaChainDefinition.Native networks
2. WHEN creating EVM adapter, THE System SHALL configure HederaAdapter with namespace 'eip155' and HederaChainDefinition.EVM networks
3. WHEN creating adapters, THE System SHALL provide the WalletConnect projectId to each adapter
4. WHEN creating adapters, THE System SHALL include both Mainnet and Testnet networks for each namespace
5. WHEN adapters are created, THE System SHALL store them for AppKit initialization

### Requirement 3

**User Story:** En tant que développeur, je veux initialiser AppKit avec les adapters Hedera et le UniversalProvider, afin d'obtenir une modal UI moderne pour la connexion wallet.

#### Acceptance Criteria

1. WHEN initializing AppKit, THE System SHALL call createAppKit with adapters array containing native and EVM adapters
2. WHEN initializing AppKit, THE System SHALL provide the UniversalProvider instance from HederaProvider
3. WHEN initializing AppKit, THE System SHALL configure projectId, metadata, and networks
4. WHEN initializing AppKit, THE System SHALL disable analytics, email, and social login features
5. WHEN initializing AppKit, THE System SHALL configure theme mode and theme variables for branding

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux connecter mon wallet HashPack via la modal AppKit, afin d'interagir avec la dApp en utilisant une interface moderne.

#### Acceptance Criteria

1. WHEN THE user clicks connect button, THE System SHALL open the AppKit modal
2. WHEN THE modal opens, THE System SHALL display available wallets including HashPack
3. WHEN THE user selects a wallet and namespace, THE System SHALL establish a WalletConnect session
4. WHEN THE session is established, THE System SHALL extract account information from the session
5. WHEN THE connection succeeds, THE System SHALL update connection state with accountId, network, and namespace

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que mon état de connexion soit persisté par AppKit, afin de ne pas avoir à me reconnecter à chaque visite.

#### Acceptance Criteria

1. WHEN THE System initializes, THE System SHALL allow AppKit to restore existing sessions automatically
2. WHEN a session exists, THE System SHALL retrieve connection state from AppKit
3. WHEN THE user disconnects, THE System SHALL call AppKit disconnect methods
4. WHEN THE session expires, THE System SHALL clear connection state
5. WHEN THE page reloads, THE System SHALL restore connection state from AppKit session

### Requirement 6

**User Story:** En tant que développeur, je veux gérer les événements de session AppKit, afin de maintenir l'état de l'application synchronisé.

#### Acceptance Criteria

1. WHEN THE wallet account changes, THE System SHALL receive notification from AppKit
2. WHEN THE wallet network changes, THE System SHALL update connection state with new network
3. WHEN THE session is deleted, THE System SHALL clean up local connection state
4. WHEN events are received, THE System SHALL update React context to trigger UI updates
5. WHEN connection state changes, THE System SHALL notify all subscribed components

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux signer des transactions avec mon wallet connecté via AppKit, afin d'effectuer des opérations blockchain.

#### Acceptance Criteria

1. WHEN THE user initiates a transaction, THE System SHALL retrieve the appropriate adapter for the namespace
2. WHEN signing is requested, THE System SHALL use the adapter's signTransaction method
3. WHEN THE wallet approves, THE System SHALL return the signed transaction result
4. WHEN THE wallet rejects, THE System SHALL throw a WalletError with TRANSACTION_REJECTED code
5. WHEN signing fails, THE System SHALL provide detailed error information to the user

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux signer des messages avec mon wallet via AppKit, afin de prouver la propriété de mon compte.

#### Acceptance Criteria

1. WHEN THE user requests message signing, THE System SHALL use the appropriate adapter for the namespace
2. WHEN signing a message, THE System SHALL provide signerAccountId in the correct format
3. WHEN THE wallet signs, THE System SHALL return the signature and signed message
4. WHEN THE wallet rejects, THE System SHALL throw a WalletError with rejection details
5. WHEN THE signature is returned, THE System SHALL validate the signature format

### Requirement 9

**User Story:** En tant que développeur, je veux créer un nouveau service HederaWalletService utilisant HederaProvider et AppKit, afin de remplacer l'implémentation DAppConnector actuelle.

#### Acceptance Criteria

1. WHEN creating the service, THE System SHALL import HederaProvider, HederaAdapter, and HederaChainDefinition
2. WHEN creating the service, THE System SHALL import createAppKit from @reown/appkit
3. WHEN initializing the service, THE System SHALL create HederaProvider, adapters, and AppKit in sequence
4. WHEN the service is initialized, THE System SHALL expose methods for connect, disconnect, sign, and balance queries
5. WHEN the service is used, THE System SHALL maintain backward compatibility with existing IWalletService interface

### Requirement 10

**User Story:** En tant que développeur, je veux créer un fichier de configuration AppKit séparé, afin de centraliser la configuration de l'UI et des thèmes.

#### Acceptance Criteria

1. WHEN creating appkit-config.ts, THE System SHALL export a function to initialize AppKit
2. WHEN configuring AppKit, THE System SHALL accept adapters and universalProvider as parameters
3. WHEN configuring AppKit, THE System SHALL define theme variables for MazaoChain branding
4. WHEN configuring AppKit, THE System SHALL disable unnecessary features (analytics, email, socials)
5. WHEN configuration is complete, THE System SHALL return the AppKit instance

### Requirement 11

**User Story:** En tant que développeur, je veux mettre à jour wallet-service-factory.ts, afin qu'il retourne le nouveau service basé sur HederaProvider et AppKit.

#### Acceptance Criteria

1. WHEN updating the factory, THE System SHALL import the new HederaWalletService
2. WHEN getWalletService is called, THE System SHALL return the AppKit-based service instance
3. WHEN the factory is used, THE System SHALL maintain the IWalletService interface contract
4. WHEN the service is accessed, THE System SHALL ensure singleton pattern for the service instance
5. WHEN the factory is updated, THE System SHALL not break existing code using the factory

### Requirement 12

**User Story:** En tant que développeur, je veux mettre à jour les tests wallet existants, afin qu'ils reflètent l'utilisation de HederaProvider et AppKit.

#### Acceptance Criteria

1. WHEN updating tests, THE System SHALL mock HederaProvider.init method
2. WHEN updating tests, THE System SHALL mock HederaAdapter constructor
3. WHEN updating tests, THE System SHALL mock createAppKit function
4. WHEN updating tests, THE System SHALL verify adapter creation with correct namespaces
5. WHEN updating tests, THE System SHALL maintain test coverage at current levels

### Requirement 13

**User Story:** En tant qu'utilisateur, je veux que la déconnexion nettoie complètement l'état wallet via AppKit, afin d'éviter les fuites de données.

#### Acceptance Criteria

1. WHEN THE user disconnects, THE System SHALL call AppKit disconnect methods
2. WHEN disconnecting, THE System SHALL clear all adapter instances
3. WHEN disconnecting, THE System SHALL clear wallet context state
4. WHEN disconnecting, THE System SHALL clear any cached wallet data
5. WHEN disconnecting, THE System SHALL close the AppKit modal if open

### Requirement 14

**User Story:** En tant que développeur, je veux gérer les erreurs spécifiques à HederaProvider et AppKit, afin de fournir des messages d'erreur clairs aux utilisateurs.

#### Acceptance Criteria

1. WHEN HederaProvider initialization fails, THE System SHALL throw WalletError with INITIALIZATION_FAILED
2. WHEN AppKit connection is rejected, THE System SHALL throw WalletError with CONNECTION_REJECTED
3. WHEN network errors occur, THE System SHALL throw WalletError with NETWORK_ERROR
4. WHEN invalid projectId is detected, THE System SHALL throw WalletError with INVALID_PROJECT_ID
5. WHEN unknown errors occur, THE System SHALL wrap them in WalletError with UNKNOWN_ERROR and original error

### Requirement 15

**User Story:** En tant que développeur, je veux documenter l'architecture HederaProvider + AppKit, afin que l'équipe comprenne l'implémentation.

#### Acceptance Criteria

1. WHEN creating documentation, THE System SHALL include architecture diagrams showing component relationships
2. WHEN documenting, THE System SHALL explain the role of HederaProvider, HederaAdapter, and AppKit
3. WHEN documenting, THE System SHALL provide code examples for initialization and usage
4. WHEN documenting, THE System SHALL describe the differences with DAppConnector approach
5. WHEN documentation is complete, THE System SHALL include troubleshooting guide for common issues
