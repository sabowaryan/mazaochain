# AppKit Quick Start Guide

## What is AppKit?

Reown AppKit (formerly WalletConnect AppKit) provides a modern, pre-built UI for wallet connections. It's an optional alternative to our custom wallet connection interface.

## Quick Setup

### 1. Enable AppKit Mode

Add to your `.env.local`:

```env
NEXT_PUBLIC_USE_APPKIT=true
```

### 2. Restart Development Server

```bash
npm run dev
```

### 3. Use the Wrapper Component

Replace your wallet connection component:

```tsx
// Before
import { WalletConnection } from "@/components/wallet/WalletConnection";

// After
import { WalletConnectionWrapper } from "@/components/wallet/WalletConnectionWrapper";

// Usage
<WalletConnectionWrapper showBalances={true} />
```

That's it! The component automatically switches between custom and AppKit modes.

## Switching Back to Custom Mode

Set in `.env.local`:

```env
NEXT_PUBLIC_USE_APPKIT=false
```

Or remove the variable entirely (defaults to false).

## Using AppKit Components Directly

```tsx
import { 
  AppKitButton, 
  AppKitAccountButton, 
  AppKitNetworkButton 
} from "@/components/wallet/AppKitButton";

function MyComponent() {
  return (
    <div className="flex gap-2">
      <AppKitButton />
      <AppKitNetworkButton />
      <AppKitAccountButton />
    </div>
  );
}
```

## Programmatic Access

```tsx
import { getWalletService } from "@/lib/wallet/wallet-service-factory";

const walletService = getWalletService();

// Works in both custom and AppKit modes
await walletService.connectWallet("hedera");
const balance = await walletService.getAccountBalance();
await walletService.disconnectWallet();
```

## Customization

Edit `src/lib/wallet/appkit-config.ts`:

```typescript
themeMode: "light", // or "dark"
themeVariables: {
  "--w3m-accent": "#10b981", // Your brand color
}
```

## Troubleshooting

### Modal doesn't open
- Check `NEXT_PUBLIC_USE_APPKIT=true` is set
- Verify WalletConnect Project ID is valid
- Check browser console for errors

### Connection fails
- Ensure HashPack is installed
- Check network configuration (mainnet/testnet)
- Verify Project ID at https://cloud.walletconnect.com/

## Features

### Custom Mode
- ✅ Full UI control
- ✅ MazaoChain branding
- ✅ Hedera-optimized
- ❌ More maintenance

### AppKit Mode
- ✅ Modern pre-built UI
- ✅ Maintained by Reown
- ✅ Mobile-optimized
- ❌ Less customization

## Need Help?

- [Full Documentation](./APPKIT_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Hedera Wallet Connect Docs](https://docs.hedera.com/)
