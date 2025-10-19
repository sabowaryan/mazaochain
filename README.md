# MazaoChain 🌱

**Mbuma na yo, capital na yo** _(Your harvest, your capital)_

![MazaoChain Logo](public/logo.svg)

## 🚀 Overview

MazaoChain is a decentralized finance platform that enables African smallholder farmers to tokenize their future harvests as collateral for instant loans. Built on Hedera Hashgraph, we're solving financial exclusion for millions of farmers across Africa.

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Built on Hedera](https://img.shields.io/badge/Built%20on-Hedera%20Hashgraph-purple)
![License](https://img.shields.io/badge/License-MIT-blue)
![Twitter](https://img.shields.io/twitter/follow/MazaoChain)

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Smart Contracts](#-smart-contracts)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🚨 Problem Statement

### The Financial Exclusion Crisis

- **500 million** smallholder farmers in Africa lack access to formal credit
- **90%** don't have land titles for traditional bank collateral
- Predatory informal lenders charge **10-20% monthly interest**
- Farmers' most valuable asset - their future harvest - is **illiquid and invisible** to financial systems

## 💡 Our Solution

MazaoChain transforms future harvests into digital collateral through:

- 🌾 **Crop Valuation** - AI-powered assessment of harvest value
- 🪙 **Tokenization** - Convert harvest value to MazaoTokens on Hedera HTS
- 💰 **Instant Loans** - Collateralized lending in USDC stablecoins
- 🔄 **Automated Repayment** - Smart contract-managed loan lifecycle

## ✨ Features

### For Farmers

- 📱 **Mobile-First Interface** - Optimized for basic smartphones
- 🌍 **Multilingual Support** - Lingala, French, English
- ⚡ **Instant Loan Disbursement** - 5 minutes vs 3 months
- 💰 **Fair Rates** - 1-2% monthly vs 10-20% informal rates
- 🔒 **Transparent Terms** - All terms recorded on blockchain

### For Lenders

- 🛡️ **Over-Collateralized Loans** - Minimum 200% collateral ratio
- 📊 **Real-time Analytics** - Portfolio performance dashboard
- 🌱 **Impact Investing** - Direct social impact measurement
- 🔍 **Transparent Risk Assessment** - On-chain farmer history

## 🛠 Technology Stack

### Blockchain Layer

- **Hedera Hashgraph** - Main blockchain infrastructure
- **HTS (Hedera Token Service)** - MazaoToken creation and management
- **HCS (Hedera Consensus Service)** - Immutable audit trail
- **Smart Contracts** - Loan automation and collateral management

### Backend & Infrastructure

- **Node.js + Next.js API Routes** - API server
- **Supabase** - PostgreSQL database & authentication
- **IPFS/Filecoin** - Document storage
- **Redis** - Caching and session management

### Frontend

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Styling and responsive design
- **HashPack Wallet Connect v2** - Hedera wallet integration with dual namespace support
- **Framer Motion** - Animations and interactions

### DevOps & Tools

- **Turbopack** - Fast development builds
- **TypeScript** - Type safety
- **ESLint & Prettier** - Code quality
- **Jest & React Testing Library** - Testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Hedera Testnet account
- Supabase account
- HashPack wallet (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/sabowaryan/mazaochain.git
cd mazaochain-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up your environment variables (see Configuration section)

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

VisiIntettp://localhost:3000` to see the application.

##  Acconfiguration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MazaoChain MVP

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Hedera Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_private_key

# WalletConnect (Required for HashPack v2)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# HashPack Wallet Configuration
NEXT_PUBLIC_HASHPACK_APP_NAME=MazaoChain MVP
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Decentralized lending for farmers

# Optional: Use Reown AppKit UI
NEXT_PUBLIC_USE_APPKIT=false

# Token IDs (Testnet)
NEXT_PUBLIC_MAZAO_TOKEN_ID=0.0.xxxxx
NEXT_PUBLIC_USDC_TOKEN_ID=0.0.xxxxx
```

## 📁 Project Structure

```
mazaochain-mvp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lang]/            # Internationalized routes
│   │   │   ├── dashboard/     # Dashboard pages
│   │   │   └── auth/          # Authentication pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── crop-evaluation/  # Crop evaluation UI
│   │   ├── loan/             # Loan management UI
│   │   ├── wallet/           # Wallet integration
│   │   └── ui/               # Reusable UI components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Core libraries
│   │   ├── errors/          # Error handling
│   │   ├── services/        # Business logic services
│   │   ├── supabase/        # Database client
│   │   └── wallet/          # Hedera wallet integration
│   ├── types/               # TypeScript type definitions
│   └── __tests__/           # Test files
├── supabase/
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── messages/               # i18n translations
```

### Key Directories

- **`src/app/api/`** - RESTful API endpoints
- **`src/lib/services/`** - Core business logic (loans, tokenization, etc.)
- **`src/components/`** - Reusable React components
- **`supabase/migrations/`** - Database schema and migrations

## � Smart Contracts

### MazaoToken (HTS Token)

- **Token ID**: `0.0.xxxxx` (Testnet)
- **Type**: Fungible Token
- **Decimals**: 8
- **Supply**: Dynamic (minted per crop evaluation)

### Loan Management

Smart contracts handle:
- Collateral escrow
- Automated disbursement
- Repayment processing
- Collateral release

## 📚 Usage Examples

### Farmer Onboarding

```typescript
// 1. Register as a farmer
const { user } = await signUp({
  email: 'farmer@example.com',
  password: 'secure_password',
  role: 'agriculteur'
});

// 2. Complete profile
await updateProfile({
  nom: 'Jean Mukendi',
  superficie: 5.0,
  localisation: 'Kinshasa, DRC'
});
```

### Tokenization Process

```typescript
// 1. Submit crop evaluation
const evaluation = await createCropEvaluation({
  crop_type: 'manioc',
  superficie: 5.0,
  rendement_estime: 15000,
  date_recolte_prevue: '2025-06-15'
});

// 2. Cooperative approves
await approveCropEvaluation(evaluation.id, {
  valeur_estimee: 12000
});

// 3. Tokens minted automatically
// MazaoTokens credited to farmer's wallet
```

### Loan Request

```typescript
// 1. Check eligibility
const eligibility = await loanService.checkLoanEligibility(
  farmerId,
  5000 // USDC amount
);

// 2. Request loan
if (eligibility.isEligible) {
  const loan = await loanService.createLoanRequest({
    borrowerId: farmerId,
    requestedAmount: 5000,
    repaymentPeriodMonths: 6
  });
}

// 3. Automatic disbursement after approval
// USDC sent to farmer's wallet
// Collateral escrowed in smart contract
```

## 🔗 HashPack Wallet Integration

### Wallet v2 Implementation

MazaoChain uses **HashPack Wallet Connect v2** (`@hashgraph/hedera-wallet-connect` v2.0.4+) for secure Hedera wallet integration. The v2 implementation provides:

- ✅ **Dual Namespace Support**: Both Hedera native and EVM transactions
- ✅ **Improved Stability**: Better session management with automatic restoration
- ✅ **Modern Architecture**: Provider-Adapter pattern aligned with WalletConnect v2 standards
- ✅ **Simplified API**: Automatic node ID handling - no manual configuration needed
- ✅ **Rich Events**: Session lifecycle events for better UX
- ✅ **Type Safety**: Full TypeScript support with comprehensive error codes

### Quick Start

#### 1. Get a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a free account
3. Create a new project
4. Copy your Project ID
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

#### 2. Install HashPack Wallet

- **Browser Extension**: [Chrome Web Store](https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk)
- **Mobile App**: [iOS](https://apps.apple.com/app/hashpack/id1609318886) | [Android](https://play.google.com/store/apps/details?id=app.hashpack.wallet)

#### 3. Connect Your Wallet

```typescript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { connectWallet, isConnected, accountId, balance } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connectWallet}>Connect HashPack</button>
      ) : (
        <div>
          <p>Connected: {accountId}</p>
          <p>Balance: {balance?.hbar} HBAR</p>
        </div>
      )}
    </div>
  );
}
```

### Wallet Features

| Feature | Description |
|---------|-------------|
| **Connect** | HashPack extension or mobile app via WalletConnect v2 |
| **Sign Transactions** | Native Hedera and EVM transactions with automatic node ID handling |
| **Sign Messages** | Authentication and authorization signatures |
| **Session Management** | Automatic session restoration on page reload |
| **Balance Tracking** | Real-time HBAR and HTS token balances |
| **Event System** | Session updates, account changes, network changes |
| **Error Handling** | Comprehensive error codes with user-friendly messages |

### Documentation

📚 **Complete Documentation**:
- 📖 [Migration Guide](.kiro/specs/hashpack-wallet-v2-migration/MIGRATION_V2.md) - Comprehensive v1 to v2 migration guide
- 🔧 [Troubleshooting](.kiro/specs/hashpack-wallet-v2-migration/TROUBLESHOOTING.md) - Common issues and solutions
- 📊 [v1 vs v2 Comparison](.kiro/specs/hashpack-wallet-v2-migration/V1_VS_V2_COMPARISON.md) - Detailed feature comparison
- ⚡ [Quick Reference](.kiro/specs/hashpack-wallet-v2-migration/QUICK_REFERENCE.md) - API quick reference

### Key Improvements Over v1

| Aspect | v1.5.1 | v2.x |
|--------|--------|------|
| **Architecture** | `DAppConnector` | `HederaProvider` + `HederaAdapter` |
| **Namespaces** | Hedera only | Hedera + EVM (dual) |
| **Node IDs** | Manual configuration | Automatic |
| **Sessions** | Basic | Advanced with events |
| **WalletConnect** | v1 (deprecated) | v2 (current) |

### Example: Send HBAR Transaction

```typescript
import { TransferTransaction, Hbar, AccountId } from '@hashgraph/sdk';
import { useWallet } from '@/hooks/useWallet';

