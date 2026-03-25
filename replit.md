# MazaoChain

A decentralized lending platform for farmers built on Hedera blockchain, with Clerk authentication, Neon PostgreSQL database, and WalletConnect/HashPack wallet integration.

## Stack

- **Framework**: Next.js 15.5.7 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk (`@clerk/nextjs`)
- **ORM**: Prisma v5 (`prisma`, `@prisma/client`)
- **Database**: Neon PostgreSQL (Prisma datasource)
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
    api/        # API routes (all using Clerk + Neon)
  components/   # Shared UI components
  contexts/     # React contexts (AuthContext uses Clerk hooks)
  hooks/        # Custom hooks
  lib/
    auth/       # Clerk-based server auth helpers
    db/         # Neon SQL client + schema.sql
    supabase/   # Stub files (throw errors if called — replaced by Clerk+Neon)
  i18n/         # Translations
  middleware.ts # Clerk auth + i18n routing middleware
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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key from dashboard |
| `CLERK_SECRET_KEY` | Clerk secret key from dashboard |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_HEDERA_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_HEDERA_ACCOUNT_ID` | Hedera account ID (e.g. 0.0.12345) |
| `HEDERA_PRIVATE_KEY` | Hedera private key (server-side only) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |

Optional:
- `NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID` — deployed token factory contract
- `NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID` — deployed loan manager contract
- `NEXT_PUBLIC_USE_APPKIT` — set `true` to enable Reown AppKit UI

## Database Setup

Run `src/lib/db/schema.sql` against your Neon database once to create all tables.
All primary keys use TEXT for Clerk user IDs (e.g. `user_abc123`).

Tables: `profiles`, `farmer_profiles`, `cooperative_profiles`, `lender_profiles`,
        `crop_evaluations`, `loans`, `transactions`, `notifications`, `tokenization_records`

## User Roles

- `agriculteur` — farmer, can request loans and submit crop evaluations
- `cooperative` — manages farmers, approves/rejects evaluations
- `preteur` — lender, can fund loan requests
- `admin` — platform administrator

## Auth Flow

1. User registers via RegisterForm (Clerk `useSignUp`)
2. On success, POST `/api/profile` to create a row in `profiles` with their Clerk ID and role
3. AuthContext reads profile from `/api/profile?userId=...`
4. Dashboard pages check `profile.role` to render role-specific content

## Security Notes

- `HEDERA_PRIVATE_KEY` and `CLERK_SECRET_KEY` are server-side only — never exposed to client
- Clerk middleware enforces auth; RBAC is enforced by API routes checking `profiles.role`
- Supabase files in `src/lib/supabase/` are stubs — they throw if called at runtime
