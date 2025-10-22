"use client";

export interface MazaoTokenInfo {
  tokenId: string;
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
  isActive: boolean;
  totalSupply: number;
  createdAt: number;
  tokenSymbol: string;
}

export interface LoanInfo {
  loanId: string;
  borrower: string;
  collateralTokenId: string;
  principal: number;
  duration: number;
  interestRate: number;
  status: number;
  createdAt: number;
}

export interface ContractInteractionResult {
  success: boolean;
  transactionId?: string;
  data?: unknown;
  error?: string;
}

export interface TokenHolding {
  tokenId: string;
  cropType: string;
  amount: number;
  estimatedValue: number;
  harvestDate: string;
  status: 'active' | 'harvested' | 'expired';
}

class MazaoContractsService {
  private impl: any = null;

  private async getImpl() {
    if (!this.impl) {
      try {
        // Only load implementation in browser environment
        if (typeof window !== 'undefined') {
          const { MazaoContractsServiceImpl } = await import('./mazao-contracts-impl');
          this.impl = new MazaoContractsServiceImpl();
        } else {
          // Mock implementation for server/build environment
          this.impl = {
            createCropToken: async () => ({ success: false, error: 'Service not available during build' }),
            mintTokens: async () => ({ success: false, error: 'Service not available during build' }),
            getFarmerBalanceForToken: async () => 0,
            getFarmerTotalBalance: async () => 0,
            getFarmerTokenHoldings: async () => [],
            getTokenDetails: async () => null,
            requestLoan: async () => ({ success: false, error: 'Service not available during build' }),
            getLoanDetails: async () => null,
            getNextTokenId: async () => 0,
            getNextLoanId: async () => 0,
            tokenizeApprovedEvaluation: async () => ({ success: false, error: 'Service not available during build' })
          };
        }
      } catch (error) {
        console.error('Failed to load MazaoContracts implementation:', error);
        // Fallback mock implementation
        this.impl = {
          createCropToken: async () => ({ success: false, error: 'Service not available' }),
          mintTokens: async () => ({ success: false, error: 'Service not available' }),
          getFarmerBalanceForToken: async () => 0,
          getFarmerTotalBalance: async () => 0,
          getFarmerTokenHoldings: async () => [],
          getTokenDetails: async () => null,
          requestLoan: async () => ({ success: false, error: 'Service not available' }),
          getLoanDetails: async () => null,
          getNextTokenId: async () => 0,
          getNextLoanId: async () => 0,
          tokenizeApprovedEvaluation: async () => ({ success: false, error: 'Service not available' })
        };
      }
    }
    return this.impl;
  }

  async createCropToken(
    farmerAddress: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    tokenSymbol: string
  ): Promise<ContractInteractionResult> {
    const impl = await this.getImpl();
    return impl.createCropToken(farmerAddress, estimatedValue, cropType, harvestDate, tokenSymbol);
  }

  async mintTokens(
    tokenId: string,
    amount: number,
    recipientAddress: string
  ): Promise<ContractInteractionResult> {
    const impl = await this.getImpl();
    return impl.mintTokens(tokenId, amount, recipientAddress);
  }

  async getFarmerBalanceForToken(
    farmerAddress: string,
    tokenId: string
  ): Promise<number> {
    const impl = await this.getImpl();
    return impl.getFarmerBalanceForToken(farmerAddress, tokenId);
  }

  async getFarmerTotalBalance(farmerAddress: string): Promise<number> {
    const impl = await this.getImpl();
    return impl.getFarmerTotalBalance(farmerAddress);
  }

  async getFarmerTokenHoldings(farmerAddress: string): Promise<TokenHolding[]> {
    const impl = await this.getImpl();
    return impl.getFarmerTokenHoldings(farmerAddress);
  }

  async getTokenDetails(tokenId: string): Promise<MazaoTokenInfo | null> {
    const impl = await this.getImpl();
    return impl.getTokenDetails(tokenId);
  }

  async requestLoan(
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ): Promise<ContractInteractionResult> {
    const impl = await this.getImpl();
    return impl.requestLoan(collateralTokenId, principal, duration, interestRate);
  }

  async getLoanDetails(loanId: string): Promise<LoanInfo | null> {
    const impl = await this.getImpl();
    return impl.getLoanDetails(loanId);
  }

  async getNextTokenId(): Promise<number> {
    const impl = await this.getImpl();
    return impl.getNextTokenId();
  }

  async getNextLoanId(): Promise<number> {
    const impl = await this.getImpl();
    return impl.getNextLoanId();
  }

  async tokenizeApprovedEvaluation(
    evaluationId: string,
    cropType: string,
    farmerId: string,
    farmerAddress: string,
    estimatedValue: number,
    harvestDate: number
  ): Promise<{
    success: boolean;
    tokenId?: string;
    transactionIds?: string[];
    error?: string;
  }> {
    const impl = await this.getImpl();
    return impl.tokenizeApprovedEvaluation(
      evaluationId,
      cropType,
      farmerId,
      farmerAddress,
      estimatedValue,
      harvestDate
    );
  }
}

// Export singleton instance
export const mazaoContractsService = new MazaoContractsService();