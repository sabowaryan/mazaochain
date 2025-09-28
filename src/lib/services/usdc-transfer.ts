import {
  Client,
  TransferTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  TokenId,
  TransactionResponse,
  TransactionReceipt,
  Status,
} from "@hashgraph/sdk";
import { env } from "@/lib/config/env";

export interface USDCTransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number; // Amount in USDC (will be converted to smallest unit)
  memo?: string;
}

export interface USDCTransferResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  fromAccount?: string;
  toAccount?: string;
  error?: string;
  receipt?: TransactionReceipt;
}

export interface EscrowRequest {
  tokenId: string;
  amount: number;
  fromAccountId: string;
  escrowAccountId: string;
  loanId: string;
}

export interface EscrowResult {
  success: boolean;
  transactionId?: string;
  tokenId?: string;
  amount?: number;
  error?: string;
}

class USDCTransferService {
  private client!: Client;
  private operatorAccountId!: AccountId;
  private operatorPrivateKey!: PrivateKey;
  
  // USDC token ID on Hedera testnet (this would be different on mainnet)
  private readonly USDC_TOKEN_ID = "0.0.456858"; // Example testnet USDC token ID
  private readonly USDC_DECIMALS = 6; // USDC has 6 decimal places

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
   * Transfer USDC from one account to another
   */
  async transferUSDC(request: USDCTransferRequest): Promise<USDCTransferResult> {
    this.initializeClient();
    
    try {
      console.log(`Initiating USDC transfer: ${request.amount} USDC from ${request.fromAccountId} to ${request.toAccountId}`);

      // Convert USDC amount to smallest unit (considering 6 decimals)
      const transferAmount = Math.floor(request.amount * Math.pow(10, this.USDC_DECIMALS));

      if (transferAmount <= 0) {
        throw new Error("Transfer amount must be greater than 0");
      }

      // Create transfer transaction
      const transferTx = new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(this.USDC_TOKEN_ID),
          AccountId.fromString(request.fromAccountId),
          -transferAmount
        )
        .addTokenTransfer(
          TokenId.fromString(this.USDC_TOKEN_ID),
          AccountId.fromString(request.toAccountId),
          transferAmount
        )
        .setTransactionMemo(request.memo || `USDC transfer: ${request.amount}`)
        .setMaxTransactionFee(new Hbar(20));

      // Execute transaction
      const transferSubmit = await transferTx.execute(this.client);
      const transferReceipt = await transferSubmit.getReceipt(this.client);

      if (transferReceipt.status !== Status.Success) {
        throw new Error(`Transaction failed with status: ${transferReceipt.status}`);
      }

      console.log(`USDC transfer successful: ${transferSubmit.transactionId.toString()}`);

      return {
        success: true,
        transactionId: transferSubmit.transactionId.toString(),
        amount: request.amount,
        fromAccount: request.fromAccountId,
        toAccount: request.toAccountId,
        receipt: transferReceipt,
      };
    } catch (error) {
      console.error("Error transferring USDC:", error);
      return {
        success: false,
        error: `USDC transfer failed: ${error}`,
      };
    }
  }

  /**
   * Transfer USDC from operator account (for loan disbursement)
   */
  async disburseUSDC(
    toAccountId: string,
    amount: number,
    loanId: string
  ): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId: this.operatorAccountId.toString(),
      toAccountId,
      amount,
      memo: `Loan disbursement - Loan ID: ${loanId}`,
    });
  }

  /**
   * Receive USDC payment (for loan repayment)
   */
  async receiveUSDCPayment(
    fromAccountId: string,
    amount: number,
    loanId: string
  ): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId,
      toAccountId: this.operatorAccountId.toString(),
      amount,
      memo: `Loan repayment - Loan ID: ${loanId}`,
    });
  }

  /**
   * Escrow collateral tokens for a loan
   */
  async escrowCollateral(request: EscrowRequest): Promise<EscrowResult> {
    this.initializeClient();
    
    try {
      console.log(`Escrowing collateral: ${request.amount} tokens of ${request.tokenId} for loan ${request.loanId}`);

      // Convert amount to token units (assuming 6 decimals for MazaoTokens)
      const tokenAmount = Math.floor(request.amount * Math.pow(10, 6));

      if (tokenAmount <= 0) {
        throw new Error("Escrow amount must be greater than 0");
      }

      // Create transfer transaction to move tokens to escrow
      const escrowTx = new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(request.tokenId),
          AccountId.fromString(request.fromAccountId),
          -tokenAmount
        )
        .addTokenTransfer(
          TokenId.fromString(request.tokenId),
          AccountId.fromString(request.escrowAccountId),
          tokenAmount
        )
        .setTransactionMemo(`Collateral escrow - Loan ID: ${request.loanId}`)
        .setMaxTransactionFee(new Hbar(20));

      // Execute transaction
      const escrowSubmit = await escrowTx.execute(this.client);
      const escrowReceipt = await escrowSubmit.getReceipt(this.client);

      if (escrowReceipt.status !== Status.Success) {
        throw new Error(`Escrow transaction failed with status: ${escrowReceipt.status}`);
      }

      console.log(`Collateral escrowed successfully: ${escrowSubmit.transactionId.toString()}`);

      return {
        success: true,
        transactionId: escrowSubmit.transactionId.toString(),
        tokenId: request.tokenId,
        amount: request.amount,
      };
    } catch (error) {
      console.error("Error escrowing collateral:", error);
      return {
        success: false,
        error: `Collateral escrow failed: ${error}`,
      };
    }
  }

  /**
   * Release collateral tokens from escrow
   */
  async releaseCollateral(
    tokenId: string,
    amount: number,
    escrowAccountId: string,
    toAccountId: string,
    loanId: string
  ): Promise<EscrowResult> {
    this.initializeClient();
    
    try {
      console.log(`Releasing collateral: ${amount} tokens of ${tokenId} from escrow for loan ${loanId}`);

      // Convert amount to token units
      const tokenAmount = Math.floor(amount * Math.pow(10, 6));

      // Create transfer transaction to release tokens from escrow
      const releaseTx = new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          AccountId.fromString(escrowAccountId),
          -tokenAmount
        )
        .addTokenTransfer(
          TokenId.fromString(tokenId),
          AccountId.fromString(toAccountId),
          tokenAmount
        )
        .setTransactionMemo(`Collateral release - Loan ID: ${loanId}`)
        .setMaxTransactionFee(new Hbar(20));

      // Execute transaction
      const releaseSubmit = await releaseTx.execute(this.client);
      const releaseReceipt = await releaseSubmit.getReceipt(this.client);

      if (releaseReceipt.status !== Status.Success) {
        throw new Error(`Release transaction failed with status: ${releaseReceipt.status}`);
      }

      console.log(`Collateral released successfully: ${releaseSubmit.transactionId.toString()}`);

      return {
        success: true,
        transactionId: releaseSubmit.transactionId.toString(),
        tokenId,
        amount,
      };
    } catch (error) {
      console.error("Error releasing collateral:", error);
      return {
        success: false,
        error: `Collateral release failed: ${error}`,
      };
    }
  }

  /**
   * Get USDC balance for an account
   */
  async getUSDCBalance(accountId: string): Promise<number> {
    this.initializeClient();
    
    try {
      const { AccountBalanceQuery } = await import("@hashgraph/sdk");
      
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));

      const balance = await balanceQuery.execute(this.client);
      
      if (balance.tokens) {
        const tokenId = TokenId.fromString(this.USDC_TOKEN_ID);
        const usdcBalance = (balance.tokens as unknown).get(tokenId);
        return usdcBalance ? Number(usdcBalance) / Math.pow(10, this.USDC_DECIMALS) : 0;
      }

      return 0;
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      return 0;
    }
  }

  /**
   * Validate account has sufficient USDC balance
   */
  async validateSufficientBalance(accountId: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getUSDCBalance(accountId);
      return balance >= requiredAmount;
    } catch (error) {
      console.error("Error validating balance:", error);
      return false;
    }
  }

  /**
   * Escrow lender funds for a loan opportunity
   */
  async escrowLenderFunds(request: {
    amount: number;
    fromAccountId: string;
    escrowAccountId: string;
    loanId: string;
    lenderId: string;
  }): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId: request.fromAccountId,
      toAccountId: request.escrowAccountId,
      amount: request.amount,
      memo: `Lender fund escrow - Loan ID: ${request.loanId}, Lender: ${request.lenderId}`,
    });
  }

  /**
   * Release lender funds from escrow (if loan commitment is cancelled)
   */
  async releaseLenderFunds(
    amount: number,
    escrowAccountId: string,
    toAccountId: string,
    loanId: string
  ): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId: escrowAccountId,
      toAccountId,
      amount,
      memo: `Lender fund release - Loan ID: ${loanId}`,
    });
  }

  /**
   * Transfer USDC to lender (for repayment distribution)
   */
  async transferUSDCToLender(
    lenderAccountId: string,
    amount: number,
    loanId: string
  ): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId: this.operatorAccountId.toString(),
      toAccountId: lenderAccountId,
      amount,
      memo: `Repayment distribution - Loan ID: ${loanId}`,
    });
  }

  /**
   * Liquidate collateral and transfer proceeds to lender
   */
  async liquidateCollateralToLender(
    lenderAccountId: string,
    liquidationAmount: number,
    loanId: string,
    collateralTokenId: string
  ): Promise<USDCTransferResult> {
    return this.transferUSDC({
      fromAccountId: this.operatorAccountId.toString(),
      toAccountId: lenderAccountId,
      amount: liquidationAmount,
      memo: `Collateral liquidation - Loan ID: ${loanId}, Token: ${collateralTokenId}`,
    });
  }
}

// Export singleton instance
export const usdcTransferService = new USDCTransferService();