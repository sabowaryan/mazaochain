/**
 * Manual mock for @hashgraph/hedera-wallet-connect
 * This mock is used to avoid ES module import issues during testing
 */
import { vi } from 'vitest';

export const HederaProvider = {
  init: vi.fn(),
};

export const HederaAdapter = vi.fn();

export const HederaChainDefinition = {
  Native: {
    Mainnet: { namespace: 'hedera', network: 'mainnet' },
    Testnet: { namespace: 'hedera', network: 'testnet' },
  },
  EVM: {
    Mainnet: { namespace: 'eip155', chainId: 295 },
    Testnet: { namespace: 'eip155', chainId: 296 },
  },
};

export const hederaNamespace = 'hedera';
