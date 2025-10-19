# Visual Testing Guide - HashPack Wallet v2

## 🎨 Visual Test Flow Diagrams

This guide provides visual representations of the testing flows to help you understand what to expect during manual testing.

## 📊 Test Flow Overview

```mermaid
graph TB
    Start[Start Testing] --> Setup[Setup Environment]
    Setup --> Script[Load Helper Script]
    Script --> Health[Run Health Check]
    Health --> Choose{Choose Test Type}
    
    Choose -->|Quick| Quick[6 Essential Tests]
    Choose -->|Standard| Standard[19 Full Tests]
    Choose -->|Comprehensive| Comp[Full QA + Browsers]
    
    Quick --> Results[Record Results]
    Standard --> Results
    Comp --> Results
    
    Results --> Pass{All Pass?}
    Pass -->|Yes| Report[Generate Report]
    Pass -->|No| Fix[Fix Issues]
    Fix --> Retest[Re-run Failed Tests]
    Retest --> Pass
    
    Report --> Signoff[Sign-off]
    Signoff --> Done[Complete]
```

## 🔌 Connection Test Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant HashPack
    participant WalletConnect
    
    User->>App: Click "Connect Wallet"
    App->>WalletConnect: Initialize connection
    WalletConnect->>HashPack: Send connection request
    HashPack->>User: Show approval popup
    User->>HashPack: Approve connection
    HashPack->>WalletConnect: Send approval
    WalletConnect->>App: Connection established
    App->>App: Store session
    App->>User: Show "Connected" status
    App->>HashPack: Request account info
    HashPack->>App: Return account details
    App->>User: Display account ID & balance
```

## 🔄 Session Restoration Flow

```mermaid
graph LR
    A[Page Load] --> B{Session in Storage?}
    B -->|No| C[Show Connect Button]
    B -->|Yes| D{Session Valid?}
    D -->|No| E[Clear Session]
    E --> C
    D -->|Yes| F[Restore Session]
    F --> G[Verify with WalletConnect]
    G --> H{Verification OK?}
    H -->|No| E
    H -->|Yes| I[Show Connected State]
    I --> J[Fetch Account Data]
    J --> K[Display to User]
```

## 🎯 Test Execution States

```mermaid
stateDiagram-v2
    [*] --> NotStarted: Initial State
    NotStarted --> InProgress: Start Test
    InProgress --> Passed: Test Succeeds
    InProgress --> Failed: Test Fails
    Failed --> InProgress: Retry
    Passed --> [*]: Complete
    Failed --> Blocked: Critical Issue
    Blocked --> [*]: Needs Fix
```

## 📱 Connection Methods

```mermaid
graph TB
    User[User Wants to Connect]
    User --> Method{Connection Method}
    
    Method -->|Desktop| Extension[HashPack Extension]
    Method -->|Mobile| Mobile[HashPack Mobile App]
    
    Extension --> ExtFlow[Direct Extension Connection]
    ExtFlow --> ExtSuccess[Instant Connection]
    
    Mobile --> QR[Scan QR Code]
    QR --> WC[WalletConnect Bridge]
    WC --> MobileSuccess[Mobile Connection]
    
    ExtSuccess --> Connected[Connected State]
    MobileSuccess --> Connected
    
    Connected --> Session[Session Stored]
    Session --> Active[Active Connection]
```

## 🔐 Transaction Signing Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Service
    participant HashPack
    participant Network
    
    User->>App: Initiate Transaction
    App->>Service: Create Transaction
    Service->>Service: Serialize Transaction
    Service->>HashPack: Request Signature
    HashPack->>User: Show Transaction Details
    
    alt User Approves
        User->>HashPack: Approve
        HashPack->>Service: Return Signed Transaction
        Service->>Network: Submit Transaction
        Network->>Service: Transaction Receipt
        Service->>App: Success
        App->>User: Show Success Message
    else User Rejects
        User->>HashPack: Reject
        HashPack->>Service: Rejection Error
        Service->>App: Handle Rejection
        App->>User: Show Cancellation Message
    end
```

## 🎭 Event Handling Flow

```mermaid
graph TB
    Events[Wallet Events] --> Account[Account Changed]
    Events --> Network[Network Changed]
    Events --> Session[Session Events]
    
    Account --> DetectA[Detect Change]
    DetectA --> UpdateA[Update UI]
    UpdateA --> FetchA[Fetch New Data]
    
    Network --> DetectN[Detect Change]
    DetectN --> UpdateN[Update Network Display]
    UpdateN --> ValidateN[Validate Compatibility]
    
    Session --> Create[Session Created]
    Session --> Update[Session Updated]
    Session --> Delete[Session Deleted]
    
    Create --> StoreS[Store Session]
    Update --> RefreshS[Refresh Session]
    Delete --> ClearS[Clear Session]
    
    FetchA --> Display[Update Display]
    ValidateN --> Display
    StoreS --> Display
    RefreshS --> Display
    ClearS --> Display
```

