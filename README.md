# MazaoChain : Plateforme de Prêt Décentralisée pour Agriculteurs
## Piste : Finance Décentralisée (DeFi)



MazaoChain est une plateforme de finance décentralisée (DeFi) conçue pour connecter les agriculteurs ayant besoin de financement avec des prêteurs. Le projet utilise le réseau Hedera Hashgraph pour la tokenisation des récoltes comme collatéral et la gestion des prêts via des Smart Contracts, garantissant des transactions rapides, sécurisées et à faible coût.

---

## Résumé Détaillé de l'Intégration Hedera

L'architecture de MazaoChain repose sur une intégration profonde avec Hedera, choisie pour sa performance, sa sécurité de niveau entreprise et, surtout, ses **frais de transaction prévisibles et très bas**. Ces caractéristiques sont cruciales pour une application ciblant l'inclusion financière, où les frais élevés pourraient exclure les petits agriculteurs.

| Service Hedera | Rôle dans MazaoChain | Justification Économique et Technique |
| :--- | :--- | :--- |
| **Hedera Token Service (HTS)** | Création des **MazaoTokens** (tokens de récolte) utilisés comme collatéral pour les prêts. Gestion des transferts de ces tokens et de l'USDC pour le décaissement et le remboursement des prêts. | **Frais Prévisibles et Faibles :** Les frais pour la création, la frappe (`Mint`) et le transfert de tokens sont fixes et minimes (quelques centimes de dollar), ce qui est essentiel pour une tokenisation fréquente et de petits montants. **Conformité :** HTS permet de gérer des tokens fongibles avec des fonctionnalités de conformité intégrées (comme le gel/dégel), nécessaires pour la gestion du collatéral. |
| **Hedera Smart Contract Service (HSCS)** | Déploiement et exécution du contrat `LoanManager` pour la gestion du cycle de vie des prêts (création, approbation, remboursement, liquidation). | **EVM Compatibilité & Performance :** Utilisation de la Hedera Smart Contract Service (HSCS) pour exécuter des contrats Solidity (EVM) avec la finalité rapide et les faibles latences d'Hedera. **Sécurité :** La logique métier complexe des prêts est encapsulée dans un code auditable et immuable. |
| **Hedera Consensus Service (HCS)** | Potentiellement utilisé pour l'horodatage immuable et la journalisation des événements critiques (ex: évaluation des récoltes, changements d'état des prêts) pour une piste d'audit transparente. | **Immuabilité et Vitesse :** Offre un débit élevé et un horodatage vérifiable pour les messages, ce qui est idéal pour l'auditabilité sans les frais de stockage de données sur la blockchain principale. |

---

## Types de Transactions Hedera

MazaoChain exécute principalement les transactions suivantes pour gérer le flux de prêt et la tokenisation :

