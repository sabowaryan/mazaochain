/**
 * Hedera Mainnet Configuration for Production
 * This file contains the production-specific configuration for Hedera mainnet
 */

export const HEDERA_MAINNET_CONFIG = {
  // Network Configuration
  network: 'mainnet' as const,
  
  // Consensus Nodes (Mainnet)
  consensusNodes: [
    { nodeId: '0.0.3', endpoint: '35.237.200.180:50211' },
    { nodeId: '0.0.4', endpoint: '35.186.191.247:50211' },
    { nodeId: '0.0.5', endpoint: '35.192.2.25:50211' },
    { nodeId: '0.0.6', endpoint: '35.199.161.108:50211' },
    { nodeId: '0.0.7', endpoint: '35.203.82.240:50211' },
    { nodeId: '0.0.8', endpoint: '35.236.5.219:50211' },
    { nodeId: '0.0.9', endpoint: '35.197.192.225:50211' },
    { nodeId: '0.0.10', endpoint: '35.242.233.154:50211' },
    { nodeId: '0.0.11', endpoint: '35.240.118.96:50211' },
    { nodeId: '0.0.12', endpoint: '35.204.86.32:50211' }
  ],
  
  // Mirror Node Configuration
  mirrorNode: {
    endpoint: 'https://mainnet-public.mirrornode.hedera.com',
    apiVersion: '/api/v1'
  },
  
  // Transaction Configuration
  transaction: {
    maxTransactionFee: 100_000_000, // 1 HBAR in tinybars
    maxQueryPayment: 100_000_000,   // 1 HBAR in tinybars
    defaultTransactionValidDuration: 120, // seconds
    maxRetries: 3,
    retryDelay: 2000 // milliseconds
  },
  
  // Token Configuration
  token: {
    // These will be set after contract deployment
    mazaoTokenFactoryId: process.env.MAZAO_TOKEN_FACTORY_CONTRACT || '',
    loanManagerId: process.env.LOAN_MANAGER_CONTRACT || '',
    
    // Token properties
    tokenName: 'MazaoToken',
    tokenSymbol: 'MAZAO',
    decimals: 8,
    initialSupply: 0, // Tokens are minted on demand
    
    // Treasury configuration
    treasuryAccountId: process.env.HEDERA_TOKEN_TREASURY_ID || '',
    adminKey: process.env.HEDERA_TOKEN_ADMIN_KEY || '',
    supplyKey: process.env.HEDERA_TOKEN_SUPPLY_KEY || '',
    freezeKey: process.env.HEDERA_TOKEN_ADMIN_KEY || '',
    wipeKey: process.env.HEDERA_TOKEN_ADMIN_KEY || ''
  },
  
  // Gas and Fee Configuration
  fees: {
    contractCall: 5_000_000,      // 0.05 HBAR
    contractCreate: 20_000_000,   // 0.2 HBAR
    tokenCreate: 20_000_000,      // 0.2 HBAR
    tokenMint: 1_000_000,         // 0.01 HBAR
    tokenBurn: 1_000_000,         // 0.01 HBAR
    tokenAssociate: 500_000,      // 0.005 HBAR
    cryptoTransfer: 100_000       // 0.001 HBAR
  },
  
  // Rate Limiting
  rateLimits: {
    transactionsPerSecond: 10,
    queriesPerSecond: 100,
    burstLimit: 50
  },
  
  // Monitoring and Alerting
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    alertThresholds: {
      transactionFailureRate: 0.05, // 5%
      responseTimeMs: 5000,
      accountBalanceThreshold: 10_000_000 // 0.1 HBAR minimum
    }
  }
};

/**
 * Validates the Hedera mainnet configuration
 */
export function validateHederaMainnetConfig(): void {
  const requiredEnvVars = [
    'HEDERA_OPERATOR_ID',
    'HEDERA_OPERATOR_KEY',
    'HEDERA_TOKEN_TREASURY_ID',
    'HEDERA_TOKEN_ADMIN_KEY',
    'HEDERA_TOKEN_SUPPLY_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Hedera mainnet environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate account ID format
  const accountIdRegex = /^0\.0\.\d+$/;
  if (!accountIdRegex.test(process.env.HEDERA_OPERATOR_ID!)) {
    throw new Error('Invalid HEDERA_OPERATOR_ID format. Expected format: 0.0.123456');
  }

  if (!accountIdRegex.test(process.env.HEDERA_TOKEN_TREASURY_ID!)) {
    throw new Error('Invalid HEDERA_TOKEN_TREASURY_ID format. Expected format: 0.0.123456');
  }

  console.log('✅ Hedera mainnet configuration validated successfully');
}

/**
 * Gets the appropriate Hedera client configuration based on environment
 */
export function getHederaClientConfig() {
  if (process.env.NODE_ENV === 'production') {
    validateHederaMainnetConfig();
    return HEDERA_MAINNET_CONFIG;
  }
  
  // Return testnet config for non-production environments
  return {
    ...HEDERA_MAINNET_CONFIG,
    network: 'testnet' as const,
    consensusNodes: [
      { nodeId: '0.0.3', endpoint: '0.testnet.hedera.com:50211' },
      { nodeId: '0.0.4', endpoint: '1.testnet.hedera.com:50211' },
      { nodeId: '0.0.5', endpoint: '2.testnet.hedera.com:50211' },
      { nodeId: '0.0.6', endpoint: '3.testnet.hedera.com:50211' }
    ],
    mirrorNode: {
      endpoint: 'https://testnet.mirrornode.hedera.com',
      apiVersion: '/api/v1'
    }
  };
}