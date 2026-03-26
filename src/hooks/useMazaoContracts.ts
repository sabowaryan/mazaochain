"use client";

import { useState, useCallback, useEffect } from 'react';

// Types importés directement pour éviter les imports de services pendant le SSR
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

export interface TokenHolding {
  tokenId: string;
  cropType: string;
  amount: number;
  estimatedValue: number;
  harvestDate: string;
  status: 'active' | 'harvested' | 'expired';
  tokenName?: string;
  tokenSymbol?: string;
  transferredToFarmer?: boolean;
  mirrorNodeBalance?: number;
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

export interface UseMazaoContractsReturn {
  // State
  loading: boolean;
  error: string | null;
  isReady: boolean; // Indicates if the service is loaded and ready to use

  // Token operations
  createCropToken: (
    farmerAddress: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    tokenSymbol: string
  ) => Promise<ContractInteractionResult>;

  mintTokens: (
    tokenId: string,
    amount: number,
    recipientAddress: string
  ) => Promise<ContractInteractionResult>;

  getFarmerBalanceForToken: (
    farmerAddress: string,
    tokenId: string
  ) => Promise<number>;

  getFarmerTotalBalance: (farmerAddress: string) => Promise<number>;

  getFarmerTokenHoldings: (farmerAddress: string) => Promise<TokenHolding[]>;

  getTokenDetails: (tokenId: string) => Promise<MazaoTokenInfo | null>;

  // Loan operations
  requestLoan: (
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ) => Promise<ContractInteractionResult>;

  getLoanDetails: (loanId: string) => Promise<LoanInfo | null>;

  // Utility functions
  getNextTokenId: () => Promise<number>;
  getNextLoanId: () => Promise<number>;

  // Complete workflows
  tokenizeEvaluation: (
    evaluationId: string,
    cropType: string,
    farmerId: string,
    farmerAddress: string,
    estimatedValue: number,
    harvestDate: number
  ) => Promise<{
    success: boolean;
    tokenId?: string;
    transactionIds?: string[];
    error?: string;
  }>;
}

export function useMazaoContracts(): UseMazaoContractsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady] = useState(true); // Toujours prêt car on utilise l'API Route

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCropToken = useCallback(async (
    farmerAddress: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    tokenSymbol: string
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const mintTokens = useCallback(async (
    tokenId: string,
    amount: number,
    recipientAddress: string
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const getFarmerBalanceForToken = useCallback(async (
    farmerAddress: string,
    tokenId: string
  ): Promise<number> => {
    return handleAsyncOperation(async () => {
      const res = await fetch(
        `/api/mirror-node/tokens?accountId=${encodeURIComponent(farmerAddress)}`
      );
      if (!res.ok) return 0;
      const data = await res.json();
      const tokens: { token_id: string; balance: number }[] = data?.tokens ?? [];
      const found = tokens.find((t) => t.token_id === tokenId);
      return found ? found.balance : 0;
    });
  }, [handleAsyncOperation]);

  const getFarmerTotalBalance = useCallback(async (_farmerAddress: string): Promise<number> => {
    return handleAsyncOperation(async () => {
      // Use DB-backed portfolio for accurate count of tokenized crops.
      // Mirror Node balance may be 0 if farmer hasn't associated their wallet yet.
      const res = await fetch('/api/farmer/portfolio');
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.tokenCount ?? 0;
    });
  }, [handleAsyncOperation]);

  const getFarmerTokenHoldings = useCallback(async (_farmerAddress: string): Promise<TokenHolding[]> => {
    return handleAsyncOperation(async () => {
      const res = await fetch('/api/farmer/portfolio');
      if (!res.ok) return [];
      const data = await res.json();
      const items: TokenHolding[] = data?.data ?? [];
      return items;
    });
  }, [handleAsyncOperation]);

  const getTokenDetails = useCallback(async (tokenId: string): Promise<MazaoTokenInfo | null> => {
    return handleAsyncOperation(async () => {
      const res = await fetch(
        `/api/mirror-node/token-details?tokenId=${encodeURIComponent(tokenId)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.token_id) return null;
      const cropType = data.name?.replace(/^MAZAO-/, '').split('-')[0]?.toLowerCase() ?? 'unknown';
      return {
        tokenId: data.token_id,
        farmer: data.treasury_account_id ?? '',
        estimatedValue: Number(data.total_supply ?? 0) / Math.pow(10, Number(data.decimals ?? 2)),
        cropType,
        harvestDate: 0,
        isActive: true,
        totalSupply: Number(data.total_supply ?? 0),
        createdAt: data.created_timestamp ? Math.floor(Number(data.created_timestamp)) : 0,
        tokenSymbol: data.symbol ?? '',
      } satisfies MazaoTokenInfo;
    });
  }, [handleAsyncOperation]);

  const requestLoan = useCallback(async (
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const getLoanDetails = useCallback(async (loanId: string): Promise<LoanInfo | null> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const getNextTokenId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const getNextLoanId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
    });
  }, [handleAsyncOperation]);

  const tokenizeEvaluation = useCallback(async (
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
  }> => {
    return handleAsyncOperation(async () => {
      // Appeler l'API Route au lieu de la logique client
      const response = await fetch('/api/evaluations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.message || result.error || result.details || 'Erreur lors de la tokenisation'
        };
      }

      return {
        success: true,
        tokenId: result.tokenId,
        transactionIds: result.transactionId ? [result.transactionId] : [],
      };
    });
  }, [handleAsyncOperation]);

  return {
    loading,
    error,
    isReady, // Toujours true car on utilise l'API Route
    createCropToken,
    mintTokens,
    getFarmerBalanceForToken,
    getFarmerTotalBalance,
    getFarmerTokenHoldings,
    getTokenDetails,
    requestLoan,
    getLoanDetails,
    getNextTokenId,
    getNextLoanId,
    tokenizeEvaluation,
  };
}