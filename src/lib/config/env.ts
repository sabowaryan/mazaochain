// Environment configuration
// Supabase has been fully replaced by Neon (Prisma) + Clerk.
// Supabase variables are no longer required or used at runtime.

export const env = {
  // Hedera
  NEXT_PUBLIC_HEDERA_NETWORK: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
  NEXT_PUBLIC_HEDERA_ACCOUNT_ID: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID,
  HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,

  // WalletConnect / HashPack
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  NEXT_PUBLIC_HASHPACK_APP_NAME: process.env.NEXT_PUBLIC_HASHPACK_APP_NAME || 'MazaoChain MVP',
  NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION:
    process.env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || 'Decentralized lending platform for farmers',

  // Application
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Email (optional)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,

  // SMS (optional)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
}

export function validateEnv() {
  const warnings: string[] = [];

  if (!env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || !env.HEDERA_PRIVATE_KEY) {
    warnings.push('NEXT_PUBLIC_HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY manquants — la tokenisation Hedera sera désactivée.');
  }

  if (!env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    warnings.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID manquant — la connexion de wallet HashPack sera désactivée.');
  } else {
    const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (projectId.includes('your_') || projectId.includes('demo_') || projectId.length < 32) {
      warnings.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID semble invalide. Vérifiez sur https://cloud.walletconnect.com/');
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    warnings.forEach(w => console.warn(`[env] ⚠️  ${w}`));
  }
}

if (process.env.NODE_ENV === 'development') {
  validateEnv();
}
