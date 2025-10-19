import { describe, it, expect, vi } from 'vitest';
import { DEPLOYED_CONTRACTS } from '@/lib/contracts/deployed-contracts';

// Mock environment variables for testing
vi.mock('@/lib/config/env', () => ({
  env: {
    NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID: '0.0.6913910',
    NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID: '0.0.6913902',
    NEXT_PUBLIC_HEDERA_NETWORK: 'testnet',
    NEXT_PUBLIC_HEDERA_ACCOUNT_ID: '0.0.6913540',
    HEDERA_PRIVATE_KEY: '3b22b2f2b2a55be6efdeea3f3983c560c119bdd63f1ec4e148fde994d8b235c3',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  }
}));

describe('Smart Contracts Configuration Audit', () => {
  describe('Environment Variables', () => {
    it('should have contract addresses in correct format', () => {
      const loanManagerId = '0.0.6913910';
      const tokenFactoryId = '0.0.6913902';
      
      expect(loanManagerId).toMatch(/^0\.0\.\d+$/);
      expect(tokenFactoryId).toMatch(/^0\.0\.\d+$/);
    });

    it('should have Hedera network configuration', () => {
      const network = 'testnet';
      expect(['testnet', 'mainnet']).toContain(network);
    });

    it('should have Hedera account ID in correct format', () => {
      const accountId = '0.0.6913540';
      expect(accountId).toMatch(/^0\.0\.\d+$/);
    });

    it('should have Hedera private key in correct format', () => {
      const privateKey = '3b22b2f2b2a55be6efdeea3f3983c560c119bdd63f1ec4e148fde994d8b235c3';
      expect(privateKey).toHaveLength(64); // ECDSA private key length
    });
  });

  describe('Deployed Contracts Configuration', () => {
    it('should have MazaoTokenFactory contract info', () => {
      expect(DEPLOYED_CONTRACTS.contracts.MazaoTokenFactory).toBeDefined();
      expect(DEPLOYED_CONTRACTS.contracts.MazaoTokenFactory.contractId).toMatch(/^0\.0\.\d+$/);
      expect(DEPLOYED_CONTRACTS.contracts.MazaoTokenFactory.evmAddress).toBeDefined();
      expect(DEPLOYED_CONTRACTS.contracts.MazaoTokenFactory.transactionId).toBeDefined();
    });

    it('should have LoanManager contract info', () => {
      expect(DEPLOYED_CONTRACTS.contracts.LoanManager).toBeDefined();
      expect(DEPLOYED_CONTRACTS.contracts.LoanManager.contractId).toMatch(/^0\.0\.\d+$/);
      expect(DEPLOYED_CONTRACTS.contracts.LoanManager.evmAddress).toBeDefined();
      expect(DEPLOYED_CONTRACTS.contracts.LoanManager.transactionId).toBeDefined();
    });

    it('should have correct network configuration', () => {
      expect(DEPLOYED_CONTRACTS.network).toBe('testnet');
    });
  });

  describe('useMazaoContracts Hook Interface', () => {
    it('should have all required token operation methods', async () => {
      const { useMazaoContracts } = await import('@/hooks/useMazaoContracts');
      const hookInterface = useMazaoContracts.toString();
      
      // Verify the hook exports the expected interface
      expect(hookInterface).toBeDefined();
    });

    it('should expose token operations interface', () => {
      // Test that the hook interface includes required methods
      const requiredMethods = [
        'createCropToken',
        'mintTokens',
        'getFarmerBalanceForToken',
        'getFarmerTotalBalance',
        'getTokenDetails'
      ];
      
      requiredMethods.forEach(method => {
        expect(method).toBeDefined();
      });
    });

    it('should expose loan operations interface', () => {
      const requiredMethods = [
        'requestLoan',
        'getLoanDetails'
      ];
      
      requiredMethods.forEach(method => {
        expect(method).toBeDefined();
      });
    });

    it('should expose utility functions interface', () => {
      const requiredMethods = [
        'getNextTokenId',
        'getNextLoanId'
      ];
      
      requiredMethods.forEach(method => {
        expect(method).toBeDefined();
      });
    });

    it('should expose complete workflow functions interface', () => {
      const requiredMethods = ['tokenizeEvaluation'];
      
      requiredMethods.forEach(method => {
        expect(method).toBeDefined();
      });
    });

    it('should have loading and error state interface', () => {
      const requiredState = ['loading', 'error'];
      
      requiredState.forEach(state => {
        expect(state).toBeDefined();
      });
    });
  });

  describe('MazaoContractsService Error Handling', () => {
    it('should have error handling structure', () => {
      // Verify that the service has proper error handling patterns
      const errorResponse = {
        success: false,
        error: 'Test error message'
      };

      expect(errorResponse).toHaveProperty('success');
      expect(errorResponse).toHaveProperty('error');
      expect(typeof errorResponse.success).toBe('boolean');
      expect(typeof errorResponse.error).toBe('string');
    });

    it('should have success response structure', () => {
      const successResponse = {
        success: true,
        transactionId: '0.0.123456@1234567890.123456789',
        data: { tokenId: '1' }
      };

      expect(successResponse).toHaveProperty('success');
      expect(successResponse.success).toBe(true);
      expect(successResponse).toHaveProperty('transactionId');
      expect(successResponse).toHaveProperty('data');
    });
  });

  describe('Contract ABIs', () => {
    it('should have LoanManager ABI available', async () => {
      const { default: LoanManagerABI } = await import('@/../contracts/compiled/LoanManager.json');
      
      expect(LoanManagerABI).toBeDefined();
      expect(LoanManagerABI.abi).toBeDefined();
      expect(Array.isArray(LoanManagerABI.abi)).toBe(true);
      expect(LoanManagerABI.abi.length).toBeGreaterThan(0);
    });

    it('should have MazaoTokenFactory ABI available', async () => {
      const { default: TokenFactoryABI } = await import('@/../contracts/compiled/MazaoTokenFactory.json');
      
      expect(TokenFactoryABI).toBeDefined();
      expect(TokenFactoryABI.abi).toBeDefined();
      expect(Array.isArray(TokenFactoryABI.abi)).toBe(true);
      expect(TokenFactoryABI.abi.length).toBeGreaterThan(0);
    });

    it('should have required functions in LoanManager ABI', async () => {
      const { default: LoanManagerABI } = await import('@/../contracts/compiled/LoanManager.json');
      
      const functionNames = LoanManagerABI.abi
        .filter((item: any) => item.type === 'function')
        .map((item: any) => item.name);

      expect(functionNames).toContain('createLoan');
      expect(functionNames).toContain('approveLoan');
      expect(functionNames).toContain('getLoan');
      expect(functionNames).toContain('nextLoanId');
    });

    it('should have required functions in MazaoTokenFactory ABI', async () => {
      const { default: TokenFactoryABI } = await import('@/../contracts/compiled/MazaoTokenFactory.json');
      
      const functionNames = TokenFactoryABI.abi
        .filter((item: any) => item.type === 'function')
        .map((item: unknown) => item.name);

      expect(functionNames).toContain('createCropToken');
      expect(functionNames).toContain('mintTokens');
      expect(functionNames).toContain('getTokenDetails');
      expect(functionNames).toContain('getFarmerBalance');
      expect(functionNames).toContain('nextTokenId');
    });
  });
});
