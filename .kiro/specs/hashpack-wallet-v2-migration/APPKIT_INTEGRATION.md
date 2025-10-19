# Reown AppKit Integration Guide

## Overview

This document describes the optional Reown AppKit integration for MazaoChain. AppKit provides a modern, pre-built UI for wallet connections as an alternative to our custom wallet connection interface.

## What is Reown AppKit?

Reown AppKit (formerly WalletConnect AppKit) is a comprehensive wallet connection solution that provides:

- **Modern Modal UI**: Pre-built, customizable modal for wallet connections
- **Multi-Wallet Support**: Support for multiple wallet providers
- **Network Switching**: Built-in network selection UI
- **Account Management**: Account display and management interface
- **Responsive Design**: Mobile-friendly interface out of the box

## Architecture

### Dual-Mode Support

The application supports two modes:

1. **Custom Mode** (Default): Uses our custom `HederaWalletService` with custom UI components
2. **AppKit Mode**: Uses Reown AppKit with pre-built UI components

The mode is controlled by the `NEXT_PUBLIC_USE_APPKIT` environment variable.

### Component Structure

```
src/
├── lib/
│   └── wallet/
│       ├── hedera-wallet.ts              # Custom wallet service
│       ├── appkit-config.ts              # AppKit configuration
│       └── wallet-service-factory.ts     # Service factory (switches between modes)
├── components/
│   └── wallet/
│       ├── WalletConnection.tsx          # Custom wallet UI
│       ├── AppKitButton.tsx              # AppKit button components
│       └── WalletConnectionWrapper.tsx   # Wrapper that switches between modes
└── types/
    └── appkit.d.ts                       # TypeScript declarations for AppKit
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Enable AppKit mode (default: false)
NEXT_PUBLIC_USE_APPKIT=true

# Required: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Application metadata (used by AppKit)
NEXT_PUBLIC_HASHPACK_APP_NAME=MazaoChain MVP
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Decentralized lending platform for farmers
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### AppKit Configuration

The AppKit is configured in `src/lib/wallet/appkit-config.ts`:

```typescript
const appKitInstance = createAppKit({
  adapters: [nativeAdapter, evmAdapter],
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: "MazaoChain MVP",
    description: "Decentralized lending platform for farmers",
    url: "http://localhost:3000",
    icons: ["http://localhost:3000/favicon.ico"],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#10b981", // Green accent
  },
});
```

## Usage

### Using the Wrapper Component

The easiest way to use the dual-mode support is with the `WalletConnectionWrapper`:

```tsx
import { WalletConnectionWrapper } from "@/components/wallet/WalletConnectionWrapper";

export function MyComponent() {
  return (
    <WalletConnectionWrapper 
      showBalances={true}
      className="my-custom-class"
    />
  );
}
```

This component automatically renders either:
- Custom `WalletConnection` component (when `NEXT_PUBLIC_USE_APPKIT=false`)
- AppKit buttons (when `NEXT_PUBLIC_USE_APPKIT=true`)

### Using AppKit Components Directly

If you want to use AppKit components directly:

```tsx
import { AppKitButton, AppKitAccountButton, AppKitNetworkButton } from "@/components/wallet/AppKitButton";

export function MyComponent() {
  return (
    <div className="flex gap-2">
      <AppKitButton />
      <AppKitNetworkButton />
      <AppKitAccountButton />
    </div>
  );
}
```

### Using the Service Factory

For programmatic wallet operations:

```typescript
import { getWalletService, isUsingAppKit } from "@/lib/wallet/wallet-service-factory";

const walletService = getWalletService();

// Connect wallet
const connection = await walletService.connectWallet("hedera");

// Check connection
if (walletService.isConnected()) {
  const accountId = walletService.getAccountId();
  console.log("Connected:", accountId);
}

// Get balances
const balances = await walletService.getAccountBalance();

// Disconnect
await walletService.disconnectWallet();
```

## AppKit Components

### AppKitButton

Main connection button that opens the AppKit modal:

```tsx
<AppKitButton />
```

Features:
- Opens connection modal on click
- Shows "Connect Wallet" when disconnected
- Shows account info when connected
- Handles initialization and error states

### AppKitNetworkButton

Network selection button:

```tsx
<AppKitNetworkButton />
```

Features:
- Shows current network
- Opens network selection modal
- Supports Hedera Mainnet/Testnet

### AppKitAccountButton

Account management button:

```tsx
<AppKitAccountButton />
```

Features:
- Shows account address
- Shows account balance
- Provides disconnect option
- Copy address functionality

## Switching Between Modes

### To Enable AppKit Mode

1. Set environment variable:
   ```env
   NEXT_PUBLIC_USE_APPKIT=true
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. The application will now use AppKit UI

### To Disable AppKit Mode (Use Custom UI)

1. Set environment variable:
   ```env
   NEXT_PUBLIC_USE_APPKIT=false
   ```
   Or remove the variable entirely (defaults to false)

2. Restart your development server

3. The application will use custom wallet UI

## Customization

### Theme Customization

Customize AppKit appearance in `appkit-config.ts`:

```typescript
themeMode: "light", // or "dark"
themeVariables: {
  "--w3m-accent": "#10b981",           // Primary accent color
  "--w3m-background": "#ffffff",       // Background color
  "--w3m-foreground": "#000000",       // Text color
  "--w3m-border-radius-master": "8px", // Border radius
}
```