async function sendHbar(recipientId: string, amount: number) {
  const { signAndExecuteTransaction, accountId } = useWallet();

  // Create transaction (no node IDs needed!)
  const transaction = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-amount))
    .addHbarTransfer(AccountId.fromString(recipientId), new Hbar(amount));

  try {
    const receipt = await signAndExecuteTransaction(transaction);
    console.log('Transaction successful:', receipt.status.toString());
    return receipt;
  } catch (error) {
    if (error.code === 'TRANSACTION_REJECTED') {
      console.log('User cancelled transaction');
    } else {
      console.error('Transaction failed:', error.message);
    }
    throw error;
  }
}
```

### Migrating from v1?

If you're upgrading from v1.5.1, the migration is straightforward:

1. Update dependencies
2. Replace `DAppConnector` with `HederaProvider` + `HederaAdapter`
3. Remove manual `setNodeAccountIds()` calls
4. Update error handling with new error codes
5. Test thoroughly

See the [Migration Guide](.kiro/specs/hashpack-wallet-v2-migration/MIGRATION_V2.md) for detailed step-by-step instructions.

## 🧪 Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/__tests__/auth/auth-system.test.ts
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📊 Project Status

**Current Version**: v0.1.0 (MVP)

### Roadmap

- ✅ Phase 1: Core Platform (Q4 2025)
  - User authentication & profiles
  - Crop evaluation system
  - Tokenization on Hedera HTS
  - Loan management
  
- 🚧 Phase 2: Mobile App (Q1 2026)
  - React Native mobile app
  - Offline functionality
  - SMS notifications
  
- 📋 Phase 3: Scale & Partnerships (Q2 2026)
  - Cooperative partnerships
  - Lender marketplace
  - Insurance integration

## 🌍 Impact Metrics

- **Farmers Onboarded**: 50+ (Pilot)
- **Total Loans Disbursed**: $25,000+ (Testnet)
- **Average Loan Size**: $500
- **Repayment Rate**: 95%+
- **Time to Disbursement**: < 5 minutes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Ryan Sabowa** - Founder & CEO

- Email: ryan@mazaochain.africa
- Twitter: [@MazaoChain](https://twitter.com/MazaoChain)
- Website: [mazaochain.africa](https://mazaochain.africa) (Coming Soon)

### Community & Support

- 📖 [Documentation](https://docs.mazaochain.africa)
- 🐛 [Issue Tracker](https://github.com/sabowaryan/mazaochain/issues)
- 💬 [Discord Community](https://discord.gg/mazaochain)

## 🙏 Acknowledgments

- **Hedera Hashgraph** for the sustainable blockchain infrastructure
- **Exponential Science Foundation** and **The Hashgraph Association** for support
- Our pilot farmers in the **Democratic Republic of Congo**
- The open-source community for invaluable tools and libraries

---

**Built with  in Africa, for Africa**

*MazaoChain - Empowering farmers through blockchain technology*
