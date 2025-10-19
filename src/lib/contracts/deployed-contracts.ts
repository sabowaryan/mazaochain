// Configuration des contrats déployés sur Hedera Testnet
// Note: These values should match the environment variables in .env.local
export const DEPLOYED_CONTRACTS = {
  network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
  account: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || '0.0.6913540',
  contracts: {
    MazaoTokenFactory: {
      contractId: process.env.NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID || '0.0.6913902',
      evmAddress: '0000000000000000000000000000000000697f00',
      transactionId: '0.0.6913540@1758928598.453833013'
    },
    LoanManager: {
      contractId: process.env.NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID || '0.0.6913910',
      evmAddress: '0000000000000000000000000000000000697f02',
      transactionId: '0.0.6913540@1758928609.335075789'
    }
  }
} as const;

// Types pour TypeScript
export type ContractName = keyof typeof DEPLOYED_CONTRACTS.contracts;
export type ContractInfo = typeof DEPLOYED_CONTRACTS.contracts[ContractName];

// Helper functions
export const getContractId = (contractName: ContractName): string => {
  return DEPLOYED_CONTRACTS.contracts[contractName].contractId;
};

export const getContractEvmAddress = (contractName: ContractName): string => {
  return DEPLOYED_CONTRACTS.contracts[contractName].evmAddress;
};

export const getContractTransactionId = (contractName: ContractName): string => {
  return DEPLOYED_CONTRACTS.contracts[contractName].transactionId;
};

// Validation
export const isContractDeployed = (contractName: ContractName): boolean => {
  const contract = DEPLOYED_CONTRACTS.contracts[contractName];
  return !!(contract.contractId && contract.evmAddress && contract.transactionId);
};

// Export pour compatibilité
export default DEPLOYED_CONTRACTS;