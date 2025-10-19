# Requirements Document

## Introduction

Ce document définit les exigences pour la migration de l'intégration wallet de Reown AppKit vers l'utilisation directe de la bibliothèque `@hashgraph/hedera-wallet-connect` avec DAppConnector. L'objectif est de simplifier l'architecture, réduire les dépendances externes, et utiliser l'approche native recommandée par Hedera pour la connexion aux wallets via WalletConnect.

## Glossary

- **DAppConnector**: Classe principale de `@hashgraph/hedera-wallet-connect` qui gère les connexions WalletConnect avec les wallets Hedera
- **Reown AppKit**: Bibliothèque tierce (anciennement WalletConnect AppKit) utilisée actuellement pour gérer les connexions wallet
- **DAppSigner**: Classe fournie par `@hashgraph/hedera-wallet-connect` qui représente un signataire de transaction
- **WalletConnect**: Protocole de communication entre dApps et wallets
- **HashPack**: Wallet Hedera supportant WalletConnect
- **Session**: Connexion active entre la dApp et un wallet via WalletConnect
- **Modal**: Interface utilisateur permettant de sélectionner et connecter un wallet
- **Hedera Network**: Réseau blockchain Hedera (Mainnet, Testnet, Previewnet)

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux remplacer Reown AppKit par DAppConnector, afin de simplifier l'architecture et utiliser l'approche native Hedera.

#### Acceptance Criteria

1. WHEN THE System initializes, THE System SHALL create a DAppConnector instance with metadata, network configuration, and WalletConnect project ID
2. WHEN THE System initializes DAppConnector, THE System SHALL configure supported methods including all HederaJsonRpcMethod values
3. WHEN THE System initializes DAppConnector, THE System SHALL configure supported events including AccountsChanged and ChainChanged
4. WHEN THE System initializes DAppConnector, THE System SHALL configure supported chains for Mainnet and Testnet
5. WHEN THE System completes DAppConnector initialization, THE System SHALL store the initialized instance for application-wide access

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux connecter mon wallet HashPack via une modal WalletConnect, afin d'interagir avec la dApp.

#### Acceptance Criteria

1. WHEN THE user clicks a connect button, THE System SHALL invoke the openModal method on DAppConnector
2. WHEN THE modal opens, THE System SHALL display available wallet options including HashPack
3. WHEN THE user selects a wallet, THE System SHALL establish a WalletConnect session
4. WHEN THE session is established, THE System SHALL extract account information from the session
5. WHEN THE session is established, THE System SHALL create DAppSigner instances for each connected account

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que mon état de connexion wallet soit persisté, afin de ne pas avoir à me reconnecter à chaque visite.

#### Acceptance Criteria

1. WHEN THE System initializes, THE System SHALL check for existing WalletConnect sessions
2. WHEN existing sessions are found, THE System SHALL restore DAppSigner instances from session data
3. WHEN THE user disconnects, THE System SHALL clear all session data
4. WHEN THE session expires, THE System SHALL notify the user and clear connection state
5. WHEN THE network changes, THE System SHALL update the session with new network information

### Requirement 4

**User Story:** En tant que développeur, je veux gérer les événements wallet (changement de compte, changement de réseau), afin de maintenir l'état de l'application synchronisé.

#### Acceptance Criteria

1. WHEN THE wallet account changes, THE System SHALL emit an AccountsChanged event with updated account list
2. WHEN THE wallet network changes, THE System SHALL emit a ChainChanged event with new network identifier
3. WHEN THE session is deleted by wallet, THE System SHALL clean up local session state
4. WHEN THE pairing is deleted, THE System SHALL remove associated signers
5. WHEN events are received, THE System SHALL update React context state to trigger UI updates

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux signer des transactions avec mon wallet connecté, afin d'effectuer des opérations blockchain.

#### Acceptance Criteria

1. WHEN THE user initiates a transaction, THE System SHALL retrieve the appropriate DAppSigner for the account
2. WHEN signing is requested, THE System SHALL invoke signAndExecuteTransaction on DAppSigner
3. WHEN THE wallet approves, THE System SHALL return the signed transaction result
4. WHEN THE wallet rejects, THE System SHALL throw an error with rejection reason
5. WHEN multiple accounts are connected, THE System SHALL use the correct signer based on signerAccountId parameter

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux signer des messages avec mon wallet, afin de prouver la propriété de mon compte.

