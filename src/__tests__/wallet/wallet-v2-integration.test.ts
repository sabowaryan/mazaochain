/**
 * HashPack Wallet v2 Integration Tests
 * 
 * Comprehensive integration tests covering:
 * - Complete connection flow
 * - Session restoration after page reload
 * - Session expiration handling
 * - Transaction signing flow
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';
import { hederaWalletService } from '@/lib/wallet/hedera-wallet';
import { WalletErrorCode } from '@/types/wallet';

// Mock modules
vi.mock('@hashgraph/hedera-wallet-connect');
vi.mock('@reown/appkit');
vi.mock('@hashgraph/sdk');
vi.mock('@/lib/config/env');
vi.mock('@/lib/wallet/wallet-error-handler');
vi.mock('@/lib/wallet/appkit-config');
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { wallet_address: null },
  })),
}));

// Import mocked modules
const hederaWalletConnect = await import('@hashgraph/hedera-wallet-connect');
const reownAppKit = await import('@reown/appkit');
const hederaSdk = await import('@hashgraph/sdk');
const envModule = await import('@/lib/config/env');
const appKitConfig = await import('@/lib/wallet/appkit-config');


// Setup SDK mock
vi.mocked(hederaSdk.Client).forMainnet = vi.fn(() => ({
  setOperator: vi.fn(),
} as any));
vi.mocked(hederaSdk.Client).forTestnet = vi.fn(() => ({
  setOperator: vi.fn(),
} as any));

// Setup env mock
(envModule as any).env = {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'test-project-id',
  NEXT_PUBLIC_HEDERA_NETWORK: 'testnet',
  NEXT_PUBLIC_HASHPACK_APP_NAME: 'Test App',
  NEXT_PUBLIC_HASHPACK_APP_DESCRIPTION: 'Test Description',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

describe('Wallet v2 Integration Tests', () => {
  let mockHederaProvider: any;
  let mockNativeAdapter: any;
  let mockEvmAdapter: any;
  let mockAppKitInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create comprehensive mock provider
    mockHederaProvider = {
      on: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getAccountAddresses: vi.fn(() => {
        // Throw error if not connected (simulating real behavior)
        throw new Error('Not initialized. Please call connect()');
      }),
      hedera_signTransaction: vi.fn(),
      hedera_signMessage: vi.fn(),
      session: null, // No session by default
    };

    // Create mock adapters
    mockNativeAdapter = {
      setUniversalProvider: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      request: vi.fn().mockResolvedValue({ signatureMap: 'mock-signature' }),
    };

    mockEvmAdapter = {
      setUniversalProvider: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      request: vi.fn().mockResolvedValue({ signatureMap: 'mock-signature' }),
    };

    // Create mock AppKit instance
    mockAppKitInstance = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockReturnValue({}),
      subscribeState: vi.fn(),
    };

    // Mock HederaProvider.init
    vi.mocked(hederaWalletConnect.HederaProvider.init).mockResolvedValue(mockHederaProvider);
    vi.mocked(hederaWalletConnect.HederaAdapter).mockImplementation((config: any) => {
      return config.namespace === 'hedera' ? mockNativeAdapter : mockEvmAdapter;
    });

    // Mock createAppKit function
    vi.mocked(reownAppKit.createAppKit).mockReturnValue(mockAppKitInstance);
    
    // Mock initializeAppKit function
    vi.mocked(appKitConfig.initializeAppKit).mockReturnValue(mockAppKitInstance);

    // Reset service state
    (hederaWalletService as any).isInitialized = false;
    (hederaWalletService as any).hederaProvider = null;
    (hederaWalletService as any).nativeAdapter = null;
    (hederaWalletService as any).evmAdapter = null;
    (hederaWalletService as any).appKitInstance = null;
    (hederaWalletService as any).connectionState = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });


  describe('Complete Connection Flow', () => {
    it('should complete full connection flow from initialization to balance loading', async () => {
      // Mock successful connection
      const mockConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      const mockBalances = {
        hbar: '100.5',
        tokens: [
          {
            tokenId: '0.0.456858',
            balance: '1000',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
        ],
      };

      // Setup mocks for AppKit-based connection
      mockAppKitInstance.open.mockImplementation(async () => {
        // Simulate async connection
        await new Promise(resolve => setTimeout(resolve, 100));
        // Update AppKit state to simulate successful connection
        mockAppKitInstance.getState.mockReturnValue({
          address: '0.0.123456',
          chainId: 'hedera:testnet',
          isConnected: true,
        });
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: {
            balance: 10050000000, // 100.5 HBAR in tinybars
            tokens: [
              {
                token_id: '0.0.456858',
                balance: 1000,
                decimals: 6,
              },
            ],
          },
        }),
      });

      // Render hook
      const { result } = renderHook(() => useWallet());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      // Initial state should be disconnected
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      expect(result.current.balances).toBeNull();

      // Connect wallet
      await act(async () => {
        await result.current.connectWallet('hedera');
      });

      // Should be connected
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.connection).toEqual(mockConnection);
      expect(result.current.namespace).toBe('hedera');

      // Balances should be loaded
      await waitFor(() => {
        expect(result.current.balances).not.toBeNull();
      });

      expect(result.current.balances?.hbar).toBe('100.5');
      expect(result.current.balances?.tokens).toHaveLength(1);
      expect(result.current.balances?.tokens[0].symbol).toBe('USDC');
      expect(result.current.error).toBeNull();
    });

    it('should handle connection rejection gracefully', async () => {
      mockAppKitInstance.open.mockRejectedValue(new Error('User rejected connection'));

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      // Error message is in French
      expect(result.current.error).toContain('refusée');
    });

    it('should handle network errors during connection', async () => {
      mockAppKitInstance.open.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isConnected).toBe(false);
      // Error message is in French
      expect(result.current.error).toContain('réseau');
    });
  });


  describe('Session Restoration After Page Reload', () => {
    it('should restore existing session on initialization', async () => {
      // Mock existing session - AppKit returns connected state
      mockAppKitInstance.getState.mockReturnValue({
        address: '0.0.123456',
        chainId: 'hedera:testnet',
        isConnected: true,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: {
            balance: 5000000000, // 50 HBAR
            tokens: [],
          },
        }),
      });

      const { result } = renderHook(() => useWallet());

      // Should restore session during initialization
      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connection).toEqual({
        accountId: '0.0.123456',
        network: 'testnet',
        isConnected: true,
        namespace: 'hedera',
        chainId: 'hedera:testnet',
      });

      // Balances should be loaded automatically
      await waitFor(() => {
        expect(result.current.balances).not.toBeNull();
      });

      expect(result.current.balances?.hbar).toBe('50');
    });

    it('should handle restoration of EVM namespace session', async () => {
      mockAppKitInstance.getState.mockReturnValue({
        address: '0.0.789012',
        chainId: 'eip155:296',
        isConnected: true,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: {
            balance: 2500000000,
            tokens: [],
          },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connection?.namespace).toBe('eip155');
      expect(result.current.connection?.accountId).toBe('0.0.789012');
      expect(result.current.connection?.chainId).toBe('eip155:296');
    });

    it('should handle no existing session gracefully', async () => {
      // No session, AppKit returns empty state
      mockAppKitInstance.getState.mockReturnValue({});

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      expect(result.current.balances).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle corrupted session data gracefully', async () => {
      mockAppKitInstance.getState.mockReturnValue({
        address: 'invalid:format',
        chainId: 'corrupted',
        isConnected: false,
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      // Should not crash, just not restore
      expect(result.current.isConnected).toBe(false);
    });
  });


  describe('Session Expiration Handling', () => {
    it('should handle session_delete event and clear connection state', async () => {
      // Setup initial connection
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the session_delete handler
      const sessionDeleteHandler = mockHederaProvider.on.mock.calls.find(
        (call: any) => call[0] === 'session_delete'
      )?.[1];

      expect(sessionDeleteHandler).toBeDefined();

      // Trigger session deletion
      await act(async () => {
        sessionDeleteHandler({ topic: 'test-topic', id: 1 });
      });

      // Connection should be cleared
      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState).toBeNull();
    });

    it('should handle disconnect event', async () => {
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the disconnect handler
      const disconnectHandler = mockHederaProvider.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];

      expect(disconnectHandler).toBeDefined();

      // Trigger disconnect
      await act(async () => {
        disconnectHandler();
      });

      // Connection should be cleared
      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState).toBeNull();
    });

    it('should allow reconnection after session expiration', async () => {
      // Setup initial connection
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Disconnect wallet properly
      await act(async () => {
        await result.current.disconnectWallet();
      });

      // Should be disconnected
      expect(hederaWalletService.getConnectionState()).toBeNull();
      expect(result.current.isConnected).toBe(false);

      // Setup for reconnection with new account
      mockAppKitInstance.open.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        mockAppKitInstance.getState.mockReturnValue({
          address: '0.0.999999',
          chainId: 'hedera:testnet',
          isConnected: true,
        });
      });

      // Reconnect
      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 5000 });

      expect(result.current.connection?.accountId).toBe('0.0.999999');
    });

    it('should handle session_update event with account change', async () => {
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the session_update handler
      const sessionUpdateHandler = mockHederaProvider.on.mock.calls.find(
        (call: any) => call[0] === 'session_update'
      )?.[1];

      expect(sessionUpdateHandler).toBeDefined();

      // Simulate account change via session update
      mockHederaProvider.getAccountAddresses.mockReturnValue(['hedera:testnet:0.0.789012']);

      await act(async () => {
        sessionUpdateHandler({
          topic: 'test-topic',
          params: {
            namespaces: {
              hedera: {
                accounts: ['hedera:testnet:0.0.789012'],
                methods: [],
                events: [],
              },
            },
          },
        });
      });

      // Connection should be updated
      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState?.accountId).toBe('0.0.789012');
    });
  });


  describe('Transaction Signing Flow', () => {
    beforeEach(async () => {
      // Setup connected state for transaction tests
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });
    });

    it('should complete full transaction signing flow', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Mock transaction
      const mockTransaction = {
        toBytes: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      } as any;

      const mockSignedTransaction = {
        toBytes: vi.fn().mockReturnValue(new Uint8Array([4, 5, 6])),
        execute: vi.fn().mockResolvedValue({
          getReceipt: vi.fn().mockResolvedValue({
            status: 'SUCCESS',
            transactionId: '0.0.123456@1234567890.000000000',
          }),
        }),
      } as any;

      mockHederaProvider.hedera_signTransaction.mockResolvedValue(mockSignedTransaction);

      // Sign transaction
      const signedTx = await hederaWalletService.signTransaction(mockTransaction);

      expect(mockHederaProvider.hedera_signTransaction).toHaveBeenCalledWith({
        signerAccountId: 'hedera:testnet:0.0.123456',
        transactionBody: mockTransaction,
      });

      expect(signedTx).toBe(mockSignedTransaction);

      // Execute transaction
      const receipt = await hederaWalletService.signAndExecuteTransaction(mockTransaction);

      expect(receipt).toHaveProperty('status', 'SUCCESS');
    });

    it('should handle transaction rejection by user', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockTransaction = {} as any;

      mockHederaProvider.hedera_signTransaction.mockRejectedValue(
        new Error('User rejected transaction')
      );

      await expect(
        hederaWalletService.signTransaction(mockTransaction)
      ).rejects.toThrow();
    });

    it('should handle insufficient balance error', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockTransaction = {} as any;

      mockHederaProvider.hedera_signTransaction.mockRejectedValue(
        new Error('insufficient balance for transaction')
      );

      await expect(
        hederaWalletService.signTransaction(mockTransaction)
      ).rejects.toThrow();
    });

    it('should prevent transaction signing when not connected', async () => {
      // Reset service to disconnected state
      (hederaWalletService as any).connectionState = null;
      mockHederaProvider.getAccountAddresses.mockReturnValue([]);

      const mockTransaction = {} as any;

      await expect(
        hederaWalletService.signTransaction(mockTransaction)
      ).rejects.toThrow();
    });

    it('should prevent transaction signing with wrong namespace', async () => {
      // Setup EVM namespace connection
      mockHederaProvider.session = { topic: 'test-session-evm' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['eip155:296:0.0.123456']);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const mockTransaction = {} as any;

      await expect(
        hederaWalletService.signTransaction(mockTransaction)
      ).rejects.toThrow();
    });

    it('should sign message successfully', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const message = 'Test message for signing';
      const mockSignature = { signatureMap: 'mock-signature-data' };

      mockNativeAdapter.request.mockResolvedValue(mockSignature);

      const signature = await hederaWalletService.signMessage(message);

      expect(mockNativeAdapter.request).toHaveBeenCalledWith({
        method: 'hedera_signMessage',
        params: {
          signerAccountId: '0.0.123456',
          message,
        },
      });

      expect(signature).toEqual(mockSignature);
    });

    it('should handle message signing rejection', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      mockNativeAdapter.request.mockRejectedValue(
        new Error('User rejected message signing')
      );

      await expect(
        hederaWalletService.signMessage('test message')
      ).rejects.toThrow();
    });
  });


  describe('Account and Chain Change Events', () => {
    beforeEach(async () => {
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });
    });

    it('should handle accountsChanged event', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the accountsChanged handler
      const accountsChangedHandler = mockHederaProvider.on.mock.calls.find(
        (call: unknown) => call[0] === 'accountsChanged'
      )?.[1];

      expect(accountsChangedHandler).toBeDefined();

      // Simulate account change
      mockHederaProvider.getAccountAddresses.mockReturnValue(['hedera:testnet:0.0.999999']);

      await act(async () => {
        accountsChangedHandler(['hedera:testnet:0.0.999999']);
      });

      // Connection should be updated
      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState?.accountId).toBe('0.0.999999');
    });

    it('should handle chainChanged event', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the chainChanged handler
      const chainChangedHandler = mockHederaProvider.on.mock.calls.find(
        (call: unknown) => call[0] === 'chainChanged'
      )?.[1];

      expect(chainChangedHandler).toBeDefined();

      // Simulate chain change
      await act(async () => {
        chainChangedHandler('hedera:mainnet');
      });

      // ChainId should be updated
      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState?.chainId).toBe('hedera:mainnet');
    });

    it('should handle switching from testnet to mainnet', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connection?.network).toBe('testnet');

      // Simulate mainnet switch
      const chainChangedHandler = mockHederaProvider.on.mock.calls.find(
        (call: unknown) => call[0] === 'chainChanged'
      )?.[1];

      await act(async () => {
        chainChangedHandler('hedera:mainnet');
      });

      const connectionState = hederaWalletService.getConnectionState();
      expect(connectionState?.chainId).toBe('hedera:mainnet');
    });
  });

  describe('Balance Refresh Integration', () => {
    beforeEach(async () => {
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);
    });

    it('should refresh balances after transaction', async () => {
      let balanceCallCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        balanceCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            balance: {
              balance: balanceCallCount === 1 ? 10000000000 : 9000000000, // Balance decreases after tx
              tokens: [],
            },
          }),
        });
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.balances?.hbar).toBe('100');
      });

      // Refresh balances
      await act(async () => {
        await result.current.refreshBalances();
      });

      await waitFor(() => {
        expect(result.current.balances?.hbar).toBe('90');
      });

      expect(balanceCallCount).toBe(2);
    });

    it('should handle balance refresh errors gracefully', async () => {
      // First call succeeds for initial load
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            balance: { balance: 10000000000, tokens: [] },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Service Unavailable',
        });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.balances?.hbar).toBe('100');
      });

      // Clear any previous errors
      act(() => {
        result.current.clearError();
      });

      // Refresh should fail but return empty balance instead of throwing
      await act(async () => {
        await result.current.refreshBalances();
      });

      // The service returns empty balance on error, so balances should be reset to 0
      await waitFor(() => {
        expect(result.current.balances?.hbar).toBe('0');
      });

      // Application should still be functional
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Complete Disconnect Flow', () => {
    it('should complete full disconnect flow and cleanup', async () => {
      mockHederaProvider.session = { topic: 'test-session' };
      mockHederaProvider.getAccountAddresses = vi.fn().mockReturnValue(['hedera:testnet:0.0.123456']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balance: { balance: 10000000000, tokens: [] },
        }),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connection).not.toBeNull();
      expect(result.current.balances).not.toBeNull();

      // Disconnect
      await act(async () => {
        await result.current.disconnectWallet();
      });

      expect(mockHederaProvider.disconnect).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      expect(result.current.balances).toBeNull();
      expect(result.current.namespace).toBeNull();
    });
  });
});
