import { env } from "@/lib/config/env";
import { hederaWalletService } from "@/lib/wallet/hedera-wallet";

export interface MazaoTokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  treasuryAccountId: string;
}

export interface TokenMintResult {
  success: boolean;
  transactionId?: string;
  tokenId?: string;
  amount?: number;
  error?: string;
}

export interface TokenCreationResult {
  success: boolean;
  tokenId?: string;
  transactionId?: string;
  tokenInfo?: MazaoTokenInfo;
  error?: string;
}

export interface TokenTransferResult {
  success: boolean;
  transactionId?: string;
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  error?: string;
}

export interface CropTokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  cropType: string;
  estimatedValue: number;
  harvestDate: number;
  isActive: boolean;
}

class HederaTokenService {
  private impl: any = null;

  private async getImpl() {
    if (!this.impl) {
      try {
        // Only load implementation in browser environment
        if (typeof window !== 'undefined') {
          const { HederaTokenServiceImpl } = await import('./hedera-token-impl');
          this.impl = new HederaTokenServiceImpl();
        } else {
          // Mock implementation for server/build environment
          this.impl = {
            createMazaoToken: async () => ({ success: false, error: 'Service not available during build' }),
            mintMazaoTokens: async () => ({ success: false, error: 'Service not available during build' }),
            associateTokenWithAccount: async () => ({ success: false, error: 'Service not available during build' }),
            getTokenInfo: async () => null,
            getAccountTokenBalance: async () => 0,
            transferTokens: async () => ({ success: false, error: 'Service not available during build' })
          };
        }
      } catch (error) {
        console.error('Failed to load HederaToken implementation:', error);
        // Fallback mock implementation
        this.impl = {
          createMazaoToken: async () => ({ success: false, error: 'Service not available' }),
          mintMazaoTokens: async () => ({ success: false, error: 'Service not available' }),
          associateTokenWithAccount: async () => ({ success: false, error: 'Service not available' }),
          getTokenInfo: async () => null,
          getAccountTokenBalance: async () => 0,
          transferTokens: async () => ({ success: false, error: 'Service not available' })
        };
      }
    }
    return this.impl;
  }

  async createMazaoToken(
    cropType: string,
    estimatedValue: number,
    harvestDate: number,
    farmerAccountId: string
  ): Promise<TokenCreationResult> {
    const impl = await this.getImpl();
    return impl.createMazaoToken(cropType, estimatedValue, harvestDate, farmerAccountId);
  }

  async mintMazaoTokens(
    tokenId: string,
    amount: number,
    recipientAccountId: string
  ): Promise<TokenMintResult> {
    const impl = await this.getImpl();
    return impl.mintMazaoTokens(tokenId, amount, recipientAccountId);
  }

  async associateTokenWithAccount(
    tokenId: string,
    accountId: string
  ): Promise<{ success: boolean; error?: string }> {
    const impl = await this.getImpl();
    return impl.associateTokenWithAccount(tokenId, accountId);
  }

  async getTokenInfo(tokenId: string): Promise<MazaoTokenInfo | null> {
    const impl = await this.getImpl();
    return impl.getTokenInfo(tokenId);
  }

  async getAccountTokenBalance(accountId: string, tokenId: string): Promise<number> {
    const impl = await this.getImpl();
    return impl.getAccountTokenBalance(accountId, tokenId);
  }

  async transferTokens(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<TokenTransferResult> {
    const impl = await this.getImpl();
    return impl.transferTokens(tokenId, fromAccountId, toAccountId, amount);
  }
}

// Export singleton instance
export const hederaTokenService = new HederaTokenService();