# HashPack Wallet v2 - Quick Reference

## Quick Start

### 1. Install Dependencies

```bash
npm install @hashgraph/hedera-wallet-connect@^2.0.4-canary.3ca04e9.0
npm install @walletconnect/universal-provider@^2.11.0
```

### 2. Environment Setup

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_HASHPACK_APP_NAME=Your App Name
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Your app description
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialize Wallet Service

```typescript
import { HederaWalletService } from '@/lib/wallet/hedera-wallet';

const walletService = new HederaWalletService();
await walletService.initialize();
```

### 4. Connect Wallet

```typescript
const connection = await walletService.connectWallet('hedera');
console.log('Connected:', connection.accountId);
```

---

## Common Operations

### Connect Wallet

```typescript
try {
  const connection = await walletService.connectWallet('hedera');
  // connection.accountId, connection.network, connection.isConnected
} catch (error) {
  if (error.code === 'CONNECTION_REJECTED') {
    // User rejected
  }
}
```

### Restore Session

```typescript
const connection = await walletService.restoreExistingSession();
if (connection) {
  // Session restored
}
```

### Get Balance

```typescript
const balance = await walletService.getAccountBalance();
console.log('HBAR:', balance.hbar);
console.log('Tokens:', balance.tokens);
```

### Sign Transaction

```typescript
import { TransferTransaction, Hbar, AccountId } from '@hashgraph/sdk';

const transaction = new TransferTransaction()
  .addHbarTransfer(AccountId.fromString(senderId), new Hbar(-10))
  .addHbarTransfer(AccountId.fromString(recipientId), new Hbar(10));

const signedTx = await walletService.signTransaction(transaction, 'hedera');
const receipt = await signedTx.execute(client);
```

### Sign Message

```typescript
const signature = await walletService.signMessage('Hello, Hedera!');
```

### Disconnect

```typescript
await walletService.disconnectWallet();
```

---

## Error Handling

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `CONNECTION_TIMEOUT` | Connection timed out | Retry connection |
| `CONNECTION_REJECTED` | User rejected | Show message, allow retry |
| `WALLET_NOT_INSTALLED` | HashPack not found | Show install link |
| `INVALID_PROJECT_ID` | Bad WalletConnect ID | Check env variable |
| `SESSION_EXPIRED` | Session expired | Reconnect |
| `TRANSACTION_REJECTED` | User rejected tx | Show message |
| `INSUFFICIENT_BALANCE` | Not enough funds | Show balance |

### Example Error Handler

```typescript
try {
  await walletService.connectWallet();
} catch (error) {
  switch (error.code) {
    case 'CONNECTION_TIMEOUT':
      showError('Connection timed out. Please try again.');
      break;
    case 'CONNECTION_REJECTED':
      showError('Connection rejected. Please approve in HashPack.');
      break;
    case 'WALLET_NOT_INSTALLED':
      showError('Please install HashPack wallet.');
      break;
    default:
      showError('An error occurred. Please try again.');
  }
}
```

---

## React Hook Usage

### useWallet Hook

```typescript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const {
    isConnected,
    accountId,
    balance,
    connectWallet,
    disconnectWallet,
    signTransaction,
    isLoading,
    error
  } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Account: {accountId}</p>
          <p>Balance: {balance?.hbar} HBAR</p>
          <button onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

---

## Key Differences from v1

| Feature | v1 | v2 |
|---------|----|----|
| Main Class | `DAppConnector` | `HederaProvider` |
| Initialization | `new DAppConnector()` | `HederaProvider.init()` |
| Adapters | None | `HederaAdapter` (Native + EVM) |
| Node IDs | Manual `setNodeAccountIds()` | Automatic |
| Namespaces | Hedera only | Hedera + EVM |
| Sessions | Basic | Advanced with events |
| Transaction Signing | `signTransaction()` | `hedera_signTransaction` RPC |

---

## Troubleshooting

### Connection Issues

**Problem**: Connection times out

**Solution**:
- Ensure HashPack is open
- Check WalletConnect Project ID is valid
- Try again with HashPack mobile app

### Session Issues

**Problem**: Session doesn't restore

**Solution**:
```typescript
// Add delay after initialization
await walletService.initialize();
await new Promise(r => setTimeout(r, 500));
const session = await walletService.restoreExistingSession();
```

### Transaction Issues

**Problem**: Transaction fails with node error

**Solution**: Remove `setNodeAccountIds()` - it's automatic in v2

```typescript
// ❌ Don't do this
transaction.setNodeAccountIds([new AccountId(3)]);

// ✅ Do this
const transaction = new TransferTransaction()
  .addHbarTransfer(sender, amount);
```

---

## Testing

### Run Tests

```bash
# All wallet tests
npm test -- src/__tests__/wallet

# Specific test file
npm test -- src/__tests__/wallet/hedera-wallet.test.ts

# Integration tests
npm test -- src/__tests__/wallet/wallet-v2-integration.test.ts
```

### Manual Testing

1. **Connect**: Open HashPack, approve connection
2. **Restore**: Reload page, session should restore
3. **Transaction**: Sign a test transaction
4. **Disconnect**: Disconnect and verify state cleared

---

## Resources

- 📖 [Full Migration Guide](./MIGRATION_V2.md)
- 📖 [Hedera Wallet Connect Docs](https://docs.hedera.com/hedera/tutorials/more-tutorials/wallet-connect)
- 📖 [WalletConnect v2 Docs](https://docs.walletconnect.com/)
- 📖 [HashPack Documentation](https://docs.hashpack.app/)

---

## Support

- **GitHub**: [hedera-wallet-connect/issues](https://github.com/hashgraph/hedera-wallet-connect/issues)
- **Discord**: [Hedera Discord](https://discord.gg/hedera) - #wallet-connect channel
- **HashPack**: [HashPack Discord](https://discord.gg/hashpack)

---

**Last Updated**: December 2024  
**Version**: v2.0.4-canary.3ca04e9.0