### Feature Flags

Control AppKit features:

```typescript
features: {
  analytics: false,  // Disable analytics
  email: false,      // Disable email login
  socials: [],       // No social logins
}
```

## Comparison: Custom vs AppKit

### Custom Mode

**Pros:**
- Full control over UI/UX
- Customized for MazaoChain branding
- Optimized for Hedera-specific features
- No external dependencies for UI

**Cons:**
- More maintenance required
- Need to implement all UI features
- Custom error handling

### AppKit Mode

**Pros:**
- Modern, pre-built UI
- Maintained by Reown team
- Consistent UX across dApps
- Built-in features (network switching, account management)
- Mobile-optimized

**Cons:**
- Less customization flexibility
- External dependency
- May include features we don't need
- Requires WalletConnect infrastructure

## Testing

### Testing Custom Mode

```bash
# Set environment
NEXT_PUBLIC_USE_APPKIT=false

# Run tests
npm run test
```

### Testing AppKit Mode

```bash
# Set environment
NEXT_PUBLIC_USE_APPKIT=true

# Run tests
npm run test
```

### Manual Testing Checklist

- [x] AppKit modal opens on button click



- [ ] Can connect to HashPack wallet
- [ ] Account information displays correctly
- [ ] Network switching works
- [ ] Balance display is accurate
- [ ] Disconnect functionality works
- [ ] Session restoration after page reload
- [ ] Error handling for connection failures
- [ ] Mobile responsiveness

## Troubleshooting

### AppKit Modal Not Opening

**Issue**: Clicking the button doesn't open the modal

**Solutions**:
1. Check that `NEXT_PUBLIC_USE_APPKIT=true`
2. Verify WalletConnect Project ID is valid
3. Check browser console for initialization errors
4. Ensure AppKit dependencies are installed

### Connection Fails

**Issue**: Cannot connect to wallet

**Solutions**:
1. Verify HashPack is installed and unlocked
2. Check WalletConnect Project ID is valid
3. Ensure network configuration matches (mainnet/testnet)
4. Check browser console for errors

### Styling Issues

**Issue**: AppKit components don't match app theme

**Solutions**:
1. Customize theme variables in `appkit-config.ts`
2. Add custom CSS to override AppKit styles
3. Use wrapper components to add custom styling

### TypeScript Errors

**Issue**: TypeScript errors for AppKit components

**Solutions**:
1. Ensure `src/types/appkit.d.ts` is included in `tsconfig.json`
2. Restart TypeScript server in your IDE
3. Check that `@reown/appkit` types are installed

## Migration Guide

### From Custom to AppKit

1. **Update Environment**:
   ```env
   NEXT_PUBLIC_USE_APPKIT=true
   ```

2. **Update Components**:
   Replace `WalletConnection` with `WalletConnectionWrapper`:
   ```tsx
   // Before
   import { WalletConnection } from "@/components/wallet/WalletConnection";
   <WalletConnection />

   // After
   import { WalletConnectionWrapper } from "@/components/wallet/WalletConnectionWrapper";
   <WalletConnectionWrapper />
   ```

3. **Test Thoroughly**:
   - Test all wallet connection flows
   - Verify transaction signing works
   - Check balance display
   - Test on mobile devices

### From AppKit to Custom

1. **Update Environment**:
   ```env
   NEXT_PUBLIC_USE_APPKIT=false
   ```

2. **Components automatically switch** (if using `WalletConnectionWrapper`)

3. **Test custom UI** to ensure all features work

## Best Practices

1. **Use WalletConnectionWrapper**: Always use the wrapper component for automatic mode switching
2. **Test Both Modes**: Ensure your application works in both custom and AppKit modes
3. **Handle Errors**: Implement proper error handling for both modes
4. **Mobile Testing**: Test on mobile devices, especially with AppKit
5. **Session Management**: Ensure session restoration works in both modes
6. **Performance**: Monitor performance impact of AppKit initialization

## Future Enhancements

Potential improvements for AppKit integration:

1. **Transaction Signing**: Implement transaction signing through AppKit modal
2. **Message Signing**: Add message signing support via AppKit
3. **Multi-Wallet**: Support additional Hedera wallets through AppKit
4. **Custom Themes**: Create multiple theme presets
5. **Analytics**: Optional analytics integration
6. **Advanced Features**: Leverage more AppKit features as they become available

## Resources

- [Reown AppKit Documentation](https://docs.reown.com/appkit/overview)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Hedera Wallet Connect Documentation](https://docs.hedera.com/hedera/tutorials/more-tutorials/wallet-connect)
- [HashPack Wallet](https://www.hashpack.app/)

## Support

For issues related to:
- **AppKit**: Check [Reown Documentation](https://docs.reown.com/)
- **Hedera Integration**: Check [Hedera Documentation](https://docs.hedera.com/)
- **MazaoChain**: Contact the development team

## Conclusion

The AppKit integration provides a modern, alternative UI for wallet connections while maintaining full backward compatibility with our custom implementation. Choose the mode that best fits your needs:

- **Custom Mode**: For maximum control and Hedera-specific optimizations
- **AppKit Mode**: For modern UI and reduced maintenance overhead

Both modes use the same underlying `HederaProvider` and `HederaAdapter` architecture, ensuring consistent functionality regardless of the UI layer.
