// Environment configuration with validation

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Hedera
  NEXT_PUBLIC_HEDERA_NETWORK: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
  NEXT_PUBLIC_HEDERA_ACCOUNT_ID: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
  HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY!,

  // MazaoChain Contracts
  NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID: process.env.NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID!,
  NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID: process.env.NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID!,

  // HashPack Wallet (v2)
  NEXT_PUBLIC_HASHPACK_APP_NAME: process.env.NEXT_PUBLIC_HASHPACK_APP_NAME || 'MazaoChain MVP',
  NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION: process.env.NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION || 'Decentralized lending platform for farmers',
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  NEXT_PUBLIC_USE_APPKIT: process.env.NEXT_PUBLIC_USE_APPKIT === 'true',

  // Application
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,

  // SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_HEDERA_ACCOUNT_ID',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
] as const

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  // Validate WalletConnect Project ID format
  if (env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    
    // Check if it's a placeholder value
    if (projectId.includes('your_') || projectId.includes('demo_')) {
      console.warn(
        '⚠️  WARNING: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID appears to be a placeholder.\n' +
        'Please obtain a valid project ID from https://cloud.walletconnect.com/\n' +
        'HashPack wallet connection will not work without a valid project ID.'
      )
    }
    
    // Check minimum length (WalletConnect project IDs are typically 32+ characters)
    if (projectId.length < 32) {
      console.warn(
        '⚠️  WARNING: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID seems too short.\n' +
        'Valid WalletConnect project IDs are typically 32+ characters.\n' +
        'Please verify your project ID at https://cloud.walletconnect.com/'
      )
    }
  }
}

// Validate on module load in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv()
  } catch (error) {
    console.error('Environment validation failed:', error)
  }
}