#### Acceptance Criteria

1. WHEN THE user requests message signing, THE System SHALL invoke signMessage on DAppConnector
2. WHEN signing a message, THE System SHALL provide signerAccountId in HIP-30 format
3. WHEN THE wallet signs, THE System SHALL return the signature and signed message
4. WHEN THE wallet rejects, THE System SHALL throw an error with rejection details
5. WHEN THE signature is returned, THE System SHALL validate the signature format

### Requirement 7

**User Story:** En tant que développeur, je veux supprimer toutes les dépendances Reown AppKit, afin de réduire la taille du bundle et simplifier la maintenance.

#### Acceptance Criteria

1. WHEN removing dependencies, THE System SHALL uninstall all @reown packages from package.json
2. WHEN removing code, THE System SHALL delete all AppKit-specific configuration files
3. WHEN removing code, THE System SHALL delete all AppKit-specific components
4. WHEN removing code, THE System SHALL delete all AppKit-specific hooks
5. WHEN removing code, THE System SHALL delete all AppKit-specific type definitions

### Requirement 8

**User Story:** En tant que développeur, je veux mettre à jour le service wallet existant (hedera-wallet.ts), afin qu'il utilise DAppConnector au lieu d'AppKit.

#### Acceptance Criteria

1. WHEN updating the service, THE System SHALL replace AppKit imports with DAppConnector imports
2. WHEN updating initialization, THE System SHALL replace AppKit configuration with DAppConnector configuration
3. WHEN updating connection logic, THE System SHALL replace openModal calls with DAppConnector.openModal
4. WHEN updating signing logic, THE System SHALL use DAppSigner methods instead of AppKit methods
5. WHEN updating disconnection, THE System SHALL use DAppConnector.disconnect for all sessions

### Requirement 9

**User Story:** En tant que développeur, je veux mettre à jour les composants wallet existants, afin qu'ils fonctionnent avec DAppConnector.

#### Acceptance Criteria

1. WHEN updating WalletModal.tsx, THE System SHALL replace AppKit modal logic with DAppConnector.openModal
2. WHEN updating AppKitButton.tsx, THE System SHALL replace AppKit hooks with DAppConnector methods
3. WHEN updating WalletConnectionWrapper.tsx, THE System SHALL update initialization to use DAppConnector
4. WHEN updating components, THE System SHALL maintain existing UI/UX behavior
5. WHEN updating components, THE System SHALL preserve error handling patterns

### Requirement 10

**User Story:** En tant que développeur, je veux mettre à jour le hook useWallet existant, afin qu'il utilise DAppConnector au lieu d'AppKit.

#### Acceptance Criteria

1. WHEN updating useWallet, THE System SHALL replace AppKit state management with DAppConnector state
2. WHEN updating useWallet, THE System SHALL expose DAppSigner instances instead of AppKit signers
3. WHEN updating useWallet, THE System SHALL maintain the same hook interface for backward compatibility
4. WHEN updating useWallet, THE System SHALL handle session events from DAppConnector
5. WHEN updating useWallet, THE System SHALL update error handling to match DAppConnector errors

### Requirement 11

**User Story:** En tant que développeur, je veux mettre à jour les tests wallet existants, afin qu'ils reflètent l'utilisation de DAppConnector.

#### Acceptance Criteria

1. WHEN updating appkit-integration.test.ts, THE System SHALL replace AppKit mocks with DAppConnector mocks
2. WHEN updating appkit-modal-opening.test.tsx, THE System SHALL test DAppConnector.openModal instead of AppKit modal
3. WHEN updating tests, THE System SHALL verify DAppSigner creation from sessions
4. WHEN updating tests, THE System SHALL test event handling (AccountsChanged, ChainChanged)
5. WHEN updating tests, THE System SHALL maintain test coverage at current levels

### Requirement 12

**User Story:** En tant qu'utilisateur, je veux que la déconnexion nettoie complètement l'état wallet, afin d'éviter les fuites de données.

#### Acceptance Criteria

1. WHEN THE user disconnects, THE System SHALL call disconnect on DAppConnector for all active sessions
2. WHEN disconnecting, THE System SHALL clear all DAppSigner instances
3. WHEN disconnecting, THE System SHALL clear wallet context state
4. WHEN disconnecting, THE System SHALL clear any cached wallet data
5. WHEN disconnecting, THE System SHALL close any open modals
