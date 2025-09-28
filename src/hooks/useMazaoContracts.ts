import { useState, useCallback } from 'react';
import { mazaoContractsService, type MazaoTokenInfo, type LoanInfo, type ContractInteractionResult } from '@/lib/services/mazao-contracts';

export interface UseMazaoContractsReturn {
  // State
  loading: boolean;
  error: string | null;
  
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
  ) => {
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
  ) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.mintTokens(tokenId, amount, recipientAddress)
    );
  }, [handleAsyncOperation]);

  const getFarmerBalanceForToken = useCallback(async (
    farmerAddress: string,
    tokenId: string
  ) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getFarmerBalanceForToken(farmerAddress, tokenId)
    );
  }, [handleAsyncOperation]);

  const getFarmerTotalBalance = useCallback(async (farmerAddress: string) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getFarmerTotalBalance(farmerAddress)
    );
  }, [handleAsyncOperation]);

  const getTokenDetails = useCallback(async (tokenId: string) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getTokenDetails(tokenId)
    );
  }, [handleAsyncOperation]);

  const requestLoan = useCallback(async (
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.requestLoan(
        collateralTokenId,
        principal,
        duration,
        interestRate
      )
    );
  }, [handleAsyncOperation]);

  const getLoanDetails = useCallback(async (loanId: string) => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getLoanDetails(loanId)
    );
  }, [handleAsyncOperation]);

  const getNextTokenId = useCallback(async () => {
    return handleAsyncOperation(() =>
      mazaoContractsService.getNextTokenId()
    );
  }, [handleAsyncOperation]);

  const getNextLoanId = useCallback(async () => {
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
  ) => {
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
    createCropToken,
    mintTokens,
    getFarmerBalanceForToken,
    getFarmerTotalBalance,
    getTokenDetails,
    requestLoan,
    getLoanDetails,
    getNextTokenId,
    getNextLoanId,
    tokenizeEvaluation,
  };
}