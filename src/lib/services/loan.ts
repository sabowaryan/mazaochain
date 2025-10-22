import { createClient } from "@/lib/supabase/client";
import { tokenizationService } from "./tokenization";
import { usdcTransferService } from "./usdc-transfer";
import { transactionReceiptService } from "./transaction-receipt";
import { notificationHelpers } from "./notification-helpers";
import {
  ErrorHandler,
  MazaoChainError,
  ErrorCode,
  logger,
  retryUtils,
} from "@/lib/errors";
import type {
  LoanRequest,
  LoanEligibility,
  LoanDetails,
  LoanSummary,
  LoanApprovalRequest,
  LoanDisbursement,
  LoanRepayment,
  CollateralToken,
  RepaymentSchedule,
  InterestCalculation,
  LoanStatus,
} from "@/types/loan";

export class LoanService {
  private supabase = createClient();

  // Constants
  private readonly COLLATERAL_RATIO = 2.0; // 200% collateralization
  private readonly DEFAULT_INTEREST_RATE = 0.12; // 12% annual interest rate

  /**
   * Check loan eligibility for a farmer
   */
  async checkLoanEligibility(
    farmerId: string,
    requestedAmount: number
  ): Promise<LoanEligibility> {
    const context = ErrorHandler.createContext({
      userId: farmerId,
      additionalData: { requestedAmount, operation: "checkLoanEligibility" },
    });

    return retryUtils.forDatabase
      .execute(async () => {
        logger.info("Checking loan eligibility", { farmerId, requestedAmount });

        // Validate input parameters
        if (!farmerId) {
          throw new MazaoChainError(
            ErrorCode.VALIDATION_ERROR,
            "Farmer ID is required",
            {
              userMessage: "ID du fermier requis",
            }
          );
        }

        if (requestedAmount <= 0) {
          throw new MazaoChainError(
            ErrorCode.VALIDATION_ERROR,
            "Requested amount must be positive",
            {
              userMessage: "Le montant demandé doit être positif",
            }
          );
        }

        // Get farmer's portfolio to calculate available collateral
        const portfolio = await tokenizationService.getFarmerPortfolio(
          farmerId
        );

        const availableCollateral = portfolio.totalValue;
        const requiredCollateral = requestedAmount * this.COLLATERAL_RATIO;
        const maxLoanAmount = availableCollateral / this.COLLATERAL_RATIO;

        const isEligible = availableCollateral >= requiredCollateral;
        const reasons: string[] = [];

        if (!isEligible) {
          reasons.push(
            `Collatéral insuffisant. Requis: ${requiredCollateral} USDC, Disponible: ${availableCollateral} USDC`
          );
        }

        if (portfolio.tokens.length === 0) {
          reasons.push("Aucun token de collatéral disponible");
        }

        // Check if farmer has any active loans
        const { data: activeLoans, error } = await this.supabase
          .from("loans")
          .select("*")
          .eq("borrower_id", farmerId)
          .in("status", ["pending", "approved", "active"]);

        if (error) {
          throw new MazaoChainError(
            ErrorCode.DATABASE_ERROR,
            `Database error: ${error.message}`,
            {
              context,
              originalError: new Error(error.message),
              userMessage: "Erreur lors de la vérification des prêts existants",
            }
          );
        }

        if (activeLoans && activeLoans.length > 0) {
          reasons.push("Vous avez déjà un prêt actif ou en attente");
        }

        const result = {
          isEligible: isEligible && reasons.length === 0,
          maxLoanAmount,
          availableCollateral,
          collateralRatio: availableCollateral / requestedAmount,
          requiredCollateral,
          reasons: reasons.length > 0 ? reasons : undefined,
        };

        logger.info("Loan eligibility check completed", { farmerId, result });
        return result;
      }, "checkLoanEligibility")
      .catch((error) => {
        const mazaoError = ErrorHandler.handle(error, { context });
        logger.error("Loan eligibility check failed", mazaoError);

        return {
          isEligible: false,
          maxLoanAmount: 0,
          availableCollateral: 0,
          collateralRatio: 0,
          requiredCollateral: requestedAmount * this.COLLATERAL_RATIO,
          reasons: [mazaoError.userMessage],
        };
      });
  }

