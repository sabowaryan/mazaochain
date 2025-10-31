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
