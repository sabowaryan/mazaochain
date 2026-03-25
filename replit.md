# MazaoChain

A decentralized lending platform for farmers built on Hedera blockchain, with Supabase authentication and WalletConnect/HashPack wallet integration.

## Stack

- **Framework**: Next.js 15.5.7 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth**: Supabase SSR
- **Blockchain**: Hedera Hashgraph via `@hashgraph/sdk`
- **Wallet**: HashPack / WalletConnect / Reown AppKit
- **i18n**: next-intl (fr, en, ln)
- **Package manager**: npm

## Architecture

```
src/
  app/          # Next.js App Router pages
    [lang]/     # Locale-prefixed routes (fr/en/ln)
      auth/     # Login, register
      dashboard/ # Role-specific dashboards (farmer, cooperative, lender)
      admin/    # Admin panel
    api/        # API routes
  components/   # Shared UI components
  contexts/     # React contexts
  hooks/        # Custom hooks
  lib/          # Core utilities
    auth/       # Auth helpers and middleware-auth
    supabase/   # Supabase client helpers
  i18n/         # Translations
  middleware.ts # Auth + i18n routing middleware
  types/        # TypeScript types
```

## Replit Setup

- Dev server runs on port **5000** bound to `0.0.0.0`
- Workflow: `Start application` → `npm run dev`
- `X-Frame-Options` set to `SAMEORIGIN` (required for Replit preview iframe)

## Required Environment Variables

Set these in Replit Secrets:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_HEDERA_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_HEDERA_ACCOUNT_ID` | Hedera account ID (e.g. 0.0.12345) |
| `HEDERA_PRIVATE_KEY` | Hedera private key (server-side only) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_APP_URL` | App public URL (e.g. https://yourapp.replit.app) |
| `NEXTAUTH_SECRET` | Random secret for session signing |

Optional:
- `NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID` — deployed token factory contract
- `NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID` — deployed loan manager contract
- `NEXT_PUBLIC_USE_APPKIT` — set `true` to enable Reown AppKit UI
- SMTP/Twilio vars for email/SMS notifications

## Security Notes

- `HEDERA_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only (no `NEXT_PUBLIC_` prefix) — never exposed to the client
- Auth middleware enforces RBAC: agriculteur, cooperative, preteur, admin roles
- All protected routes require a valid Supabase session
