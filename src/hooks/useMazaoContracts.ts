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
      // createCropToken(
        farmerAddress,
        estimatedValue,
        cropType,
        harvestDate,
        tokenSymbol
      )
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
      // mintTokens(tokenId, amount, recipientAddress)
    });
  }, [handleAsyncOperation]);

  const getFarmerBalanceForToken = useCallback(async (
    farmerAddress: string,
    tokenId: string
  ): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getFarmerBalanceForToken(farmerAddress, tokenId)
    });
  }, [handleAsyncOperation]);

  const getFarmerTotalBalance = useCallback(async (farmerAddress: string): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // 0;
    });
  }, [handleAsyncOperation]);

  const getFarmerTokenHoldings = useCallback(async (farmerAddress: string): Promise<TokenHolding[]> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getFarmerTokenHoldings(farmerAddress)
    });
  }, [handleAsyncOperation]);

  const getTokenDetails = useCallback(async (tokenId: string): Promise<MazaoTokenInfo | null> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getTokenDetails(tokenId)
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
      // requestLoan(
        collateralTokenId,
        principal,
        duration,
        interestRate
      )
    });
  }, [handleAsyncOperation]);

  const getLoanDetails = useCallback(async (loanId: string): Promise<LoanInfo | null> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getLoanDetails(loanId)
    });
  }, [handleAsyncOperation]);

  const getNextTokenId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getNextTokenId()
    });
  }, [handleAsyncOperation]);

  const getNextLoanId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(async () => {
      // TODO: Implémenter via API Route si nécessaire
      throw new Error('Cette méthode n\'est pas encore implémentée via API Route');
      // getNextLoanId()
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
        tokenId: result.data?.tokenId,
        transactionIds: result.data?.transactionId ? [result.data.transactionId] : []
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