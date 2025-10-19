/**
 * useWallet Hook Unit Tests
 * Comprehensive tests for the useWallet hook implementation
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock modules BEFORE importing the hook
vi.mock('@/lib/wallet/hedera-wallet');
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { useWallet } from '@/hooks/useWallet';
import { hederaWalletService } from '@/lib/wallet/hedera-wallet';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { WalletErrorCode, WalletError } from '@/types/wallet';

describe('useWallet Hook', () => {
  let mockSupabaseClient: any;
  let mockUser: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock user
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: null,
      loading: false,
      initialized: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
      isAuthenticated: true,
      isValidated: false,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
    });

    // Setup wallet service mocks
    vi.mocked(hederaWalletService.initialize).mockResolvedValue(undefined);
    vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(null);
    vi.mocked(hederaWalletService.connectWallet).mockResolvedValue({
      accountId: '0.0.123456',
      network: 'testnet',
      isConnected: true,
      namespace: 'hedera',
      chainId: 'hedera:testnet',
    });
    vi.mocked(hederaWalletService.disconnectWallet).mockResolvedValue(undefined);
    vi.mocked(hederaWalletService.getAccountBalance).mockResolvedValue({
      hbar: '100',
      tokens: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection States', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      expect(result.current.namespace).toBeNull();
    });

    it('should set isRestoring to true during initialization', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isRestoring).toBe(true);
    });

    it('should set isRestoring to false after initialization completes', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });
    });

    it('should restore existing session on mount', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.connection).toEqual(existingConnection);
        expect(result.current.namespace).toBe('hedera');
      });
    });

    it('should load balances when restoring session', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(hederaWalletService.getAccountBalance).toHaveBeenCalledWith('0.0.123456');
        expect(result.current.balances).toEqual({
          hbar: '100',
          tokens: [],
        });
      });
    });

    it('should set isConnecting to true during connection', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      act(() => {
        result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(true);
    });

    it('should set isConnecting to false after connection completes', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Connection Actions', () => {
    it('should connect wallet with default hedera namespace', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(hederaWalletService.connectWallet).toHaveBeenCalledWith('hedera');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connection?.accountId).toBe('0.0.123456');
    });

    it('should connect wallet with eip155 namespace', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockResolvedValue({
        accountId: '0.0.123456',
        network: 'testnet',
        isConnected: true,
        namespace: 'eip155',
        chainId: 'eip155:296',
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet('eip155');
      });

      expect(hederaWalletService.connectWallet).toHaveBeenCalledWith('eip155');
      expect(result.current.namespace).toBe('eip155');
    });

    it('should not connect if already connecting', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      // Start first connection
      act(() => {
        result.current.connectWallet();
      });

      // Try to connect again while first is in progress
      await act(async () => {
        await result.current.connectWallet();
      });

      // Should only be called once
      expect(hederaWalletService.connectWallet).toHaveBeenCalledTimes(1);
    });

    it('should not connect if already connected', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      // Should not call connectWallet since already connected
      expect(hederaWalletService.connectWallet).not.toHaveBeenCalled();
    });

    it('should disconnect wallet successfully', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.disconnectWallet();
      });

      expect(hederaWalletService.disconnectWallet).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connection).toBeNull();
      expect(result.current.namespace).toBeNull();
      expect(result.current.balances).toBeNull();
    });
  });

  describe('Balance Management', () => {
    it('should load balances after successful connection', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(hederaWalletService.getAccountBalance).toHaveBeenCalledWith('0.0.123456');
      expect(result.current.balances).toEqual({
        hbar: '100',
        tokens: [],
      });
    });

    it('should set isLoadingBalances during balance fetch', async () => {
      let resolveBalance: any;
      const balancePromise = new Promise((resolve) => {
        resolveBalance = resolve;
      });

      vi.mocked(hederaWalletService.getAccountBalance).mockReturnValue(balancePromise as any);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      act(() => {
        result.current.connectWallet();
      });

      await waitFor(() => {
        expect(result.current.isLoadingBalances).toBe(true);
      });

      resolveBalance({ hbar: '100', tokens: [] });

      await waitFor(() => {
        expect(result.current.isLoadingBalances).toBe(false);
      });
    });

    it('should refresh balances on demand', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Clear previous calls
      vi.mocked(hederaWalletService.getAccountBalance).mockClear();

      await act(async () => {
        await result.current.refreshBalances();
      });

      expect(hederaWalletService.getAccountBalance).toHaveBeenCalledWith('0.0.123456');
    });

    it('should not refresh balances if not connected', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      vi.mocked(hederaWalletService.getAccountBalance).mockClear();

      await act(async () => {
        await result.current.refreshBalances();
      });

      expect(hederaWalletService.getAccountBalance).not.toHaveBeenCalled();
    });

    it('should handle balance fetch errors gracefully', async () => {
      vi.mocked(hederaWalletService.getAccountBalance).mockRejectedValue(
        new WalletError(WalletErrorCode.NETWORK_ERROR, 'Network error')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.errorCode).toBe(WalletErrorCode.NETWORK_ERROR);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection rejection error', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.CONNECTION_REJECTED, 'User rejected')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe('Connexion refusée dans HashPack');
      expect(result.current.errorCode).toBe(WalletErrorCode.CONNECTION_REJECTED);
    });

    it('should handle connection timeout error', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.CONNECTION_TIMEOUT, 'Timeout')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe('La connexion a expiré. Veuillez réessayer.');
      expect(result.current.errorCode).toBe(WalletErrorCode.CONNECTION_TIMEOUT);
    });

    it('should handle wallet not installed error', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.WALLET_NOT_INSTALLED, 'Not installed')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe(
        "HashPack n'est pas installé. Veuillez installer l'extension HashPack."
      );
      expect(result.current.errorCode).toBe(WalletErrorCode.WALLET_NOT_INSTALLED);
    });

    it('should handle invalid project ID error', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.INVALID_PROJECT_ID, 'Invalid project ID')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe('Configuration invalide. Veuillez contacter le support.');
      expect(result.current.errorCode).toBe(WalletErrorCode.INVALID_PROJECT_ID);
    });

    it('should handle network error', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.NETWORK_ERROR, 'Network error')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe(
        'Problème de connexion réseau. Vérifiez votre connexion internet.'
      );
      expect(result.current.errorCode).toBe(WalletErrorCode.NETWORK_ERROR);
    });

    it('should handle unknown wallet errors', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.UNKNOWN_ERROR, 'Unknown error')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe('Unknown error');
      expect(result.current.errorCode).toBe(WalletErrorCode.UNKNOWN_ERROR);
    });

    it('should handle generic errors', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new Error('Generic error')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBe('Generic error');
      expect(result.current.errorCode).toBe(WalletErrorCode.UNKNOWN_ERROR);
    });

    it('should not show error for MODAL_CLOSED_BY_USER', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new Error('MODAL_CLOSED_BY_USER')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle disconnection errors', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);
      vi.mocked(hederaWalletService.disconnectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.UNKNOWN_ERROR, 'Disconnect failed')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.disconnectWallet();
      });

      expect(result.current.error).toBe('Disconnect failed');
      expect(result.current.errorCode).toBe(WalletErrorCode.UNKNOWN_ERROR);
    });

    it('should clear errors', async () => {
      vi.mocked(hederaWalletService.connectWallet).mockRejectedValue(
        new WalletError(WalletErrorCode.CONNECTION_TIMEOUT, 'Timeout')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.errorCode).toBeNull();
    });

    it('should handle initialization errors', async () => {
      vi.mocked(hederaWalletService.initialize).mockRejectedValue(
        new WalletError(WalletErrorCode.INITIALIZATION_FAILED, 'Init failed')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.error).toBe('Init failed');
        expect(result.current.errorCode).toBe(WalletErrorCode.INITIALIZATION_FAILED);
      });
    });

    it('should handle generic initialization errors', async () => {
      vi.mocked(hederaWalletService.initialize).mockRejectedValue(
        new Error('Generic init error')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.error).toBe('Échec de l\'initialisation du service de portefeuille');
        expect(result.current.errorCode).toBe(WalletErrorCode.INITIALIZATION_FAILED);
      });
    });
  });

  describe('Profile Synchronization', () => {
    it('should update user profile with wallet address on connection', async () => {
      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        wallet_address: '0.0.123456',
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should remove wallet address from profile on disconnection', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Clear previous calls
      mockSupabaseClient.from.mockClear();
      mockSupabaseClient.update.mockClear();
      mockSupabaseClient.eq.mockClear();

      await act(async () => {
        await result.current.disconnectWallet();
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        wallet_address: null,
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should not update profile if user is not logged in', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        isAuthenticated: false,
        isValidated: false,
        hasRole: vi.fn(),
        hasAnyRole: vi.fn(),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle profile update errors gracefully', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        error: new Error('Update failed'),
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      // Should not throw, but connection should still succeed
      await act(async () => {
        await result.current.connectWallet();
      });

      // Connection should still be established despite profile update failure
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Session Restoration', () => {
    it('should restore session with balances on mount', async () => {
      const existingConnection = {
        accountId: '0.0.123456',
        network: 'testnet' as const,
        isConnected: true,
        namespace: 'hedera' as const,
        chainId: 'hedera:testnet',
      };

      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(existingConnection);
      vi.mocked(hederaWalletService.getAccountBalance).mockResolvedValue({
        hbar: '250',
        tokens: [
          {
            tokenId: '0.0.456858',
            balance: '1000000',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
        ],
      });

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.connection).toEqual(existingConnection);
        expect(result.current.balances).toEqual({
          hbar: '250',
          tokens: [
            {
              tokenId: '0.0.456858',
              balance: '1000000',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
          ],
        });
      });
    });

    it('should handle session restoration errors gracefully', async () => {
      vi.mocked(hederaWalletService.initialize).mockRejectedValue(
        new Error('Restoration failed')
      );

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should not load balances if session restoration fails', async () => {
      vi.mocked(hederaWalletService.getConnectionState).mockReturnValue(null);

      const { result } = renderHook(() => useWallet());

      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });

      // getAccountBalance should not be called during initialization
      // since there's no existing connection
      expect(hederaWalletService.getAccountBalance).not.toHaveBeenCalled();
    });
  });
});
