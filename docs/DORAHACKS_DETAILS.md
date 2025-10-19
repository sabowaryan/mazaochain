# DoraHacks BUIDL Details - MazaoChain

## 🎯 Project Details

### Project Name

```
MazaoChain
```

### Project Description

**Short Description (200 characters):**

```
MazaoChain enables African farmers to tokenize future harvests as collateral for instant loans on Hedera. DeFi for agriculture with fast, low-cost transactions.
```

**Full Description:**

MazaoChain is a decentralized lending platform solving financial exclusion for African smallholder farmers. We use Hedera's blockchain to tokenize future harvests as collateral, enabling farmers to access instant loans in USDC at fair rates (1-2% monthly vs 10-20% informal lenders).

**Current Status:**

- ✅ MVP developed on Hedera testnet
- ✅ Smart contracts deployed and tested
- ✅ Complete frontend interface
- 🚧 Preparing for pilot launch in DRC
- 🚧 Final user testing phase

---

## 🔗 Links & Resources

### Live Demo

```
https://mazaochain.vercel.app
```

### GitHub Repository

```
https://github.com/sabowaryan/mazaochain
```

### Demo Video

```
[Link to be added after video production]
```

### Smart Contracts (Testnet)

```
MazaoTokenFactory: 0.0.xxxx
LoanManager: 0.0.xxxx
USDC Test: 0.0.xxxx
```

---

## 🏷️ Categorization

### Primary Category

```
DeFi (Decentralized Finance)
```

### Secondary Categories

```
- Real World Assets (RWA)
- Financial Inclusion
- Agricultural Technology
- Hedera Ecosystem
```

### Project Track

```
Onchain Finance & Real-World Assets (RWA)
```

### Blockchain/Network

```
Hedera Hashgraph
```

---

## 👥 Team Information

### Team Name

```
MazaoChain Team
```

### Team Members

```
Ryan Sabowa (Founder & CEO)
- Full-stack developer & blockchain specialist
- Deep understanding of African agricultural challenges
- 6+ months development on MazaoChain
- Contact: ryan@sabowa.com
```

### Team Location

```
Kinshasa, Democratic Republic of Congo (DRC)
```

---

## 🚀 Development Status

### Current Stage

```
MVP Ready for Testing
```

### Technical Implementation

```
✅ Hedera Token Service (HTS) for MazaoTokens
✅ Hedera Consensus Service (HCS) for audit trail
✅ Smart contracts for loan automation
✅ HashPack wallet integration
✅ Multi-language support (French/Lingala)
✅ Mobile-responsive design
✅ Supabase backend with PostgreSQL
```

---

## 🧪 Demo Instructions

### Test Accounts Provided

**👨‍🌾 Agriculteur**

```
Email: mazao.farmer.demo@gmail.com
Mot de passe: FarmerDemo123!
Profil: Pierre Kasongo, 3.2 hectares à Kinshasa
```

**🏢 Coopérative**

```
Email: mazao.cooperative.demo@gmail.com  
Mot de passe: CoopDemo123!
Profil: COPAKI Kinshasa, 1 membre
```

**💰 Prêteur**

```
Email: mazao.lender.demo@gmail.com
Mot de passe: LenderDemo123!
Profil: FinanceRDC, 75,000 USDC disponibles
```

### Recommended Test Flow (8-10 minutes)

**1. Farmer Experience (4 minutes)**

- Login as farmer (`mazao.farmer.demo@gmail.com`)
- Complete crop evaluation for coffee/manioc
- Tokenize harvest value (2,000-5,000$ range)
- Request 500-800 USDC loan
- Approve transaction in HashPack

**2. Cooperative Validation (2 minutes)**

- Login as cooperative (`mazao.cooperative.demo@gmail.com`)
- Review farmer applications
- Approve/reject loan requests
- Monitor portfolio

**3. Lender View (2 minutes)**

- Login as lender (`mazao.lender.demo@gmail.com`)
- View active loans portfolio
- Check collateral ratios
- Monitor repayment status

### Key Features to Test

```
✅ User registration and profile creation
✅ Crop valuation algorithm
✅ HTS tokenization process
✅ Collateralized loan requests
✅ HashPack wallet integration
✅ Multi-role dashboard (farmer/cooperative/lender)
✅ Transaction history and audit trail
```

### Technical Requirements

```
🌐 Network: Hedera Testnet
📱 Wallet: HashPack (mobile or extension)
🔗 Browser: Chrome/Firefox latest
📶 Internet: Stable connection required
```

---

## 💡 Innovation Highlights

### Technical Innovation

- First agricultural RWA tokenization platform on Hedera
- Micro-transaction capability ($0.0001 fees)
- Multi-role architecture for ecosystem collaboration
- Mobile-first design for rural users

### Social Impact

- Financial inclusion for unbanked farmers
- Escape from predatory lending cycles
- Transparent and fair financial services
- Agricultural productivity enhancement

### Market Potential

```
Target: 50M African smallholder farmers
Addressable market: $15B+ annual loan volume
Current focus: DRC pilot expansion
Technology: Scalable across Francophone Africa
```

---

## 🎯 Hackathon Alignment

### Why MazaoChain Fits Perfectly

```
✅ Direct match with "Onchain Finance & RWA" track
✅ Innovative use of Hedera's low-fee infrastructure
✅ Real-world problem solving with blockchain
✅ African-led solution for African challenges
✅ Sustainable and scalable business model
```

### Unique Value Proposition

```
Traditional Finance: Requires land titles, 3+ month process
Informal Lenders: 10-20% monthly interest, predatory
MazaoChain: No land titles needed, 5-minute loans, 1-2% monthly interest
```

---

## 📊 Technical Architecture

### System Components