  /**
   * Create a new loan request
   */
  async createLoanRequest(
    request: LoanRequest
  ): Promise<{ success: boolean; loanId?: string; error?: string }> {
    try {
      // Check eligibility first
      const eligibility = await this.checkLoanEligibility(
        request.borrowerId,
        request.requestedAmount
      );

      if (!eligibility.isEligible) {
        return {
          success: false,
          error: eligibility.reasons?.join(", ") || "Non éligible pour ce prêt",
        };
      }

      // Calculate interest and repayment details
      const interestCalculation = this.calculateInterest(
        request.requestedAmount,
        this.DEFAULT_INTEREST_RATE,
        request.repaymentPeriodMonths
      );

      // Create loan record with calculated interest
      const { data: loan, error } = await this.supabase
        .from("loans")
        .insert({
          borrower_id: request.borrowerId,
          principal: request.requestedAmount,
          collateral_amount: eligibility.requiredCollateral,
          interest_rate: this.DEFAULT_INTEREST_RATE,
          outstanding_balance: interestCalculation.totalAmount, // Total à rembourser (principal + intérêts)
          due_date: new Date(
            Date.now() +
              request.repaymentPeriodMonths * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create loan: ${error.message}`);
      }

      // Get farmer's cooperative ID to send notification
      const { data: farmerProfile } = await this.supabase
        .from("farmer_profiles")
        .select("cooperative_id")
        .eq("user_id", request.borrowerId)
        .single();

      // Send notification to cooperative for approval
      if (farmerProfile?.cooperative_id) {
        await this.supabase.rpc("send_notification", {
          recipient_id: farmerProfile.cooperative_id,
          notification_title: "Nouvelle demande de prêt",
          notification_message: `Demande de prêt de ${request.requestedAmount} USDC en attente d'approbation`,
          notification_type: "loan_request",
        });
      }

      return {
        success: true,
        loanId: loan.id,
      };
    } catch (error) {
      console.error("Error creating loan request:", error);
      return {
        success: false,
        error: `Erreur lors de la création du prêt: ${error}`,
      };
    }
  }

