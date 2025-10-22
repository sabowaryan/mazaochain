/**
 * Manual mock for @reown/appkit
 * This mock is used to avoid ES module import issues during testing
 */
import { vi } from 'vitest';

// Mock AppKit instance
const mockAppKitInstance = {
  open: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  getAddress: vi.fn().mockReturnValue('eip155:295'),
  getChainId: vi.fn().mockReturnValue('eip155:295'),
  getIsConnected: vi.fn().mockReturnValue(true),
  getState: vi.fn().mockReturnValue({
    address: 'eip155:295',
    chainId: 'eip155:295',
    isConnected: true,
  }),
  subscribeState: vi.fn((callback) => {
    // Immediately call with initial state
    callback({
      address: 'eip155:295',
      chainId: 'eip155:295',
      isConnected: true,
    });
    // Return unsubscribe function
    return () => {};
  }),
};

export const createAppKit = vi.fn().mockReturnValue(mockAppKitInstance);

export { mockAppKitInstance };