## ⚠️ Error Handling Flow

```mermaid
graph TB
    Error[Error Occurs] --> Type{Error Type}
    
    Type -->|Connection| ConnErr[Connection Error]
    Type -->|Transaction| TxErr[Transaction Error]
    Type -->|Session| SessErr[Session Error]
    Type -->|Network| NetErr[Network Error]
    
    ConnErr --> Timeout{Timeout?}
    Timeout -->|Yes| ShowTimeout[Show Timeout Message]
    Timeout -->|No| ShowConn[Show Connection Error]
    
    TxErr --> Rejected{Rejected?}
    Rejected -->|Yes| ShowReject[Show Rejection Message]
    Rejected -->|No| ShowTxErr[Show Transaction Error]
    
    SessErr --> Expired{Expired?}
    Expired -->|Yes| Reconnect[Prompt Reconnect]
    Expired -->|No| ShowSess[Show Session Error]
    
    NetErr --> ShowNet[Show Network Error]
    
    ShowTimeout --> Retry[Allow Retry]
    ShowConn --> Retry
    ShowReject --> Retry
    ShowTxErr --> Retry
    Reconnect --> Retry
    ShowSess --> Retry
    ShowNet --> Retry
```

## 📊 Performance Testing Flow

```mermaid
graph LR
    Start[Start Timer] --> Action[Perform Action]
    Action --> Wait[Wait for Completion]
    Wait --> Stop[Stop Timer]
    Stop --> Calculate[Calculate Duration]
    Calculate --> Compare{Compare to Target}
    Compare -->|Pass| Good[✅ Good Performance]
    Compare -->|Fail| Slow[⚠️ Slow Performance]
    Good --> Record[Record Metric]
    Slow --> Record
    Record --> Report[Add to Report]
```

## 🧪 Test Status Visualization

### Quick Validation (6 Tests)
```
┌─────────────────────────────────────┐
│ Test 1: Connect Wallet         [ ] │
│ Test 3: Session Restore        [ ] │
│ Test 5: Account Change         [ ] │
│ Test 8: Disconnect             [ ] │
│ Test 9: HBAR Balance           [ ] │
│ Test 11: Sign Transaction      [ ] │
└─────────────────────────────────────┘
Progress: ▓▓▓▓▓▓░░░░░░░░░░░░░░ 30%
```

### Standard Testing (19 Tests)
```
┌─────────────────────────────────────┐
│ Connection Tests (4)      ▓▓▓▓ 100% │
│ Event Tests (2)           ▓▓░░  50% │
│ Disconnection Tests (2)   ░░░░   0% │
│ Balance Tests (2)         ░░░░   0% │
│ Transaction Tests (3)     ░░░░   0% │
│ Error Tests (4)           ░░░░   0% │
│ Performance Tests (2)     ░░░░   0% │
└─────────────────────────────────────┘
Overall Progress: ▓▓▓░░░░░░░░░░░ 21%
```

## 🎯 Expected UI States

### 1. Disconnected State
```
┌─────────────────────────────────┐
│  🔌 Wallet Not Connected        │
│                                 │
│  [Connect Wallet]               │
└─────────────────────────────────┘
```

### 2. Connecting State
```
┌─────────────────────────────────┐
│  ⏳ Connecting to HashPack...   │
│                                 │
│  Please approve in your wallet  │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘
```

### 3. Connected State
```
┌─────────────────────────────────┐
│  ✅ Connected                    │
│                                 │
│  Account: 0.0.123456            │
│  Network: Testnet               │
│  Balance: 10.5 HBAR             │
│                                 │
│  [Disconnect]                   │
└─────────────────────────────────┘
```

### 4. Error State
```
┌─────────────────────────────────┐
│  ❌ Connection Failed            │
│                                 │
│  Connection timeout. Please     │
│  try again.                     │
│                                 │
│  [Retry]                        │
└─────────────────────────────────┘
```

## 📈 Performance Metrics Visualization

```
Connection Speed Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:     ▓▓▓▓▓ 3s
Good:       ▓▓▓▓▓▓▓▓ 5s
Acceptable: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 10s
Your Time:  ▓▓▓▓▓▓ 4.2s ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Balance Fetch Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:     ▓▓▓ 2s
Good:       ▓▓▓▓▓ 3s
Acceptable: ▓▓▓▓▓▓▓▓ 5s
Your Time:  ▓▓▓▓ 2.8s ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔍 Browser DevTools View

### Console Output Example
```
🧪 HashPack Wallet v2 Testing Helper Loaded
Available commands:
  - checkSession()
  - checkStorage()
  - clearSession()
  - monitorEvents()
  - getTestReport()

