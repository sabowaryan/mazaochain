import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar
} from "@hashgraph/sdk";
import { env } from "@/lib/config/env";

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

class MazaoContractsService {
  private client!: Client;
  private operatorAccountId!: AccountId;
  private operatorPrivateKey!: PrivateKey;
  private tokenFactoryId!: string;
  private loanManagerId!: string;

  constructor() {
    // Lazy initialization
  }

  private initializeClient() {
    if (!this.client) {
      try {
        // Initialize Hedera client
        this.client = env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
          ? Client.forMainnet()
          : Client.forTestnet();

        // Set operator account
        this.operatorAccountId = AccountId.fromString(env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID);
        this.operatorPrivateKey = PrivateKey.fromStringECDSA(env.HEDERA_PRIVATE_KEY);
        
        this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);

        // Set contract IDs from deployed contracts
        this.tokenFactoryId = env.NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID || '0.0.6913792';
        this.loanManagerId = env.NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID || '0.0.6913794';

        console.log('MazaoContracts initialized:', {
          network: env.NEXT_PUBLIC_HEDERA_NETWORK,
          account: this.operatorAccountId.toString(),
          tokenFactory: this.tokenFactoryId,
          loanManager: this.loanManagerId
        });
      } catch (error) {
        console.error('Failed to initialize MazaoContracts client:', error);
        throw new Error('MazaoContracts client initialization failed');
      }
    }
  }

  /**
   * Create a new crop token using MazaoTokenFactory
   */
  async createCropToken(
    farmerAddress: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    tokenSymbol: string
  ): Promise<ContractInteractionResult> {
    this.initializeClient();
    
    try {
      console.log('Creating crop token:', {
        farmer: farmerAddress,
        value: estimatedValue,
        crop: cropType,
        symbol: tokenSymbol
      });

      const createTokenTx = new ContractExecuteTransaction()
        .setContractId(this.tokenFactoryId)
        .setGas(1000000)
        .setFunction("createCropToken",
          new ContractFunctionParameters()
            .addAddress(farmerAddress)
            .addUint256(estimatedValue)
            .addString(cropType)
            .addUint256(harvestDate)
            .addString(tokenSymbol)
        );

      const response = await createTokenTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status.toString() === "SUCCESS") {
        // Get the new token ID by querying nextTokenId
        const nextTokenIdQuery = new ContractCallQuery()
          .setContractId(this.tokenFactoryId)
          .setGas(100000)
          .setFunction("nextTokenId");

        const result = await nextTokenIdQuery.execute(this.client);
        const nextTokenId = result.getUint256(0);
        const createdTokenId = (Number(nextTokenId) - 1).toString();

        console.log(`Crop token created successfully: ${createdTokenId}`);

        return {
          success: true,
          transactionId: response.transactionId.toString(),
          data: { tokenId: createdTokenId }
        };
      } else {
        throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
      }
    } catch (error) {
      console.error("Error creating crop token:", error);
      return {
        success: false,
        error: `Failed to create crop token: ${error}`
      };
    }
  }

  /**
   * Mint tokens for a farmer
   */
  async mintTokens(
    tokenId: string,
    amount: number,
    recipientAddress: string
  ): Promise<ContractInteractionResult> {
    this.initializeClient();
    
    try {
      console.log('Minting tokens:', { tokenId, amount, recipient: recipientAddress });

      const mintTokensTx = new ContractExecuteTransaction()
        .setContractId(this.tokenFactoryId)
        .setGas(800000)
        .setFunction("mintTokens",
          new ContractFunctionParameters()
            .addUint256(Number(tokenId))
            .addUint256(amount)
            .addAddress(recipientAddress)
        );

      const response = await mintTokensTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status.toString() === "SUCCESS") {
        console.log(`Tokens minted successfully: ${amount} tokens for ${recipientAddress}`);

        return {
          success: true,
          transactionId: response.transactionId.toString(),
          data: { tokenId, amount, recipient: recipientAddress }
        };
      } else {
        throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
      return {
        success: false,
        error: `Failed to mint tokens: ${error}`
      };
    }
  }

  /**
   * Get farmer's balance for a specific token
   */
  async getFarmerBalanceForToken(
    farmerAddress: string,
    tokenId: string
  ): Promise<number> {
    this.initializeClient();
    
    try {
      const balanceQuery = new ContractCallQuery()
        .setContractId(this.tokenFactoryId)
        .setGas(100000)
        .setFunction("getFarmerBalanceForToken",
          new ContractFunctionParameters()
            .addAddress(farmerAddress)
            .addUint256(Number(tokenId))
        );

      const result = await balanceQuery.execute(this.client);
      const balance = result.getUint256(0);
      
      return parseInt(balance.toString());
    } catch (error) {
      console.error("Error getting farmer balance:", error);
      return 0;
    }
  }

  /**
   * Get farmer's total balance across all tokens
   */
  async getFarmerTotalBalance(farmerAddress: string): Promise<number> {
    this.initializeClient();
    
    try {
      const balanceQuery = new ContractCallQuery()
        .setContractId(this.tokenFactoryId)
        .setGas(100000)
        .setFunction("getFarmerBalance",
          new ContractFunctionParameters()
            .addAddress(farmerAddress)
        );

      const result = await balanceQuery.execute(this.client);
      const balance = result.getUint256(0);
      
      return parseInt(balance.toString());
    } catch (error) {
      console.error("Error getting farmer total balance:", error);
      return 0;
    }
  }

  /**
   * Get token details
   */
  async getTokenDetails(tokenId: string): Promise<MazaoTokenInfo | null> {
    this.initializeClient();
    
    try {
      const tokenQuery = new ContractCallQuery()
        .setContractId(this.tokenFactoryId)
        .setGas(150000)
        .setFunction("getTokenDetails",
          new ContractFunctionParameters()
            .addUint256(Number(tokenId))
        );

      const result = await tokenQuery.execute(this.client);
      
      return {
        tokenId,
        farmer: result.getAddress(0),
        estimatedValue: parseInt(result.getUint256(1).toString()),
        cropType: result.getString(2),
        harvestDate: parseInt(result.getUint256(3).toString()),
        isActive: result.getBool(4),
        totalSupply: parseInt(result.getUint256(5).toString()),
        createdAt: parseInt(result.getUint256(6).toString()),
        tokenSymbol: result.getString(7)
      };
    } catch (error) {
      console.error("Error getting token details:", error);
      return null;
    }
  }

  /**
   * Request a loan using crop tokens as collateral
   */
  async requestLoan(
    collateralTokenId: string,
    principal: number,
    duration: number,
    interestRate: number
  ): Promise<ContractInteractionResult> {
    this.initializeClient();
    
    try {
      console.log('Requesting loan:', {
        collateral: collateralTokenId,
        principal,
        duration,
        rate: interestRate
      });

      const loanRequestTx = new ContractExecuteTransaction()
        .setContractId(this.loanManagerId)
        .setGas(1200000)
        .setFunction("requestLoan",
          new ContractFunctionParameters()
            .addUint256(Number(collateralTokenId))
            .addUint256(principal)
            .addUint256(duration)
            .addUint256(interestRate)
        );

      const response = await loanRequestTx.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status.toString() === "SUCCESS") {
        // Get the new loan ID
        const nextLoanIdQuery = new ContractCallQuery()
          .setContractId(this.loanManagerId)
          .setGas(100000)
          .setFunction("nextLoanId");

        const result = await nextLoanIdQuery.execute(this.client);
        const nextLoanId = result.getUint256(0);
        const createdLoanId = (Number(nextLoanId) - 1).toString();

        console.log(`Loan requested successfully: ${createdLoanId}`);

        return {
          success: true,
          transactionId: response.transactionId.toString(),
          data: { loanId: createdLoanId }
        };
      } else {
        throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
      }
    } catch (error) {
      console.error("Error requesting loan:", error);
      return {
        success: false,
        error: `Failed to request loan: ${error}`
      };
    }
  }

  /**
   * Get loan details
   */
  async getLoanDetails(loanId: string): Promise<LoanInfo | null> {
    this.initializeClient();
    
    try {
      const loanQuery = new ContractCallQuery()
        .setContractId(this.loanManagerId)
        .setGas(150000)
        .setFunction("getLoan",
          new ContractFunctionParameters()
            .addUint256(Number(loanId))
        );

      const result = await loanQuery.execute(this.client);
      
      return {
        loanId,
        borrower: result.getAddress(0),
        collateralTokenId: result.getUint256(1).toString(),
        principal: parseInt(result.getUint256(2).toString()),
        duration: parseInt(result.getUint256(3).toString()),
        interestRate: parseInt(result.getUint256(4).toString()),
        status: parseInt(result.getUint8(5).toString()),
        createdAt: parseInt(result.getUint256(6).toString())
      };
    } catch (error) {
      console.error("Error getting loan details:", error);
      return null;
    }
  }

  /**
   * Get next token ID (for UI display)
   */
  async getNextTokenId(): Promise<number> {
    this.initializeClient();
    
    try {
      const query = new ContractCallQuery()
        .setContractId(this.tokenFactoryId)
        .setGas(100000)
        .setFunction("nextTokenId");

      const result = await query.execute(this.client);
      return parseInt(result.getUint256(0).toString());
    } catch (error) {
      console.error("Error getting next token ID:", error);
      return 0;
    }
  }

  /**
   * Get next loan ID (for UI display)
   */
  async getNextLoanId(): Promise<number> {
    this.initializeClient();
    
    try {
      const query = new ContractCallQuery()
        .setContractId(this.loanManagerId)
        .setGas(100000)
        .setFunction("nextLoanId");

      const result = await query.execute(this.client);
      return parseInt(result.getUint256(0).toString());
    } catch (error) {
      console.error("Error getting next loan ID:", error);
      return 0;
    }
  }

  /**
   * Complete tokenization process for approved evaluation
   */
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
    try {
      console.log(`Starting tokenization for evaluation ${evaluationId}`);

      // Step 1: Create the crop token
      const tokenSymbol = `${cropType.toUpperCase()}-${farmerId.slice(-6)}`;
      const createResult = await this.createCropToken(
        farmerAddress,
        estimatedValue,
        cropType,
        harvestDate,
        tokenSymbol
      );

      if (!createResult.success) {
        throw new Error(createResult.error);
      }

      const tokenId = (createResult.data as any)?.tokenId;
      if (!tokenId) {
        throw new Error("No token ID returned from creation");
      }

      // Step 2: Mint tokens based on estimated value
      const mintResult = await this.mintTokens(
        tokenId,
        estimatedValue,
        farmerAddress
      );

      if (!mintResult.success) {
        throw new Error(mintResult.error);
      }

      const transactionIds = [
        createResult.transactionId,
        mintResult.transactionId
      ].filter(Boolean) as string[];

      console.log(`Tokenization completed for evaluation ${evaluationId}`);

      return {
        success: true,
        tokenId,
        transactionIds
      };
    } catch (error) {
      console.error("Error in tokenization process:", error);
      return {
        success: false,
        error: `Tokenization failed: ${error}`
      };
    }
  }
}

// Export singleton instance
export const mazaoContractsService = new MazaoContractsService();