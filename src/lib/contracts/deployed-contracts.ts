// Configuration des contrats déployés sur Hedera Testnet
export const DEPLOYED_CONTRACTS = {
  network: 'testnet',
  account: '0.0.6913540',
  contracts: {
    MazaoTokenFactory: {
      contractId: '0.0.6913792',
      evmAddress: '0000000000000000000000000000000000697f00',
      transactionId: '0.0.6913540@1758928598.453833013'
    },
    LoanManager: {
      contractId: '0.0.6913794',
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