| Transaction Hedera | Description | Service Utilisé |
| :--- | :--- | :--- |
| `TokenCreateTransaction` | Utilisée par le `MazaoTokenFactory` pour créer un nouveau **MazaoToken** (token de récolte) pour un agriculteur, représentant le collatéral. | HTS |
| `TokenMintTransaction` | Utilisée pour frapper une quantité spécifique de **MazaoTokens** et les associer au compte de l'agriculteur. | HTS |
| `TokenAssociateTransaction` | Requise par les comptes (agriculteur, prêteur, opérateur) pour accepter les **MazaoTokens** et l'USDC avant le transfert. | HTS |
| `TransferTransaction` | Transaction fondamentale pour : 1) Le décaissement de l'USDC du compte de l'opérateur vers l'agriculteur. 2) Le transfert des **MazaoTokens** de l'agriculteur vers le compte d'entiercement (escrow) comme collatéral. 3) Le remboursement de l'USDC de l'agriculteur vers le prêteur/opérateur. | HTS |
| `ContractCallQuery` / `ContractExecuteTransaction` | Utilisées pour interagir avec les Smart Contracts `LoanManager` et `MazaoTokenFactory` (ex: créer un prêt, mettre à jour l'état du prêt). | HSCS |
| `AccountBalanceQuery` | Utilisée pour vérifier le solde des tokens (USDC et MazaoTokens) d'un compte avant d'autoriser une transaction. | Hedera SDK |

---

## Schéma d'Architecture (Flux de Données)

Le schéma ci-dessous illustre le flux de données entre l'interface utilisateur, le backend (Next.js/Supabase) et le réseau Hedera.

```mermaid
graph TD
    A[Utilisateur/Client Web] -->|Requête HTTP| B(Application Next.js/React)
    B -->|Interaction UI/UX| C[Composants Front-end]
    
    C -->|Appel de service| D{Services Backend/Logique Applicative}
    
    %% Supabase Flow
    D -->|Authentification/Données| E[Supabase (PostgreSQL, Auth, Functions)]
    E -->|Migrations, Stockage| F[Base de données PostgreSQL]
    
    %% Hedera Flow
    D -->|Transaction Hedera (SDK)| G[Nœud Hedera]
    
    G -->|Création/Transfert de Token| H(Hedera Token Service - HTS)
    G -->|Appel de Fonction| I(Hedera Smart Contract Service - HSCS)
    
    I -->|Contrat Déployé| J[LoanManager Smart Contract]
    I -->|Contrat Déployé| K[MazaoTokenFactory Smart Contract]
    
    H -->|Création de Token| L[MazaoToken (Fungible Token)]
    H -->|Transfert de Token (USDC/Mazao)| M[TransferTransaction]
    
    %% Data Flow
    D -->|Enregistrement des IDs| F
    G -->|Réponse de Transaction/Reçu| D
    
    %% Key DeFi Interactions
    style J fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px
    style G fill:#afa,stroke:#333,stroke-width:2px
    style E fill:#ffc,stroke:#333,stroke-width:2px
    
    D -->|Escrow/Disbursement USDC| G
    D -->|Tokenization/Collateral| G
    D -->|Loan Management| G
    
    %% Legend
    subgraph Légende
        L1[HTS: Hedera Token Service]
        L2[HSCS: Hedera Smart Contract Service]
        L3[USDC: Stablecoin (HBAR Token)]
        L4[MazaoToken: Token de culture (Collateral)]
    end
    
    L1 & L2 & L3 & L4
```

---

## Instructions de Déploiement

Ces instructions détaillent l'installation et l'exécution du projet MazaoChain en local, connecté au **Testnet Hedera**.

### Étape 0 : Cloner le Projet

Commencez par cloner le dépôt GitHub :

```bash
# Cloner le dépôt
git clone https://github.com/sabowaryan/mazaochain
cd mazaochain
```

### Prérequis

Pour exécuter le projet, vous devez avoir installé les dépendances logicielles suivantes :

*   **Node.js** (version 18+)
*   **pnpm** (gestionnaire de paquets recommandé)
*   **Git** et **GitHub CLI** (pour le clonage)
*   Compte Hedera Testnet avec un Account ID et une Private Key.
*   Projet Supabase local ou distant.

### Étape 1 : Installation des Dépendances

Installez les dépendances du projet :

```bash
pnpm install
```

### Étape 2 : Configuration de l'Environnement

Créez un fichier `.env.local` à la racine du projet en copiant le fichier d'exemple :

```bash
cp .env.local.example .env.local
```

Modifiez le fichier `.env.local` en vous basant sur le tableau ci-dessous pour obtenir les clés nécessaires :

| Variable d'Environnement | Description | Source d'Obtention |
| :--- | :--- | :--- |
| **Hedera Configuration** | | |
| `NEXT_PUBLIC_HEDERA_ACCOUNT_ID` | L'ID de compte de l'opérateur (format `0.0.XXXXXX`) pour le Testnet. | Créez un compte via le **[Portail Développeur Hedera](https://portal.hedera.com/register)** (Testnet) ou utilisez le **[Faucet Hedera](https://portal.hedera.com/faucet)** pour obtenir un compte gratuit. |
| `HEDERA_PRIVATE_KEY` | La clé privée correspondante à l'ID de compte ci-dessus. | Fournie lors de la création du compte Hedera. **Attention :** Ne jamais la partager. |
| **Supabase Configuration** | | |
| `NEXT_PUBLIC_SUPABASE_URL` | L'URL de votre projet Supabase. | **[Tableau de bord Supabase](https://app.supabase.com/)** > Paramètres du projet > **Clés API**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clé publique (Anon Key) de votre projet Supabase. | **[Tableau de bord Supabase](https://app.supabase.com/)** > Paramètres du projet > **Clés API**. |
| `SUPABASE_SERVICE_ROLE_KEY` | La clé de rôle de service (Service Role Key) de votre projet Supabase (utilisée pour les opérations backend sécurisées). | **[Tableau de bord Supabase](https://app.supabase.com/)** > Paramètres du projet > **Clés API**. |
| **WalletConnect / HashPack** | | |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | L'ID de votre projet WalletConnect. | Obtenez-le sur le **[Cloud WalletConnect](https://cloud.walletconnect.com/)**. Nécessaire pour la connexion aux portefeuilles mobiles comme HashPack. |
| **Smart Contract Addresses** | | |
| `NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID` | L'ID du contrat de fabrique de tokens (format `0.0.XXXXXX`). | Déployez le contrat `MazaoTokenFactory.sol` sur le Testnet Hedera et utilisez l'ID retourné. Consultez la **[Documentation Hedera Smart Contract](https://docs.hedera.com/hedera/sdks-and-tools/sdks/smart-contracts)** pour les instructions de déploiement. |
| `NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID` | L'ID du contrat de gestion des prêts (format `0.0.XXXXXX`). | Déployez le contrat `LoanManager.sol` sur le Testnet Hedera et utilisez l'ID retourné. Consultez la **[Documentation Hedera Smart Contract](https://docs.hedera.com/hedera/sdks-and-tools/sdks/smart-contracts)** pour les instructions de déploiement. |
| **Autres Configurations** | | |
| `NEXTAUTH_SECRET` | Une chaîne de caractères longue et aléatoire pour les sessions NextAuth. | Générez une chaîne aléatoire (ex: `openssl rand -base64 32`). |
| `SMTP_*` / `TWILIO_*` | Clés de configuration pour les services d'e-mail et SMS. | Obtenez ces clés auprès de votre fournisseur de services (ex: **[Twilio Console](https://www.twilio.com/console)** pour les SMS). |

### Étape 3 : Démarrage de Supabase Local (Recommandé)

Si vous utilisez Supabase en local, démarrez le service :

```bash
supabase start
```

Puis, liez les migrations :

```bash
supabase migration up
```

### Étape 4 : Exécution du Projet

Démarrez l'application Next.js en mode développement :

```bash
pnpm dev
```

L'application sera accessible à l'adresse `http://localhost:3000`.

---

## IDs Hedera Déployés (Testnet)

Les IDs suivants sont utilisés pour l'exécution du projet sur le Testnet Hedera, tels que définis dans `src/lib/contracts/deployed-contracts.ts` et les services de transfert :

| Type d'ID | Nom du Contrat/Token | ID Testnet (Exemple) | Rôle |
| :--- | :--- | :--- | :--- |
| **Account ID** | Opérateur du Protocole (Trésorerie) | `0.0.6913540` | Compte utilisé pour signer les transactions de service (mint, escrow, disbursement). |
| **Smart Contract ID** | `MazaoTokenFactory` | `0.0.6913902` | Contrat responsable de la création dynamique des **MazaoTokens** (collatéral). |
| **Smart Contract ID** | `LoanManager` | `0.0.6913910` | Contrat gérant la logique et l'état de tous les prêts. |
| **Token ID** | USDC (Stablecoin de Prêt) | `0.0.456858` | Token ID de l'USDC simulé sur le Testnet, utilisé pour les transactions de prêt. |
| **Token ID** | MazaoToken (Exemple) | Créé dynamiquement | Token fongible (HTS) représentant une récolte spécifique, utilisé comme collatéral. |

***Note :*** *Les IDs de contrat sont des exemples tirés du fichier de configuration et doivent être mis à jour si les contrats sont redéployés.*
