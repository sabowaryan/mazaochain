# Environment Variables Guide - HashPack Wallet v2

This guide documents the environment variables required for the HashPack Wallet v2 integration.

## Required Variables

### NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

**Status:** ✅ REQUIRED (enforced in validation)

**Description:** Your WalletConnect Cloud project ID. This is essential for the HashPack wallet connection to work with WalletConnect v2.

**How to obtain:**
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

**Format:** 32+ character alphanumeric string

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Validation:**
- The system will check if this variable is set
- Warnings will be shown if the value appears to be a placeholder
- Warnings will be shown if the value is too short (< 32 characters)

### NEXT_PUBLIC_HASHPACK_APP_NAME

**Status:** Optional (has default value)

**Description:** The name of your application as displayed in HashPack wallet prompts.

**Default:** `MazaoChain MVP`

**Example:** `MazaoChain`

### NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION

**Status:** Optional (has default value)

**Description:** A brief description of your application shown in HashPack wallet prompts.

**Default:** `Decentralized lending platform for farmers`

**Example:** `Decentralized lending platform for farmers in DRC`

## Optional Variables

### NEXT_PUBLIC_USE_APPKIT

**Status:** Optional (default: false)

**Description:** Enable Reown AppKit for a modern, pre-built wallet connection UI. When disabled, the application uses the direct DAppConnector approach.

**Values:**
- `true` - Enable AppKit UI
- `false` - Use direct DAppConnector (default)

**Default:** `false`

**Note:** AppKit provides a polished, ready-to-use wallet connection modal but requires additional dependencies. The direct approach gives you more control over the UI.

## Environment File Examples

### Development (.env.local)

```bash
# HashPack Wallet Configuration (v2)
# REQUIRED: Get your project ID from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# HashPack App Metadata
NEXT_PUBLIC_HASHPACK_APP_NAME=MazaoChain MVP
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Decentralized lending platform for farmers

# Optional: Enable Reown AppKit for modern wallet UI (default: false)
NEXT_PUBLIC_USE_APPKIT=false
```

### Production (.env.production)

```bash
# HashPack Wallet Configuration (v2 - Production)
# REQUIRED: Get your production project ID from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_walletconnect_project_id

# HashPack App Metadata
NEXT_PUBLIC_HASHPACK_APP_NAME=MazaoChain
NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION=Decentralized lending platform for farmers in DRC

# Optional: Enable Reown AppKit for modern wallet UI (default: false)
NEXT_PUBLIC_USE_APPKIT=false
```

## Validation

The application validates environment variables on startup in development mode. You'll see:

### Success
```
✓ All required environment variables are set
```

### Missing Variables
```
Error: Missing required environment variables: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
Please check your .env.local file and ensure all required variables are set.
```

### Invalid Project ID
```
⚠️  WARNING: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID appears to be a placeholder.
Please obtain a valid project ID from https://cloud.walletconnect.com/
HashPack wallet connection will not work without a valid project ID.
```

## Migration from v1

### Changes from v1 to v2

1. **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID** is now **REQUIRED**
   - In v1, this had a default value of `demo_project_id`
   - In v2, you must provide a valid project ID from WalletConnect Cloud
   - The application will validate this on startup

2. **NEXT_PUBLIC_USE_APPKIT** is a new optional variable
   - Allows switching between AppKit UI and direct DAppConnector
   - Default is `false` (direct approach)

### Migration Steps

1. Obtain a WalletConnect project ID from https://cloud.walletconnect.com/
2. Update your `.env.local` file with the new project ID
3. Optionally set `NEXT_PUBLIC_USE_APPKIT=true` if you want to use AppKit
4. Restart your development server
5. Verify the connection works with HashPack

## Troubleshooting

### "Missing required environment variables: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"

**Solution:** Add the variable to your `.env.local` file with a valid project ID from WalletConnect Cloud.

### "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID appears to be a placeholder"

**Solution:** Replace the placeholder value with your actual project ID from https://cloud.walletconnect.com/

### "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID seems too short"

**Solution:** Verify you copied the complete project ID. Valid IDs are typically 32+ characters long.

### HashPack connection fails with "Invalid project ID"

**Solution:** 
1. Verify your project ID is correct
2. Check that your project is active in WalletConnect Cloud
3. Ensure you're using the correct project ID for your environment (dev/prod)

## Security Notes

- **Never commit** your actual project IDs to version control
- Use different project IDs for development and production
- Keep your `.env.local` and `.env.production` files in `.gitignore`
- Only commit the `.env.*.example` files with placeholder values

## Additional Resources

- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Hedera Wallet Connect Documentation](https://docs.hedera.com/hedera/tutorials/more-tutorials/walletconnect)
- [HashPack Documentation](https://docs.hashpack.app/)