  /**
   * Get loan details by ID
   */
  async getLoanById(loanId: string): Promise<LoanDetails | null> {
    try {
      const { data: loan, error } = await this.supabase
        .from("loans")
        .select(
          `
          *,
          borrower:profiles!loans_borrower_id_fkey(
            id,
            farmer_profiles!farmer_profiles_user_id_fkey(nom)
          ),
          lender:profiles!loans_lender_id_fkey(
            id,
            lender_profiles!lender_profiles_user_id_fkey(institution_name)
          )
        `
        )
        .eq("id", loanId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch loan: ${error.message}`);
      }

      // Get collateral tokens (this would need to be implemented based on how we track collateral)
      const collateralTokens = await this.getCollateralTokens(loanId);

      return {
        ...loan,
        borrower: loan.borrower
          ? {
              id: loan.borrower.id,
              nom: (loan.borrower as any).farmer_profiles?.nom || "Unknown",
              email: "email@example.com", // This would come from auth.users
            }
          : undefined,
        lender: loan.lender
          ? {
              id: loan.lender.id,
              institution_name:
                (loan.lender as any)?.lender_profiles?.institution_name ||
                "Unknown",
            }
          : undefined,
        collateralTokens,
      };
    } catch (error) {
      console.error("Error fetching loan details:", error);
      return null;
    }
  }

  /**
   * Get loans for a specific user (farmer, cooperative, or lender)
   */
  async getUserLoans(
    userId: string,
    role: "agriculteur" | "cooperative" | "preteur"
  ): Promise<LoanDetails[]> {
    try {
      let apiUrl = "/api/loans?";

      if (role === "agriculteur") {
        apiUrl += `borrower_id=${userId}`;
      } else if (role === "preteur") {
        apiUrl += `lender_id=${userId}`;
      } else if (role === "cooperative") {
        apiUrl += `cooperative_id=${userId}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      // L'API retourne { data: [...], message: '...', timestamp: '...' }
      const loans = Array.isArray(result) ? result : (result?.data || []);

      // Vérifier que loans est bien un tableau
      if (!Array.isArray(loans)) {
        console.error("Loans data is not an array:", { result, loans });
        return [];
      }

      return loans.map((loan: unknown): LoanDetails => {
        // Cast loan to any for property access
        const loanData = loan;

        // Extract borrower info from nested structure
        const borrowerInfo = (loanData as any).borrower
          ? {
              id: (loanData as any).borrower.id,
              nom:
                (loanData as any).borrower.farmer_profiles?.nom || "Agriculteur inconnu",
              email: "email@example.com",
            }
          : undefined;

        // Extract lender info
        const lenderInfo = (loanData as any).lender
          ? {
              id: (loanData as any).lender.id,
              institution_name:
                (loanData as any).lender.lender_profiles?.institution_name ||
                "Prêteur inconnu",
            }
          : undefined;

        return {
          ...(loanData as any),
          borrower: borrowerInfo,
          lender: lenderInfo,
        };
      });
    } catch (error) {
      console.error("Error fetching user loans:", error);
      return [];
    }
  }

  /**
   * Approve or reject a loan request (cooperative action)
   */
  async approveLoanRequest(
    approval: LoanApprovalRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const status: LoanStatus = approval.approved ? "approved" : "rejected";

      const { error } = await this.supabase
        .from("loans")
        .update({
          status,
          lender_id: approval.lenderId || null,
        })
        .eq("id", approval.loanId);

      if (error) {
        throw new Error(`Failed to update loan status: ${error.message}`);
      }

      // If approved, trigger automatic disbursement
      if (approval.approved && approval.lenderId) {
        const disbursementResult = await this.automaticLoanDisbursement(
          approval.loanId,
          approval.lenderId
        );

        if (!disbursementResult.success) {
          // Revert loan status if disbursement fails
          await this.supabase
            .from("loans")
            .update({ status: "approved" }) // Keep as approved but not active
            .eq("id", approval.loanId);

          console.error(
            "Automatic disbursement failed:",
            disbursementResult.error
          );
        }
      }

      // Send notification to borrower using notification helpers
      const loan = await this.getLoanById(approval.loanId);
      if (loan?.borrower) {
        await notificationHelpers.sendLoanNotification(
          loan.borrower.id,
          approval.approved ? "approved" : "rejected",
          {
            amount: loan.principal,
            loanId: approval.loanId,
          }
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error approving loan request:", error);
      return {
        success: false,
        error: `Erreur lors de l'approbation: ${error}`,
      };
    }
  }

  /**
   * Get loan summary for dashboard
   * @param userId - User ID
   * @param role - User role
   * @param loans - Optional pre-fetched loans to avoid duplicate API calls
   */
  async getLoanSummary(
    userId: string,
    role: "agriculteur" | "cooperative" | "preteur",
    loans?: LoanDetails[]
  ): Promise<LoanSummary> {
    try {
      // Use provided loans or fetch them
      const loansData = loans || (await this.getUserLoans(userId, role));

      const totalLoans = loansData.length;
      const activeLoans = loansData.filter((l) => l.status === "active").length;
      const totalBorrowed = loansData.reduce((sum, l) => sum + l.principal, 0);
      const totalRepaid = loansData
        .filter((l) => l.status === "repaid")
        .reduce((sum, l) => sum + l.principal, 0);
      const totalOutstanding = loansData
        .filter((l) => l.status === "active")
        .reduce((sum, l) => sum + l.principal, 0);
      const overdueLoans = loansData.filter(
        (l) => l.status === "active" && new Date(l.due_date) < new Date()
      ).length;

      return {
        totalLoans,
        activeLoans,
        totalBorrowed,
        totalRepaid,
        totalOutstanding,
        overdueLoans,
      };
    } catch (error) {
      console.error("Error fetching loan summary:", error);
      return {
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        totalOutstanding: 0,
        overdueLoans: 0,
      };
    }
  }

  /**
   * Calculate interest and repayment schedule
   */
  private calculateInterest(
    principal: number,
    annualRate: number,
    termMonths: number
  ): InterestCalculation {
    const monthlyRate = annualRate / 12;
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalAmount = monthlyPayment * termMonths;
    const totalInterest = totalAmount - principal;

    return {
      principal,
      annualRate,
      termMonths,
      monthlyPayment,
      totalInterest,
      totalAmount,
    };
  }

  /**
   * Get collateral tokens for a loan
   */
  private async getCollateralTokens(
    loanId: string
  ): Promise<CollateralToken[]> {
    try {
      // Get loan details
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        return [];
      }

      // Get farmer's tokenization records to find collateral tokens
      const portfolio = await tokenizationService.getFarmerPortfolio(
        loan.borrower_id || ""
      );

      // Convert portfolio tokens to collateral tokens format
      return portfolio.tokens.map((token) => ({
        tokenId: token.tokenId,
        symbol: token.symbol,
        name: token.name,
        currentValue: token.currentValue,
        cropType: token.cropType,
        harvestDate: token.harvestDate,
        isActive: token.isActive,
        evaluationId: token.evaluationId,
      }));
    } catch (error) {
      console.error("Error getting collateral tokens:", error);
      return [];
    }
  }

  /**
   * Get collateral tokens for a specific loan (public method)
   */
  async getCollateralTokensForLoan(loanId: string): Promise<CollateralToken[]> {
    return this.getCollateralTokens(loanId);
  }

  /**
   * Automated loan disbursement system
   */
  async automaticLoanDisbursement(
    loanId: string,
    lenderId: string
  ): Promise<{
    success: boolean;
    disbursementTransactionId?: string;
    escrowTransactionId?: string;
    error?: string;
  }> {
    try {
      console.log(`Starting automated disbursement for loan ${loanId}`);

      // Get loan details
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.status !== "approved") {
        throw new Error("Loan is not in approved status");
      }

      // Get borrower's wallet address
      const { data: borrowerProfile } = await this.supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", loan.borrower_id || "")
        .single();

      if (!borrowerProfile?.wallet_address) {
        throw new Error("Borrower wallet address not found");
      }

      // Get lender's wallet address
      const { data: lenderProfile } = await this.supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", lenderId)
        .single();

      if (!lenderProfile?.wallet_address) {
        throw new Error("Lender wallet address not found");
      }

      // Step 1: Escrow collateral tokens
      const collateralTokens = await this.getCollateralTokensForLoan(loanId);
      let escrowTransactionId: string | undefined;

      if (collateralTokens.length > 0) {
        const escrowResult = await usdcTransferService.escrowCollateral({
          tokenId: collateralTokens[0].tokenId,
          amount: loan.collateral_amount,
          fromAccountId: borrowerProfile.wallet_address,
          escrowAccountId: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!, // Use operator as escrow
          loanId: loanId,
        });

        if (!escrowResult.success) {
          throw new Error(`Collateral escrow failed: ${escrowResult.error}`);
        }

        escrowTransactionId = escrowResult.transactionId;

        // Record escrow transaction
        await transactionReceiptService.recordTransaction(
          loan.borrower_id || "",
          {
            loanId,
            transactionType: "escrow",
            amount: loan.collateral_amount,
            tokenType: "MAZAO",
            fromAddress: borrowerProfile.wallet_address,
            toAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
            hederaTransactionId: escrowTransactionId!,
            status: "confirmed",
            timestamp: new Date(),
          }
        );
      }

      // Step 2: Transfer USDC to borrower
      const disbursementResult = await usdcTransferService.disburseUSDC(
        borrowerProfile.wallet_address,
        loan.principal,
        loanId
      );

      if (!disbursementResult.success) {
        // If disbursement fails, try to release escrowed collateral
        if (escrowTransactionId && collateralTokens.length > 0) {
          await usdcTransferService.releaseCollateral(
            collateralTokens[0].tokenId,
            loan.collateral_amount,
            process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
            borrowerProfile.wallet_address,
            loanId
          );
        }
        throw new Error(
          `USDC disbursement failed: ${disbursementResult.error}`
        );
      }

      // Record disbursement transaction
      await transactionReceiptService.recordTransaction(
        loan.borrower_id || "",
        {
          loanId,
          transactionType: "disbursement",
          amount: loan.principal,
          tokenType: "USDC",
          fromAddress: lenderProfile.wallet_address,
          toAddress: borrowerProfile.wallet_address,
          hederaTransactionId: disbursementResult.transactionId!,
          status: "confirmed",
          timestamp: new Date(),
        }
      );

      // Step 3: Update loan status to active
      const { error: updateError } = await this.supabase
        .from("loans")
        .update({ status: "active" })
        .eq("id", loanId);

      if (updateError) {
        console.error("Failed to update loan status:", updateError);
        // Don't throw here as the transactions are already completed
      }

      // Send loan disbursement notification
      await notificationHelpers.sendLoanNotification(
        loan.borrower_id || "",
        "disbursed",
        {
          amount: loan.principal,
          loanId: loanId,
          dueDate: loan.due_date,
        }
      );

      // Step 4: Generate and send receipt
      const receiptData = {
        loanId,
        borrowerAddress: borrowerProfile.wallet_address,
        lenderAddress: lenderProfile.wallet_address,
        principalAmount: loan.principal,
        collateralAmount: loan.collateral_amount,
        collateralTokenId: collateralTokens[0]?.tokenId || "",
        disbursementTransactionId: disbursementResult.transactionId!,
        escrowTransactionId: escrowTransactionId || "",
        timestamp: new Date(),
        status: "completed" as const,
      };

      const receiptResult =
        await transactionReceiptService.generateDisbursementReceipt(
          receiptData
        );

      if (receiptResult.success) {
        // Send receipt notification
        await transactionReceiptService.sendReceiptNotification(
          loan.borrower_id || "",
          receiptData
        );
      }

      console.log(`Automated disbursement completed for loan ${loanId}`);

      return {
        success: true,
        disbursementTransactionId: disbursementResult.transactionId,
        escrowTransactionId,
      };
    } catch (error) {
      console.error("Error in automated loan disbursement:", error);

      // Record failed disbursement
      await transactionReceiptService.recordTransaction(loanId, {
        loanId,
        transactionType: "disbursement",
        amount: 0,
        tokenType: "USDC",
        fromAddress: "",
        toAddress: "",
        hederaTransactionId: "",
        status: "failed",
        timestamp: new Date(),
      });

      return {
        success: false,
        error: `Automated disbursement failed: ${error}`,
      };
    }
  }

