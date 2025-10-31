
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
    
    %% Sub-processes in D (Services Backend/Logique Applicative)
    subgraph Services
        D1[HederaTokenService]
        D2[USDCTransferService]
        D3[LoanService (via Smart Contract)]
    end
    
    D1 --> H
    D2 --> G
    D3 --> I
    
    %% Key DeFi Interactions
    style J fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px
    style G fill:#afa,stroke:#333,stroke-width:2px
    style E fill:#ffc,stroke:#333,stroke-width:2px
    
    D2 -->|Escrow/Disbursement USDC| G
    D1 -->|Tokenization/Collateral| G
    D3 -->|Loan Management| G
    
    %% Legend
    subgraph Légende
        L1[HTS: Hedera Token Service]
        L2[HSCS: Hedera Smart Contract Service]
        L3[USDC: Stablecoin (HBAR Token)]
        L4[MazaoToken: Token de culture (Collateral)]
    end
    
    L1 & L2 & L3 & L4
```

### Explication du Schéma d'Architecture

1.  **Interface Utilisateur (A, B, C) :** L'utilisateur interagit avec l'application web Next.js/React (B). Les actions déclenchent des appels via les composants front-end (C).
2.  **Logique Applicative (D) :** Le cœur du backend (services Next.js API Routes ou fonctions Supabase) gère la logique métier.
    *   **Services Clés :** `HederaTokenService` (D1), `USDCTransferService` (D2), et `LoanService` (D3) orchestrent les interactions avec Hedera.
3.  **Base de Données et Backend (E, F) :** Supabase est utilisé pour l'authentification, le stockage des données relationnelles (profils, prêts, enregistrements de tokenisation), et l'exécution de fonctions backend.
4.  **Réseau Hedera (G, H, I) :**
    *   Toutes les transactions passent par un **Nœud Hedera** (G).
    *   **Hedera Token Service (HTS - H) :** Gère les opérations de tokenisation (création de `MazaoToken` - L) et les transferts de tokens (M), y compris l'USDC pour les prêts et les `MazaoToken` pour le collatéral.
    *   **Hedera Smart Contract Service (HSCS - I) :** Permet l'interaction avec les contrats Solidity déployés.
    *   **Smart Contracts (J, K) :** Le contrat `LoanManager` (J) gère le cycle de vie des prêts, et `MazaoTokenFactory` (K) est responsable de la création des tokens de culture (collatéral).
5.  **Flux DeFi :**
    *   **Tokenisation :** Les agriculteurs utilisent le `MazaoTokenFactory` pour créer des `MazaoToken` (L) représentant leur récolte, qui servent de **collatéral**.
    *   **Prêt :** Le `LoanManager` gère l'engagement de prêt. Le service `USDCTransferService` (D2) utilise des `TransferTransaction` (M) pour le **décaissement** du prêt en USDC et l'**escrow** du collatéral.
    *   **Remboursement :** Les remboursements en USDC sont également gérés par `TransferTransaction` vers le compte de l'opérateur.
    
Ce schéma illustre la séparation claire des responsabilités : Supabase pour les données et l'authentification, et Hedera pour la logique immuable (Smart Contracts) et la gestion des actifs numériques (HTS).
