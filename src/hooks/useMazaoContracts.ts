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
  const [mazaoContractsService, setMazaoContractsService] = useState<any>(null);
  const [isServiceLoading, setIsServiceLoading] = useState(true);

  // Chargement dynamique du service uniquement côté client (une seule fois)
  useEffect(() => {
    if (typeof window !== 'undefined' && !mazaoContractsService) {
      setIsServiceLoading(true);
      import('@/lib/services/mazao-contracts').then(module => {
        setMazaoContractsService(module.mazaoContractsService);
        setIsServiceLoading(false);
      }).catch(err => {
        console.error('Failed to load mazao contracts service:', err);
        setError('Failed to load contracts service');
        setIsServiceLoading(false);
      });
    }
  }, []); // Empty deps - only load once

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    // Wait for service to load if it's still loading
    if (isServiceLoading) {
      throw new Error('Contracts service is still loading. Please wait...');
    }

    if (!mazaoContractsService) {
      throw new Error('Contracts service not loaded yet');
    }

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
  }, [mazaoContractsService, isServiceLoading]);

  const createCropToken = useCallback(async (
    farmerAddress: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    tokenSymbol: string
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.createCropToken(
        farmerAddress,
        estimatedValue,
        cropType,
        harvestDate,
        tokenSymbol
      )
    );
  }, [handleAsyncOperation]);

  const mintTokens = useCallback(async (
    tokenId: string,
    amount: number,
    recipientAddress: string
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.mintTokens(tokenId, amount, recipientAddress)
    );
  }, [handleAsyncOperation]);

  const getFarmerBalanceForToken = useCallback(async (
    farmerAddress: string,
    tokenId: string
  ): Promise<number> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getFarmerBalanceForToken(farmerAddress, tokenId)
    );
  }, [handleAsyncOperation]);

  const getFarmerTotalBalance = useCallback(async (farmerAddress: string): Promise<number> => {
    if (!mazaoContractsService) {
      throw new Error('Contracts service not loaded yet');
    }
    return handleAsyncOperation(() =>
      mazaoContractsService.getFarmerTotalBalance(farmerAddress)
    );
  }, [handleAsyncOperation, mazaoContractsService]);

  const getFarmerTokenHoldings = useCallback(async (farmerAddress: string): Promise<TokenHolding[]> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getFarmerTokenHoldings(farmerAddress)
    );
  }, [handleAsyncOperation]);

  const getTokenDetails = useCallback(async (tokenId: string): Promise<MazaoTokenInfo | null> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getTokenDetails(tokenId)
    );
  }, [handleAsyncOperation]);

  const requestLoan = useCallback(async (
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ): Promise<ContractInteractionResult> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.requestLoan(
        collateralTokenId,
        principal,
        duration,
        interestRate
      )
    );
  }, [handleAsyncOperation]);

  const getLoanDetails = useCallback(async (loanId: string): Promise<LoanInfo | null> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getLoanDetails(loanId)
    );
  }, [handleAsyncOperation]);

  const getNextTokenId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getNextTokenId()
    );
  }, [handleAsyncOperation]);

  const getNextLoanId = useCallback(async (): Promise<number> => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getNextLoanId()
    );
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
    return handleAsyncOperation(() =>
      mazaoContractsService.tokenizeApprovedEvaluation(
        evaluationId,
        cropType,
        farmerId,
        farmerAddress,
        estimatedValue,
        harvestDate
      )
    );
  }, [handleAsyncOperation]);

  return {
    loading,
    error,
    isReady: !isServiceLoading && !!mazaoContractsService,
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