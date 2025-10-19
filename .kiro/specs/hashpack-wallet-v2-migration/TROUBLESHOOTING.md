# HashPack Wallet v2 - Troubleshooting Guide

This guide covers common issues you might encounter when using HashPack Wallet Connect v2 and how to resolve them.

---

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Session Issues](#session-issues)
3. [Transaction Issues](#transaction-issues)
4. [Balance Issues](#balance-issues)
5. [Environment Issues](#environment-issues)
6. [Network Issues](#network-issues)
7. [Debug Tools](#debug-tools)

---

## Connection Issues

### Issue: "Invalid Project ID" Error

**Symptoms:**
- Error message: "Invalid Project ID"
- Connection fails immediately
- No HashPack modal appears

**Cause:** Missing or invalid WalletConnect Project ID

**Solution:**

1. Get a Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
   ```
3. Restart your development server
4. Clear browser cache and localStorage

**Verification:**
```typescript
console.log('Project ID:', process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
// Should output your project ID, not undefined
```

---

### Issue: Connection Timeout

**Symptoms:**
- Connection request times out after 60 seconds
- HashPack doesn't open or show connection request
- Error: "CONNECTION_TIMEOUT"

**Possible Causes:**
1. HashPack wallet not installed or not running
2. User didn't approve connection in time
3. Network connectivity issues
4. WalletConnect relay server issues

**Solutions:**

**Solution 1: Check HashPack Installation**
```typescript
// Add detection for HashPack
function isHashPackInstalled(): boolean {
  return typeof window !== 'undefined' && 
         window.hashpack !== undefined;
}

if (!isHashPackInstalled()) {
  alert('Please install HashPack wallet extension');
  window.open('https://www.hashpack.app/download', '_blank');
}
```

**Solution 2: Add Retry Logic**
```typescript
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await walletService.connectWallet();
    } catch (error) {
      if (error.code === 'CONNECTION_TIMEOUT') {
        if (i < maxRetries - 1) {
          console.log(`Retry ${i + 1}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      }
      throw error;
    }
  }
}
```

**Solution 3: Increase Timeout**
```typescript
// In HederaWalletService
private readonly CONNECTION_TIMEOUT = 120000; // 2 minutes instead of 1

async connectWallet(namespace = 'hedera') {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('CONNECTION_TIMEOUT')), 
               this.CONNECTION_TIMEOUT);
  });
  
  return Promise.race([
    this.performConnection(namespace),
    timeoutPromise
  ]);
}
```

---

### Issue: Connection Rejected by User

**Symptoms:**
- User clicks "Reject" in HashPack
- Error: "CONNECTION_REJECTED"
- No connection established

**Cause:** User declined the connection request

**Solution:**

This is expected behavior. Handle gracefully:

```typescript
try {
  await walletService.connectWallet();
} catch (error) {
  if (error.code === 'CONNECTION_REJECTED') {
    // Don't show error, just inform user
    showMessage('Connection cancelled. Click "Connect" to try again.');
  } else {
    // Show error for other issues
    showError(error.message);
  }
}
```

**Best Practice:**
- Don't treat rejection as an error
- Allow user to retry easily
- Don't auto-retry (respect user's choice)

---

### Issue: Multiple Connection Modals

**Symptoms:**
- Multiple HashPack connection requests appear
- Multiple sessions created
- Duplicate connections in localStorage

**Cause:** Multiple simultaneous connection attempts

**Solution:**

**Add Connection Lock:**
```typescript
class HederaWalletService {
  private isConnecting = false;

  async connectWallet(namespace = 'hedera') {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    // Check if already connected
    if (this.isConnected()) {
      return this.getConnectionState();
    }

    this.isConnecting = true;
    try {
      const connection = await this.performConnection(namespace);
      return connection;
    } finally {
      this.isConnecting = false;
    }
  }
}
```

**In React:**
```typescript
function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (isConnecting) return; // Prevent double-click
    
    setIsConnecting(true);
    try {
      await walletService.connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  return { connectWallet, isConnecting };
}
```

---

## Session Issues

### Issue: Session Not Restoring After Page Reload

**Symptoms:**
- Page reload requires new connection
- Session exists in localStorage but not restored
- `restoreExistingSession()` returns null

**Cause:** Timing issue with WalletConnect initialization

**Solution:**

**Add Initialization Delay:**
```typescript
async function initializeWallet() {
  await walletService.initialize();
  
  // Wait for WalletConnect to sync with localStorage
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const session = await walletService.restoreExistingSession();
  return session;
}
```

**Check Session Validity:**
```typescript
async restoreExistingSession(): Promise<WalletConnection | null> {
  if (!this.hederaProvider) {
    await this.initialize();
  }

  const sessions = this.hederaProvider.getSessions();
  
  if (sessions.length === 0) {
    return null;
  }

  // Check if session is expired
  const session = sessions[0];
  const now = Date.now() / 1000;
  
  if (session.expiry < now) {
    console.log('Session expired, cleaning up');
    await this.disconnectWallet();
    return null;
  }

  // Restore connection state
  return this.buildConnectionState(session);
}
```

---

### Issue: Session Expired

**Symptoms:**
- Error: "SESSION_EXPIRED"
- Operations fail with session error
- User was connected but now isn't

**Cause:** WalletConnect sessions expire after 7 days by default

**Solution:**

**Auto-Reconnect on Expiry:**
```typescript
private handleSessionDelete(event: SessionDelete): void {
  console.log('Session deleted:', event);
  
  // Clear connection state
  this.connectionState = null;
  
  // Notify user
  this.emit('session_expired', {
    message: 'Your session has expired. Please reconnect.',
    canReconnect: true
  });
}

// In your UI
walletService.on('session_expired', (event) => {
  showNotification({
    message: event.message,
    action: {
      label: 'Reconnect',
      onClick: () => walletService.connectWallet()
    }
  });
});
```

**Check Session Before Operations:**
```typescript
async signTransaction(transaction: Transaction): Promise<Transaction> {
  // Verify session is still valid
  if (!this.isSessionValid()) {
    throw new WalletError(
      'Session expired. Please reconnect.',
      'SESSION_EXPIRED'
    );
  }

  // Proceed with signing
  return this.performSigning(transaction);
}

private isSessionValid(): boolean {
  const sessions = this.hederaProvider?.getSessions() || [];
  if (sessions.length === 0) return false;
  
  const session = sessions[0];
  const now = Date.now() / 1000;
  return session.expiry > now;
}
```

---

### Issue: Session Events Not Firing

**Symptoms:**
- `session_update` events not received
- `session_delete` events not received
- Account/network changes not detected

**Cause:** Event listeners not set up properly

**Solution:**

**Ensure Listeners Before Connection:**
```typescript
async initialize(): Promise<void> {
  this.hederaProvider = await HederaProvider.init({...});
  
  // MUST set up listeners immediately after init
  this.setupSessionListeners();
  
  // Create adapters after listeners
  this.nativeAdapter = new HederaAdapter({...});
}

private setupSessionListeners(): void {
  if (!this.hederaProvider) {
    console.error('Cannot setup listeners: provider not initialized');
    return;
  }

  // Use arrow functions to preserve 'this' context
  this.hederaProvider.on('session_event', (event) => {
    this.handleSessionEvent(event);
  });

  this.hederaProvider.on('session_update', (event) => {
    this.handleSessionUpdate(event);
  });

  this.hederaProvider.on('session_delete', (event) => {
    this.handleSessionDelete(event);
  });

  console.log('Session listeners set up');
}
```

**Verify Listeners:**
```typescript
// Add debug logging
private handleSessionEvent(event: any): void {
  console.log('[SessionEvent]', event);
  // Your handling logic
}
```

---

## Transaction Issues

### Issue: Transaction Fails with Node ID Error

**Symptoms:**
- Error: "Invalid node account ID"
- Transaction rejected by network
- Error mentions node configuration

**Cause:** Manual node ID configuration (v1 pattern) in v2

**Solution:**

**Remove Manual Node IDs:**
```typescript
// ❌ DON'T DO THIS (v1 pattern)
const transaction = new TransferTransaction()
  .setNodeAccountIds([new AccountId(3)])
  .addHbarTransfer(sender, amount);

// ✅ DO THIS (v2 pattern)
const transaction = new TransferTransaction()
  .addHbarTransfer(sender, amount);
  // Node IDs handled automatically by wallet
```

**Search and Remove:**
```bash
# Find all instances of setNodeAccountIds
grep -r "setNodeAccountIds" src/

# Remove them all - they're not needed in v2
```

---

### Issue: Transaction Rejected by User

**Symptoms:**
- User clicks "Reject" in HashPack
- Error: "TRANSACTION_REJECTED"
- Transaction not executed

**Cause:** User declined the transaction

**Solution:**

Handle gracefully without alarming the user:

```typescript
async function sendTransaction(transaction: Transaction) {
  try {
    const signed = await walletService.signTransaction(transaction);
    const receipt = await signed.execute(client);
    
    showSuccess('Transaction successful!');
    return receipt;
    
  } catch (error) {
    if (error.code === 'TRANSACTION_REJECTED') {
      // User cancelled - not an error
      showInfo('Transaction cancelled');
    } else if (error.code === 'INSUFFICIENT_BALANCE') {
      showError('Insufficient balance for transaction');
    } else {
      showError('Transaction failed: ' + error.message);
    }
    throw error;
  }
}
```

---

### Issue: Transaction Serialization Error

**Symptoms:**
- Error: "Cannot serialize transaction"
- Error: "Invalid transaction bytes"
- Transaction fails before reaching wallet

**Cause:** Transaction not properly constructed

**Solution:**

**Ensure Transaction is Complete:**
```typescript
async signTransaction(transaction: Transaction): Promise<Transaction> {
  // Freeze transaction before serialization
  if (!transaction.isFrozen()) {
    transaction.freeze();
  }

  // Serialize to bytes
  const txBytes = transaction.toBytes();
  
  // Convert to base64 for transmission
  const base64Tx = Buffer.from(txBytes).toString('base64');
  
  // Send to wallet
  const result = await this.nativeAdapter.request({
    method: 'hedera_signTransaction',
    params: {
      transactionBytes: base64Tx,
      signerAccountId: this.getAccountId()
    }
  });

  // Deserialize signed transaction
  return Transaction.fromBytes(
    Buffer.from(result.signedTransaction, 'base64')
  );
}
```

---

## Balance Issues

### Issue: Balance Not Updating

**Symptoms:**
- Balance shows old value
- Recent transactions not reflected
- Balance stuck at initial value

**Cause:** Mirror Node delay (5-10 seconds) or no refresh mechanism

**Solution:**

**Add Polling:**
```typescript
useEffect(() => {
  if (!isConnected) return;

  // Initial fetch
  fetchBalance();

  // Poll every 10 seconds
  const interval = setInterval(fetchBalance, 10000);

  return () => clearInterval(interval);
}, [isConnected]);

async function fetchBalance() {
  try {
    const balance = await walletService.getAccountBalance();
    setBalance(balance);
  } catch (error) {
    console.error('Failed to fetch balance:', error);
  }
}
```

**Refresh After Transactions:**
```typescript
async function sendTransaction(transaction: Transaction) {
  const receipt = await walletService.signAndExecuteTransaction(transaction);
  
  // Wait for Mirror Node to update
  await new Promise(r => setTimeout(r, 5000));
  
  // Refresh balance
  const newBalance = await walletService.getAccountBalance();
  setBalance(newBalance);
  
  return receipt;
}
```

---

### Issue: Token Balances Not Showing

**Symptoms:**
- HBAR balance shows but tokens don't
- Token array is empty
- Specific tokens missing

**Cause:** Token not associated with account or Mirror Node API issue

**Solution:**

**Check Token Association:**
```typescript
async function getTokenBalance(tokenId: string): Promise<number> {
  try {
    const balance = await walletService.getAccountBalance();
    const token = balance.tokens.find(t => t.tokenId === tokenId);
    
    if (!token) {
      console.warn(`Token ${tokenId} not associated with account`);
      return 0;
    }
    
    return token.balance;
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return 0;
  }
}
```

**Associate Token if Needed:**
```typescript
import { TokenAssociateTransaction } from '@hashgraph/sdk';

async function associateToken(tokenId: string) {
  const transaction = new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId]);

  await walletService.signAndExecuteTransaction(transaction);
}
```

---

## Environment Issues

### Issue: Environment Variables Not Loading

**Symptoms:**
- `process.env.NEXT_PUBLIC_*` is undefined
- "Invalid Project ID" despite setting it
- Configuration not working

**Cause:** Environment variables not properly configured

**Solution:**

**Check File Name:**
```bash
# Must be exactly .env.local (not .env or env.local)
ls -la | grep env
```

**Check Variable Names:**
```env
# ✅ Correct - starts with NEXT_PUBLIC_
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123

# ❌ Wrong - missing NEXT_PUBLIC_
WALLETCONNECT_PROJECT_ID=abc123
```

**Restart Dev Server:**
```bash
# Environment changes require restart
# Stop server (Ctrl+C)
npm run dev
```

**Verify in Browser:**
```typescript
// Add to your component
console.log('Env check:', {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  appName: process.env.NEXT_PUBLIC_HASHPACK_APP_NAME,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
});
```

---

## Network Issues

### Issue: Wrong Network Connected

**Symptoms:**
- Connected to mainnet instead of testnet
- Transactions fail with "account not found"
- Wrong network shown in UI

**Cause:** Network mismatch between app and wallet

**Solution:**

**Check Wallet Network:**
```typescript
async function verifyNetwork() {
  const connection = await walletService.getConnectionState();
  const expectedNetwork = process.env.NEXT_PUBLIC_HEDERA_NETWORK;
  
  if (connection.network !== expectedNetwork) {
    showWarning(
      `Please switch to ${expectedNetwork} in HashPack wallet`
    );
    return false;
  }
  
  return true;
}
```

**Handle Network Changes:**
```typescript
private handleSessionUpdate(event: SessionUpdate): void {
  const { namespaces } = event.params;
  
  // Extract network from accounts
  const hederaAccounts = namespaces.hedera?.accounts || [];
  if (hederaAccounts.length > 0) {
    const [namespace, network, accountId] = hederaAccounts[0].split(':');
    
    if (network !== this.connectionState?.network) {
      console.log('Network changed:', network);
      this.connectionState.network = network as 'mainnet' | 'testnet';
      this.emit('network_changed', { network });
    }
  }
}
```

---

## Debug Tools

### Enable Debug Logging

```typescript
class HederaWalletService {
  private debug = process.env.NODE_ENV === 'development';

  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[WalletService] ${message}`, ...args);
    }
  }

  async connectWallet(namespace = 'hedera') {
    this.log('Connecting wallet...', { namespace });
    // ... rest of method
  }
}
```

### Inspect WalletConnect Storage

```typescript
function inspectWalletConnectStorage() {
  const keys = [
    'wc@2:client:0.3',
    'wc@2:core:0.3',
    'wc@2:universal_provider:0.3'
  ];

  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      console.log(`${key}:`, JSON.parse(data));
    } else {
      console.log(`${key}: not found`);
    }
  });
}

// Run in browser console
inspectWalletConnectStorage();
```

### Check Active Sessions

```typescript
function checkActiveSessions() {
  const wcData = localStorage.getItem('wc@2:client:0.3');
  if (!wcData) {
    console.log('No WalletConnect data');
    return;
  }

  const data = JSON.parse(wcData);
  const sessions = data.sessions || {};
  const sessionCount = Object.keys(sessions).length;

  console.log(`Active sessions: ${sessionCount}`);
  
  Object.entries(sessions).forEach(([topic, session]: [string, any]) => {
    const expiry = new Date(session.expiry * 1000);
    const isExpired = expiry < new Date();
    
    console.log(`Session ${topic}:`, {
      expiry: expiry.toISOString(),
      expired: isExpired,
      accounts: session.namespaces?.hedera?.accounts
    });
  });
}
```

### Clear All Sessions

```typescript
function clearAllSessions() {
  const keys = [
    'wc@2:client:0.3',
    'wc@2:core:0.3',
    'wc@2:universal_provider:0.3'
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Cleared: ${key}`);
  });

  console.log('All sessions cleared. Reload page.');
}

// Use when debugging session issues
clearAllSessions();
```

### Test Connection Flow

```typescript
async function testConnectionFlow() {
  console.log('=== Testing Connection Flow ===');

  try {
    console.log('1. Initializing...');
    await walletService.initialize();
    console.log('✅ Initialized');

    console.log('2. Checking existing session...');
    const existing = await walletService.restoreExistingSession();
    if (existing) {
      console.log('✅ Session restored:', existing.accountId);
      return;
    }
    console.log('ℹ️ No existing session');

    console.log('3. Connecting wallet...');
    const connection = await walletService.connectWallet();
    console.log('✅ Connected:', connection.accountId);

    console.log('4. Getting balance...');
    const balance = await walletService.getAccountBalance();
    console.log('✅ Balance:', balance.hbar, 'HBAR');

    console.log('=== Test Complete ===');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
```

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check GitHub Issues**: [hedera-wallet-connect/issues](https://github.com/hashgraph/hedera-wallet-connect/issues)
2. **Ask in Discord**: [Hedera Discord](https://discord.gg/hedera) - #wallet-connect channel
3. **HashPack Support**: [HashPack Discord](https://discord.gg/hashpack)

When asking for help, include:
- Error message and code
- Browser console logs
- WalletConnect storage state (use debug tools above)
- Steps to reproduce
- Environment (browser, OS, HashPack version)

---

**Last Updated**: December 2024  
**Version**: v2.0.4-canary.3ca04e9.0
