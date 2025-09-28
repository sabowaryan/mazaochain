import {
  Client,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
  PrivateKey,
  Hbar,
  TransactionResponse,
  TokenId,
  TokenInfoQuery,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
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

export interface TokenAssociationResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface FarmerTokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
  cropType: string;
  estimatedValue: number;
  harvestDate: number;
  isActive: boolean;
}

class HederaTokenService {
  private client!: Client;
  private operatorAccountId!: AccountId;
  private operatorPrivateKey!: PrivateKey;

  constructor() {
    // Lazy initialization - will be done when first method is called
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
        this.operatorPrivateKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY);
        
        this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
      } catch (error) {
        console.error('Failed to initialize Hedera client:', error);
        throw new Error('Hedera client initialization failed');
      }
    }
  }

  /**
   * Create a new MazaoToken for a specific crop evaluation
   */
  async createMazaoToken(
    cropType: string,
    farmerId: string,
    estimatedValue: number,
    harvestDate: number
  ): Promise<MazaoTokenInfo> {
    this.initializeClient();
    
    try {
      const tokenName = `MazaoToken-${cropType}-${farmerId.slice(-6)}`;
      const tokenSymbol = `MAZAO-${cropType.toUpperCase()}`;

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(6) // 6 decimal places for precision
        .setInitialSupply(0) // Start with 0 supply, mint later
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(this.operatorAccountId)
        .setAdminKey(this.operatorPrivateKey)
        .setSupplyKey(this.operatorPrivateKey)
        .setMaxTransactionFee(new Hbar(30));

      const tokenCreateSubmit = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error("Failed to create token - no token ID returned");
      }

      console.log(`Created MazaoToken: ${tokenId.toString()}`);

      return {
        tokenId: tokenId.toString(),
        name: tokenName,
        symbol: tokenSymbol,
        decimals: 6,
        totalSupply: "0",
        treasuryAccountId: this.operatorAccountId.toString(),
      };
    } catch (error) {
      console.error("Error creating MazaoToken:", error);
      throw new Error(`Failed to create MazaoToken: ${error}`);
    }
  }

  /**
   * Mint MazaoTokens based on crop evaluation value
   */
  async mintMazaoTokens(
    tokenId: string,
    amount: number,
    farmerId: string
  ): Promise<TokenMintResult> {
    this.initializeClient();
    
    try {
      // Convert amount to token units (considering 6 decimals)
      const tokenAmount = Math.floor(amount * 1000000); // Convert to smallest unit

      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setAmount(tokenAmount)
        .setMaxTransactionFee(new Hbar(20));

      const tokenMintSubmit = await tokenMintTx.execute(this.client);
      const tokenMintReceipt = await tokenMintSubmit.getReceipt(this.client);

      console.log(`Minted ${amount} MazaoTokens for farmer ${farmerId}`);

      return {
        success: true,
        transactionId: tokenMintSubmit.transactionId.toString(),
        tokenId,
        amount,
      };
    } catch (error) {
      console.error("Error minting MazaoTokens:", error);
      return {
        success: false,
        error: `Failed to mint tokens: ${error}`,
      };
    }
  }

  /**
   * Associate token with farmer's wallet
   */
  async associateTokenWithWallet(
    tokenId: string,
    farmerAccountId: string
  ): Promise<TokenAssociationResult> {
    this.initializeClient();
    
    try {
      // For now, we'll use the operator account to associate the token
      // In a real implementation, this would be done through the farmer's wallet
      const tokenAssociateTx = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(farmerAccountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .setMaxTransactionFee(new Hbar(20));

      // This would need to be signed by the farmer's wallet in production
      const tokenAssociateSubmit = await tokenAssociateTx.execute(this.client);
      const tokenAssociateReceipt = await tokenAssociateSubmit.getReceipt(this.client);

      console.log(`Associated token ${tokenId} with farmer account ${farmerAccountId}`);

      return {
        success: true,
        transactionId: tokenAssociateSubmit.transactionId.toString(),
      };
    } catch (error) {
      console.error("Error associating token with wallet:", error);
      return {
        success: false,
        error: `Failed to associate token: ${error}`,
      };
    }
  }

  /**
   * Transfer minted tokens to farmer's wallet
   */
  async transferTokensToFarmer(
    tokenId: string,
    amount: number,
    farmerAccountId: string
  ): Promise<TokenMintResult> {
    this.initializeClient();
    
    try {
      // Import TransferTransaction
      const { TransferTransaction } = await import("@hashgraph/sdk");
      
      // Convert amount to token units (considering 6 decimals)
      const tokenAmount = Math.floor(amount * 1000000);

      const transferTx = new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          this.operatorAccountId,
          -tokenAmount
        )
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          AccountId.fromString(farmerAccountId),
          tokenAmount
        )
        .setMaxTransactionFee(new Hbar(20));

      const transferSubmit = await transferTx.execute(this.client);
      const transferReceipt = await transferSubmit.getReceipt(this.client);

      console.log(`Transferred ${amount} MazaoTokens to farmer ${farmerAccountId}`);

      return {
        success: true,
        transactionId: transferSubmit.transactionId.toString(),
        tokenId,
        amount,
      };
    } catch (error) {
      console.error("Error transferring tokens to farmer:", error);
      return {
        success: false,
        error: `Failed to transfer tokens: ${error}`,
      };
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenId: string): Promise<MazaoTokenInfo | null> {
    this.initializeClient();
    
    try {
      const tokenInfoQuery = new TokenInfoQuery()
        .setTokenId(TokenId.fromString(tokenId));

      const tokenInfo = await tokenInfoQuery.execute(this.client);

      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply.toString(),
        treasuryAccountId: tokenInfo.treasuryAccountId?.toString() || "",
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      return null;
    }
  }

  /**
   * Get farmer's token balances
   */
  async getFarmerTokenBalances(farmerAccountId: string): Promise<FarmerTokenBalance[]> {
    this.initializeClient();
    
    try {
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(farmerAccountId));

      const balance = await balanceQuery.execute(this.client);
      const tokenBalances: FarmerTokenBalance[] = [];

      // Convert Hedera token balances to our format
      if (balance.tokens) {
        for (const [tokenId, tokenBalance] of Object.entries(balance.tokens)) {
          const tokenInfo = await this.getTokenInfo(tokenId.toString());
          
          if (tokenInfo && tokenInfo.symbol.startsWith("MAZAO-")) {
            // Extract crop type from symbol
            const cropType = tokenInfo.symbol.replace("MAZAO-", "").toLowerCase();
            
            tokenBalances.push({
              tokenId: tokenId.toString(),
              balance: tokenBalance.toString(),
              decimals: tokenInfo.decimals,
              cropType,
              estimatedValue: 0, // This would be fetched from the database
              harvestDate: 0, // This would be fetched from the database
              isActive: true,
            });
          }
        }
      }

      return tokenBalances;
    } catch (error) {
      console.error("Error getting farmer token balances:", error);
      return [];
    }
  }

  /**
   * Complete tokenization process for approved evaluation
   */
  async tokenizeApprovedEvaluation(
    evaluationId: string,
    cropType: string,
    farmerId: string,
    farmerAccountId: string,
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

      // Step 1: Create the MazaoToken
      const tokenInfo = await this.createMazaoToken(
        cropType,
        farmerId,
        estimatedValue,
        harvestDate
      );

      // Step 2: Associate token with farmer's wallet
      const associationResult = await this.associateTokenWithWallet(
        tokenInfo.tokenId,
        farmerAccountId
      );

      if (!associationResult.success) {
        throw new Error(associationResult.error);
      }

      // Step 3: Mint tokens based on estimated value
      const mintResult = await this.mintMazaoTokens(
        tokenInfo.tokenId,
        estimatedValue,
        farmerId
      );

      if (!mintResult.success) {
        throw new Error(mintResult.error);
      }

      // Step 4: Transfer tokens to farmer
      const transferResult = await this.transferTokensToFarmer(
        tokenInfo.tokenId,
        estimatedValue,
        farmerAccountId
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error);
      }

      const transactionIds = [
        associationResult.transactionId,
        mintResult.transactionId,
        transferResult.transactionId,
      ].filter(Boolean) as string[];

      console.log(`Tokenization completed for evaluation ${evaluationId}`);

      return {
        success: true,
        tokenId: tokenInfo.tokenId,
        transactionIds,
      };
    } catch (error) {
      console.error("Error in tokenization process:", error);
      return {
        success: false,
        error: `Tokenization failed: ${error}`,
      };
    }
  }
}

// Export singleton instance
export const hederaTokenService = new HederaTokenService();