  /**
   * Disburse loan funds (legacy method - now calls automated disbursement)
   */
  async disburseLoan(
    disbursement: LoanDisbursement
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get loan details to find lender
      const loan = await this.getLoanById(disbursement.loanId);
      if (!loan?.lender) {
        throw new Error("Loan or lender not found");
      }

      const result = await this.automaticLoanDisbursement(
        disbursement.loanId,
        loan.lender.id
      );

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error("Error disbursing loan:", error);
      return {
        success: false,
        error: `Erreur lors du décaissement: ${error}`,
      };
    }
  }

  /**
   * Process loan repayment with automatic collateral release
   */
  async repayLoan(repayment: LoanRepayment): Promise<{
    success: boolean;
    repaymentTransactionId?: string;
    collateralReleaseTransactionId?: string;
    error?: string;
  }> {
    try {
      console.log(`Processing loan repayment for loan ${repayment.loanId}`);

      // Get loan details
      const loan = await this.getLoanById(repayment.loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.status !== "active") {
        throw new Error("Loan is not active");
      }

      // Get borrower's wallet address
      const { data: borrowerProfile } = await this.supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", loan.borrower_id || "")
        .single();

      if (!borrowerProfile?.wallet_address) {
        throw new Error("Borrower wallet address not found");
      }

      // Step 1: Process USDC repayment
      const repaymentResult = await usdcTransferService.receiveUSDCPayment(
        borrowerProfile.wallet_address,
        repayment.amount,
        repayment.loanId
      );

      if (!repaymentResult.success) {
        throw new Error(`USDC repayment failed: ${repaymentResult.error}`);
      }

      // Record repayment transaction
      await transactionReceiptService.recordTransaction(
        loan.borrower_id || "",
        {
          loanId: repayment.loanId,
          transactionType: "repayment",
          amount: repayment.amount,
          tokenType: "USDC",
          fromAddress: borrowerProfile.wallet_address,
          toAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
          hederaTransactionId: repaymentResult.transactionId!,
          status: "confirmed",
          timestamp: new Date(),
        }
      );

      let collateralReleaseTransactionId: string | undefined;

      // Step 2: If full repayment, release collateral and distribute to lender
      if (repayment.paymentType === "full") {
        const collateralTokens = await this.getCollateralTokensForLoan(
          repayment.loanId
        );

        if (collateralTokens.length > 0) {
          const releaseResult = await usdcTransferService.releaseCollateral(
            collateralTokens[0].tokenId,
            loan.collateral_amount,
            process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!, // From escrow
            borrowerProfile.wallet_address,
            repayment.loanId
          );

          if (releaseResult.success) {
            collateralReleaseTransactionId = releaseResult.transactionId;

            // Record collateral release transaction
            await transactionReceiptService.recordTransaction(
              loan.borrower_id || "",
              {
                loanId: repayment.loanId,
                transactionType: "release",
                amount: loan.collateral_amount,
                tokenType: "MAZAO",
                fromAddress: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!,
                toAddress: borrowerProfile.wallet_address,
                hederaTransactionId: collateralReleaseTransactionId || "",
                status: "confirmed",
                timestamp: new Date(),
              }
            );
          } else {
            console.error("Failed to release collateral:", releaseResult.error);
            // Don't fail the entire repayment if collateral release fails
          }
        }

        // Step 3: Distribute repayment to lender if there is one
        if (loan.lender_id) {
          const { lenderService } = await import("./lender");
          const distributionResult =
            await lenderService.distributeRepaymentToLender(
              repayment.loanId,
              repayment.amount
            );

          if (!distributionResult.success) {
            console.error(
              "Failed to distribute repayment to lender:",
              distributionResult.error
            );
            // Continue with loan completion even if distribution fails
          }
        }

        // Update loan status to repaid
        const { error } = await this.supabase
          .from("loans")
          .update({ status: "repaid" })
          .eq("id", repayment.loanId);

        if (error) {
          console.error("Failed to update loan status:", error);
        }

        // Send completion notification
        await notificationHelpers.sendRepaymentNotification(
          loan.borrower_id || "",
          "completed",
          {
            amount: loan.principal,
            loanId: repayment.loanId,
          }
        );

        // Send collateral release notification
        if (collateralTokens.length > 0) {
          await notificationHelpers.sendCollateralReleaseNotification(
            loan.borrower_id || "",
            {
              tokenAmount: loan.collateral_amount,
              loanId: repayment.loanId,
            }
          );
        }
      } else {
        // Partial repayment - update outstanding balance
        // This would require adding an outstanding_balance field to the loans table
        console.log(`Partial repayment of ${repayment.amount} USDC processed`);

        // For partial repayments, we can still use the repayment notification
        // but with a different message structure
        await notificationHelpers.sendRepaymentNotification(
          loan.borrower_id || "",
          "completed", // We'll use completed for partial payments too
          {
            amount: repayment.amount,
            loanId: repayment.loanId,
          }
        );
      }

      console.log(
        `Loan repayment processed successfully for loan ${repayment.loanId}`
      );

      return {
        success: true,
        repaymentTransactionId: repaymentResult.transactionId,
        collateralReleaseTransactionId,
      };
    } catch (error) {
      console.error("Error processing repayment:", error);

      // Record failed repayment
      await transactionReceiptService.recordTransaction(repayment.loanId, {
        loanId: repayment.loanId,
        transactionType: "repayment",
        amount: repayment.amount,
        tokenType: "USDC",
        fromAddress: "",
        toAddress: "",
        hederaTransactionId: "",
        status: "failed",
        timestamp: new Date(),
      });

      return {
        success: false,
        error: `Erreur lors du remboursement: ${error}`,
      };
    }
  }

  /**
   * Retry failed disbursement
   */
  async retryFailedDisbursement(
    loanId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.status !== "approved") {
        throw new Error("Loan is not in approved status for retry");
      }

      if (!loan.lender) {
        throw new Error("No lender assigned to loan");
      }

      const result = await this.automaticLoanDisbursement(
        loanId,
        loan.lender.id
      );

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error("Error retrying failed disbursement:", error);
      return {
        success: false,
        error: `Failed to retry disbursement: ${error}`,
      };
    }
  }

  /**
   * Get transaction status for a loan
   */
  async getLoanTransactionStatus(loanId: string): Promise<{
    disbursement?: { status: string; transactionId?: string };
    escrow?: { status: string; transactionId?: string };
    repayment?: { status: string; transactionId?: string };
    collateralRelease?: { status: string; transactionId?: string };
  }> {
    try {
      const transactions = await transactionReceiptService.getLoanTransactions(
        loanId
      );

      const result: {
        disbursement?: { status: string; transactionId?: string };
        escrow?: { status: string; transactionId?: string };
        repayment?: { status: string; transactionId?: string };
        collateralRelease?: { status: string; transactionId?: string };
      } = {};

      transactions.forEach((tx) => {
        switch (tx.transaction_type) {
          case "disbursement":
            result.disbursement = {
              status: tx.status || "unknown",
              transactionId: tx.hedera_transaction_id || undefined,
            };
            break;
          case "escrow":
            result.escrow = {
              status: tx.status || "unknown",
              transactionId: tx.hedera_transaction_id || undefined,
            };
            break;
          case "repayment":
            result.repayment = {
              status: tx.status || "unknown",
              transactionId: tx.hedera_transaction_id || undefined,
            };
            break;
          case "release":
            result.collateralRelease = {
              status: tx.status || "unknown",
              transactionId: tx.hedera_transaction_id || undefined,
            };
            break;
        }
      });

      return result;
    } catch (error) {
      console.error("Error getting loan transaction status:", error);
      return {};
    }
  }

  /**
   * Generate repayment schedule for a loan
   */
  async generateRepaymentSchedule(
    loanId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        return { success: false, error: "Loan not found" };
      }

      // Calculate term in months (assuming 12 months for now)
      const termMonths = 12;

      // Call the database function to generate schedule
      const { error } = await this.supabase.rpc("generate_repayment_schedule", {
        p_loan_id: loanId,
        p_principal: loan.principal,
        p_interest_rate: loan.interest_rate,
        p_term_months: termMonths,
      });

      if (error) {
        throw new Error(
          `Failed to generate repayment schedule: ${error.message}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error generating repayment schedule:", error);
      return {
        success: false,
        error: `Failed to generate repayment schedule: ${error}`,
      };
    }
  }

  /**
   * Get repayment schedule for a loan
   */
  async getRepaymentSchedule(loanId: string): Promise<RepaymentSchedule[]> {
    try {
      const { data, error } = await this.supabase
        .from("repayment_schedule")
        .select("*")
        .eq("loan_id", loanId)
        .order("installment_number");

      if (error) {
        throw new Error(`Failed to fetch repayment schedule: ${error.message}`);
      }

      return (
        data?.map((item) => ({
          id: item.id,
          loanId: item.loan_id || "",
          installmentNumber: item.installment_number,
          dueDate: item.due_date,
          principalAmount: item.principal_amount,
          interestAmount: item.interest_amount,
          totalAmount: item.total_amount,
          status: item.status as "pending" | "paid" | "overdue",
          paidAt: item.paid_at || undefined,
          paidAmount: item.paid_amount || undefined,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching repayment schedule:", error);
      return [];
    }
  }

  /**
   * Get outstanding balance for a loan
   */
  async getOutstandingBalance(loanId: string): Promise<{
    principal: number;
    interest: number;
    total: number;
    nextPaymentDue?: string;
  }> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        return { principal: 0, interest: 0, total: 0 };
      }

      // Get current outstanding balance from database
      const { data: loanData } = await this.supabase
        .from("loans")
        .select("outstanding_balance, total_repaid, next_payment_due")
        .eq("id", loanId)
        .single();

      const outstandingPrincipal =
        loanData?.outstanding_balance || loan.principal;

      // Calculate accrued interest (simplified - in real app would be more complex)
      const monthsElapsed = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(loan.created_at || "").getTime()) /
            (30 * 24 * 60 * 60 * 1000)
        )
      );
      const accruedInterest =
        outstandingPrincipal * loan.interest_rate * (monthsElapsed / 12);

      return {
        principal: outstandingPrincipal,
        interest: accruedInterest,
        total: outstandingPrincipal + accruedInterest,
        nextPaymentDue: loanData?.next_payment_due || undefined,
      };
    } catch (error) {
      console.error("Error calculating outstanding balance:", error);
      return { principal: 0, interest: 0, total: 0 };
    }
  }

  /**
   * Mark repayment schedule installment as paid
   */
  async markInstallmentPaid(
    installmentId: string,
    paidAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("repayment_schedule")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount,
        })
        .eq("id", installmentId);

      if (error) {
        throw new Error(`Failed to mark installment as paid: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error marking installment as paid:", error);
      return {
        success: false,
        error: `Failed to update installment: ${error}`,
      };
    }
  }

  /**
   * Validate loan before disbursement
   */
  async validateLoanForDisbursement(loanId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check loan exists and is approved
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        errors.push("Loan not found");
        return { isValid: false, errors };
      }

      if (loan.status !== "approved") {
        errors.push(`Loan status is ${loan.status}, expected 'approved'`);
      }

      // Check borrower has wallet
      const { data: borrowerProfile } = await this.supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", loan.borrower_id || "")
        .single();

      if (!borrowerProfile?.wallet_address) {
        errors.push("Borrower wallet address not found");
      }

      // Check lender exists and has wallet
      if (!loan.lender) {
        errors.push("No lender assigned to loan");
      } else {
        const { data: lenderProfile } = await this.supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", loan.lender.id)
          .single();

        if (!lenderProfile?.wallet_address) {
          errors.push("Lender wallet address not found");
        }
      }

      // Check collateral tokens exist
      const collateralTokens = await this.getCollateralTokensForLoan(loanId);
      if (collateralTokens.length === 0) {
        errors.push("No collateral tokens found for loan");
      }

      // Validate collateral value
      const eligibility = await this.checkLoanEligibility(
        loan.borrower_id || "",
        loan.principal
      );
      if (!eligibility.isEligible) {
        errors.push(
          `Loan no longer eligible: ${eligibility.reasons?.join(", ")}`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error("Error validating loan for disbursement:", error);
      errors.push(`Validation error: ${error}`);
      return { isValid: false, errors };
    }
  }
}

// Export singleton instance
export const loanService = new LoanService();