```
Frontend Layer:
├── Next.js 14 (App Router)
├── Tailwind CSS
├── TypeScript
└── HashPack SDK

Backend Layer:
├── Next.js API Routes
├── Supabase (PostgreSQL)
├── Redis (Caching)
└── IPFS (Document Storage)

Blockchain Layer:
├── Hedera Token Service (HTS)
├── onsensvice (HCS)
├── Smart Contracts (Solidity)
└── HashPack Wallet Inn
```

### Data Flow

```
1. Farmer submits tion
   ↓
2. Cooperative validatesroves
   ↓
3. MazaoTokens minted via HTS
   ↓
4. er requests loan with tokens as collate
   ↓
5. Smart contract escrows collateral
   ↓
6. USDC disbursed to farmer's wallet
   ↓
7. Repayment triggers collateral re
```

---

## 🔐 Security Features

### Smart Contract Security

```
✅ Over-collateralization (200% minimum)
✅ Automated escrow management
✅ Time-locked transactions
✅ Multi-signature approvals for large amounts
✅ Emergency pause functionality
```

### User Security

```
✅ Supabase Row Level Security (RLS)
✅ JWT-based authentication
✅ Encrypted sensitive data
✅ Audit trail on Hedera Consensus Service
✅ HashPack wallet integration (non-custodial)
```

---

## 📈 Business Model

### Revenue Streams

```
1. Platform Fee: 0.5% on loan disbursement
2. Service Fee: 0.3% on repayments
3. Premium Features: Advanced analytics for lenders
4. Partnership Fees: Cooperative onboarding
```

### Unit Economics

```
Average Loan: $500 USDC
Platform Fee: $2.50 per loan
Monthly Volume Target: 1,000 loans
Projected Monthly Revenue: $2,500
```

### Growth Strategy

```
Phase 1 (Q1 2026): DRC pilot - 100 farmers
Phase 2 (Q2 2026): Scale to 1,000 farmers
Phase 3 (Q3 2026): Expand to 3 African countries
Phase 4 (Q4 2026): 10,000+ farmers, institutional lenders
```

--Impact Metrics

### Target Impact (Year 1)

```
👨‍🌾 Farmers Serv: 1,000+
💰 Loans Disbursed: $500,000+st Rate Redu (from 15% to 3% monthly)
⏱️ Time Savis: 99% (from 90 days to 5 minutes)
🌱 Crop Productivity: +25% (betternputs)
```

### Social Impact

```
✅ Financial inclusion for unbanked farmers
✅ Escape from predatory lending
✅ Increased agroductivity
✅ Women farmer empowerment
✅ Rural economic development
```

---

## 🛠️ Technical Challenges Solved
allenge 1: Low Connectivity

**Solution:** ProgressiveApp (PWA) with offline functionality

```
- Service workers for offline caching
- Background sync for transactions
- SMS fallor critical notifications
```

### Challenge 2: Low Smartphone Penetration

**Solution:** USSD integration (planned)

```
- Basic fure phones support
- SMS-based loan requests
- Voice response syste
```

##e 3: Language Barriers

**Solution:** Multi-language support

```
- French (official language)
- Lingala (local language)
- English (international)
- Simple, icon-based U`

### Challenge 4: Trust & Education

**Solution:** Cooperative partnership model

```
- Locaratives validate farmers
- Community-based onboarding
- In-person training sessions
- Transpare blockchain records
```

---

## 🎥 Demo Walkthrough Script

### Introduction (30 seconds)

```
"MazaoChain solves a $15B problem: African farmers can't access credit.
We tokenize their future harvests on Hedera to unlock instant loans."
```

### Farmer Journey (2 minutes)

```
1. Show farmer dashboard
2. Submit crop evaluation (manioc, 3 hectares)
3. Receive MazaoTokens (12,000 tokens)
4. Request $500 USDC loan
5. Approve in HashPack
6. Receive USDC in 5 minutes
```

### Cooperative Role (1 minute)

```
1. Show cooperative dashboard
2. Review pending evaluations
3. Approve farmer's crop valuation
4. Monitor portfolio health
```

### Lender View (1 minute)

```
1. Show lender dashboard
2. View active loans
3. Check collateral ratios (200%+)
4. Monitor repayment schedule
```

### Technical Highlights (30 seconds)

```
- Hedera HTS for tokenization
- $0.0001 transaction fees
- 3-5 second finality
- Immutable audit trail
```

---

## 📞 Contact & Support

### Project Lead

```
Ryan Sabowa
Email: ryan@sabowa.com
Twitter: @MazaoChain
LinkedIn: linkedin.com/in/ryansabowa
```

### Project Links

```
Website: https://mazaochain.africa (Coming Soon)
Demo: https://mazaochain.vercel.app
GitHub: https://github.com/sabowaryan/mazaochain
Discord: https://discord.gg/mazaochain
```

### Press & Media

```
For press inquiries: press@mazaochain.africa
For partnerships: partnerships@mazaochain.africa
For technical questions: dev@mazaochain.africa
```

---

## 🏆 Awards & Recognition

```
🎯 DoraHacks BUIDL Hackathon Participant
🌍 Exponential Science Foundation Grantee
🔗 Hedera Hashgraph Ecosystem Project
🌱 African Innovation Showcase Featured
```

---

## 📝 Additional Resources

### Documentation

```
📖 Technical Documentation: docs.mazaochain.africa
🎓 User Guides: help.mazaochain.africa
💻 API Documentation: api.mazaochain.africa
🔧 Developer Portal: dev.mazaochain.africa
```

### Community

```
💬 Discord: Community discussions and support
🐦 Twitter: Updates and announcements
📺 YouTube: Video tutorials and demos
📰 Blog: Technical articles and case studies
```

---

**Built with  in Africa, for Africa**

*MazaoChain - Empowering farmers through blockchain technology*