🏥 Wallet Health Check
┌─────────────────────────┬────────┐
│ Check                   │ Status │
├─────────────────────────┼────────┤
│ WalletConnect Session   │ ✅     │
│ Session Not Expired     │ ✅     │
│ Hedera Namespace        │ ✅     │
│ Account ID Present      │ ✅     │
└─────────────────────────┴────────┘
✅ All checks passed!
```

### Network Tab View
```
Name                          Status  Type        Size    Time
────────────────────────────────────────────────────────────
wc@2:client:0.3              200     xhr         2.1 KB  45ms
hedera_signTransaction       200     websocket   1.5 KB  120ms
mirror.hedera.com/balance    200     fetch       856 B   230ms
```

### Application Tab (Storage)
```
localStorage
├── wc@2:client:0.3
│   └── sessions
│       └── [topic]
│           ├── expiry: 1697123456
│           ├── namespaces
│           │   └── hedera
│           │       ├── accounts: ["hedera:testnet:0.0.123456"]
│           │       ├── methods: ["hedera_signTransaction"]
│           │       └── events: ["chainChanged"]
│           └── acknowledged: true
```

## 🎬 Testing Session Timeline

```
0:00  ┌─ Start Testing Session
      │
0:05  ├─ Environment Setup Complete
      │  └─ Helper script loaded
      │
0:10  ├─ Test 1: First Connection
      │  └─ ✅ Passed (4.2s)
      │
0:15  ├─ Test 2: Mobile Connection
      │  └─ ⏭️ Skipped (no mobile device)
      │
0:20  ├─ Test 3: Session Restore
      │  └─ ✅ Passed (1.8s)
      │
0:25  ├─ Test 4: Browser Restart
      │  └─ ✅ Passed (2.1s)
      │
...   │
      │
2:45  ├─ Test 19: Performance
      │  └─ ✅ Passed
      │
2:50  ├─ Generate Report
      │  └─ Report saved
      │
3:00  └─ Testing Complete
         └─ 17/19 Passed (89%)
```

## 📋 Checklist Progress Visualization

```
Pre-Test Setup
[✓] HashPack extension installed
[✓] Test account configured
[✓] Application running
[✓] DevTools open
[✓] Helper script loaded

Core Tests
[✓] Connection Tests        ████████████████████ 100%
[✓] Event Tests            ████████████████████ 100%
[✓] Disconnection Tests    ████████████████████ 100%
[✓] Balance Tests          ████████████████████ 100%
[✓] Transaction Tests      ████████████████████ 100%
[✓] Error Tests            ████████████████████ 100%
[✓] Performance Tests      ████████████████████ 100%

Browser Compatibility
[✓] Chrome                 ████████████████████ 100%
[✓] Firefox                ████████████████████ 100%
[✓] Edge                   ████████████████████ 100%
[ ] Brave                  ░░░░░░░░░░░░░░░░░░░░   0%
[ ] Safari                 ░░░░░░░░░░░░░░░░░░░░   0%

Overall Progress: ████████████████░░░░ 80%
```

## 🎯 Success Indicators

### ✅ Good Signs
- Connection completes in < 5 seconds
- No console errors
- Session persists after reload
- Balance displays correctly
- Events are detected
- Transactions can be signed

### ⚠️ Warning Signs
- Connection takes > 5 seconds
- Console warnings present
- Session occasionally lost
- Balance fetch slow
- Events sometimes missed

### ❌ Critical Issues
- Connection fails consistently
- Console errors present
- Session never persists
- Balance never loads
- Events not detected
- Transactions fail

## 📊 Final Report Visualization

```
╔═══════════════════════════════════════════════╗
║     HASHPACK WALLET V2 TEST REPORT            ║
╠═══════════════════════════════════════════════╣
║ Date: 2025-10-13                              ║
║ Tester: [Your Name]                           ║
║ Environment: Local Development                ║
╠═══════════════════════════════════════════════╣
║ RESULTS                                       ║
║ ─────────────────────────────────────────     ║
║ Total Tests:        19                        ║
║ Passed:             17  ████████████████░░ 89%║
║ Failed:              2  ██░░░░░░░░░░░░░░░░ 11%║
║ Skipped:             0                        ║
╠═══════════════════════════════════════════════╣
║ PERFORMANCE                                   ║
║ ─────────────────────────────────────────     ║
║ Connection:      4.2s  ✅ (target: < 5s)     ║
║ Balance Fetch:   2.8s  ✅ (target: < 3s)     ║
║ Transaction:     8.1s  ✅ (target: < 10s)    ║
╠═══════════════════════════════════════════════╣
║ STATUS: ⚠️ NEEDS FIXES                        ║
╚═══════════════════════════════════════════════╝
```

---

**This visual guide complements the detailed testing documentation and provides a quick reference for understanding test flows and expected outcomes.**
