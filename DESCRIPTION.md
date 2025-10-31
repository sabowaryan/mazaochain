# MazaoChain 

![MazaoChain Logo](https://cdn.dorahacks.io/static/files/199fb4967c53927dfc4ae264f5589d10.png)

## Problem Statement: Financial Exclusion of African Farmers

**5 million smallholder farmers** across Africa face a critical barrier: they cannot access credit because they lack traditional collateral like land titles. This creates a devastating cycle:

- **No collateral** = **No bank loans**
- **Predatory lenders** charge 10-20% monthly interest
- **Future harvests** - their most valuable asset - remain illiquid and invisible to financial systems
- **Productivity stagnates** as farmers cannot invest in better seeds or equipment

## Hedera-Based Solution: Tokenizing Harvests as Digital Collateral

MazaoChain transforms agriculture finance by making future harvests bankable through Hedera blockchain technology, breaking the cycle of financial exclusion through decentralized finance.

### Core Innovation

- **RWA Tokenization**: Convert harvest value into MazaoTokens via Hedera Token Service (HTS)
- **Instant Loans**: 5-minute loan disbursement in USDC vs 3-month bank processes
- **Fair Rates**: 1-2% monthly interest vs 10-20% from informal lenders
- **Transparent**: All transactions immutably recorded on Hedera Consensus Service

## Hedera Services Used

### Hedera Token Service (HTS)

**Implementation**: Creation and management of MazaoTokens representing harvest value as collateralized digital assets. Each token is backed by real agricultural produce. Used for minting, transferring, and managing the collateral tokens throughout the loan lifecycle.

### Hedera Smart Contract Service (HSCS)

**Implementation**: Execution of Solidity smart contracts (`LoanManager` and `MazaoTokenFactory`) on Hedera's EVM-compatible network. Automates the entire loan lifecycle including collateral assessment, loan approval, USDC disbursement, and repayment execution without intermediaries.

### Hedera Consensus Service (HCS)

**Implementation**: Immutable audit trail for critical platform events including crop valuations, loan state changes, and repayment records, ensuring transparent and tamper-proof operations for all stakeholders.

## Testing Access

### Live Application Deployment

**Demo URL**: [https://mazaochain.vercel.app/](https://mazaochain.vercel.app/)

### Test Hedera Account for Judges

**Testnet Account ID**: `0.0.6913540`  
**Private Key**: `3b22b2f2b2a55be6efdeea3f3983c560c119bdd63f1ec4e148fde994d8b235c3`  
**tℏ Balance**: Account funded with sufficient tℏ for transaction testing

### Platform Test Credentials

**Farmer Account**
- Email: mazao.farmer.demo@gmail.com
- Password: FarmerDemo123!

**Cooperative Account**
- Email: mazao.cooperative.demo@gmail.com
- Password: CoopDemo123!

**Lender Account**
- Email: mazao.lender.demo@gmail.com
- Password: LenderDemo123!

### Recommended Test Flow (8 minutes)

1. **Farmer Login** → Evaluate crops → Tokenize harvest → Request $500 loan
2. **Cooperative Login** → Review applications → Approve loans
3. **Lender Login** → Monitor portfolio → Track repayments

## Hackathon Track

**Onchain Finance & RWA (Real World Assets)**

### Alignment Justification

- **Real World Asset Tokenization**: Direct tokenization of agricultural harvests as collateral using HTS
- **Financial Inclusion**: Banking the unbanked farming population through DeFi powered by Hedera Smart Contracts
- **Hedera Advantage**: $0.0001 predictable fees enable sustainable micro-transactions essential for smallholder farmers
- **African Context**: Built specifically for African agricultural challenges with local insights

## Technical Implementation

### Blockchain Architecture

#### Hedera Hashgraph Infrastructure:

- **HTS (Token Service)** - MazaoToken creation & management (Token ID: dynamically created)
- **HSCS (Smart Contract Service)** - Loan lifecycle automation (Contract IDs: 0.0.6913910, 0.0.6913902)
- **HCS (Consensus Service)** - Immutable audit trail for critical operations
- **HashPack Wallet** - Secure user interactions via WalletConnect v2
- **JSON-RPC & Mirror Nodes** - Real-time balance queries and transaction verification

### Key Features Live in MVP

✅ **Multi-role Platform** (Farmer/Cooperative/Lender)  
✅ **Crop Valuation Algorithm** - Automated harvest assessment  
✅ **Collateral Management** - 200% over-collateralization via HTS tokens  
✅ **Instant USDC Disbursement** - < 5 minute loan processing using HSCS  
✅ **Mobile-First Design** - Optimized for rural connectivity  
✅ **Live Hedera Transactions** - Real token minting, transfers, and smart contract executions

### Deployed Hedera IDs (Testnet)

| Component | ID | Purpose |
|-----------|----|---------| 
| **Operator Account** | 0.0.6913540 | Protocol operations and transaction signing |
| **LoanManager Contract** | 0.0.6913910 | Manages complete loan lifecycle |
| **MazaoTokenFactory** | 0.0.6913902 | Dynamic HTS token creation for harvest collateral |
| **USDC Token** | 0.0.456858 | Loan disbursement and repayment currency |

## Market Impact

### Target Opportunity

- **5 million** smallholder farmers in Africa
- **$15 million** annual loan potential
- **Current Focus**: DRC pilot, scalable across Francophone Africa

### Business Model

- **2% service fee** on loan volume
- **Revenue sharing** with cooperative partners
- **Sustainable growth** through ecosystem collaboration

## Why MazaoChain Stands Out

| Traditional Finance | Informal Lenders | MazaoChain |
|--------------------|------------------|------------|
| 3+ month processing | 10-20% monthly interest | **5-minute loans** |
| Land titles required | Predatory practices | **1-2% monthly rates** |
| Excludes 90% of farmers | Debt traps | **Harvests as collateral** |
| High operational costs | No transparency | **$0.0001 Hedera fees** |

## Vision

**Building the foundational DeFi layer for African agriculture** - where every farmer's hard work becomes their credit score, and financial inclusion becomes reality through Hedera blockchain technology.

---

*Built in Kinshasa, DRC - Solving African challenges with African innovation*
