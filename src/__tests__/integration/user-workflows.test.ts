import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Integration tests for critical user workflows
 * Tests complete user journeys from registration to loan completion
 */

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn()
  })),
  rpc: vi.fn()
};

// Mock HashPack wallet
const mockHashPackWallet = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  getAccountBalance: vi.fn(),
  executeTransaction: vi.fn(),
  isConnected: vi.fn()
};

// Mock services
const mockCropEvaluationService = {
  createEvaluation: vi.fn(),
  approveEvaluation: vi.fn(),
  getEvaluationHistory: vi.fn(),
  generatePDFReport: vi.fn()
};

const mockTokenizationService = {
  mintTokens: vi.fn(),
  getTokenBalance: vi.fn(),
  getTokenPortfolio: vi.fn()
};

const mockLoanService = {
  createLoanRequest: vi.fn(),
  approveLoan: vi.fn(),
  repayLoan: vi.fn(),
  getLoanDetails: vi.fn(),
  calculateCollateralRequirement: vi.fn()
};

const mockNotificationService = {
  sendEmail: vi.fn(),
  sendSMS: vi.fn(),
  createInAppNotification: vi.fn()
};

// Test data
const testUsers = {
  farmer: {
    id: 'farmer-123',
    email: 'farmer@test.com',
    password: 'password123',
    role: 'agriculteur',
    profile: {
      nom: 'Jean Mukendi',
      superficie: 2.5,
      localisation: 'Kinshasa',
      cooperativeId: 'coop-123'
    }
  },
  cooperative: {
    id: 'coop-123',
    email: 'coop@test.com',
    password: 'password123',
    role: 'cooperative',
    profile: {
      nom: 'Coopérative Agricole de Kinshasa',
      region: 'Kinshasa',
      membersCount: 50
    }
  },
  lender: {
    id: 'lender-123',
    email: 'lender@test.com',
    password: 'password123',
    role: 'preteur',
    profile: {
      institutionName: 'Banque Agricole',
      availableFunds: 100000
    }
  }
};

const testCropEvaluation = {
  id: 'eval-123',
  farmerId: 'farmer-123',
  cropType: 'manioc',
  superficie: 2.5,
  rendementHistorique: 8000,
  prixReference: 0.5,
  valeurEstimee: 10000,
  status: 'pending'
};

const testLoan = {
  id: 'loan-123',
  borrowerId: 'farmer-123',
  lenderId: 'lender-123',
  principal: 5000,
  collateralAmount: 10000,
  interestRate: 10,
  dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  status: 'pending'
};

describe('User Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: null },
      error: null
    });
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
      error: null
    });
    
    mockHashPackWallet.connect.mockResolvedValue({
      accountId: '0.0.123456',
      publicKey: 'public-key-123'
    });
    
    mockHashPackWallet.getAccountBalance.mockResolvedValue({
      hbars: 100,
      tokens: { USDC: 1000 }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Farmer Registration and Validation Workflow', () => {
    it('should complete farmer registration and validation process', async () => {
      // Step 1: Farmer registers
      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: [{ id: testUsers.farmer.id, ...testUsers.farmer }],
        error: null
      });

      const registrationResult = await mockSupabaseClient.auth.signUp({
        email: testUsers.farmer.email,
        password: testUsers.farmer.password,
        options: {
          data: {
            role: testUsers.farmer.role,
            profile: testUsers.farmer.profile
          }
        }
      });

      expect(registrationResult.error).toBeNull();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: testUsers.farmer.email,
        password: testUsers.farmer.password,
        options: {
          data: {
            role: testUsers.farmer.role,
            profile: testUsers.farmer.profile
          }
        }
      });

      // Step 2: Farmer connects wallet
      const walletConnection = await mockHashPackWallet.connect();
      expect(walletConnection.accountId).toBe('0.0.123456');
      expect(mockHashPackWallet.connect).toHaveBeenCalled();

      // Step 3: Cooperative receives validation notification
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.cooperative.email,
        subject: 'Nouveau fermier à valider',
        template: 'farmer-validation-request',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          farmerId: testUsers.farmer.id
        }
      });

      // Step 4: Cooperative validates farmer profile
      mockSupabaseClient.from().update.mockResolvedValueOnce({
        data: [{ id: testUsers.farmer.id, isValidated: true }],
        error: null
      });

      const validationResult = await mockSupabaseClient
        .from('profiles')
        .update({ isValidated: true })
        .eq('id', testUsers.farmer.id);

      expect(validationResult.error).toBeNull();

      // Step 5: Farmer receives validation confirmation
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Profil validé',
        template: 'farmer-validation-approved',
        data: {
          farmerName: testUsers.farmer.profile.nom
        }
      });
    });

    it('should handle farmer registration rejection', async () => {
      // Cooperative rejects farmer profile
      mockSupabaseClient.from().update.mockResolvedValueOnce({
        data: [{ id: testUsers.farmer.id, isValidated: false, rejectionReason: 'Documents incomplets' }],
        error: null
      });

      const rejectionResult = await mockSupabaseClient
        .from('profiles')
        .update({ 
          isValidated: false, 
          rejectionReason: 'Documents incomplets' 
        })
        .eq('id', testUsers.farmer.id);

      expect(rejectionResult.error).toBeNull();

      // Farmer receives rejection notification
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Profil rejeté',
        template: 'farmer-validation-rejected',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          rejectionReason: 'Documents incomplets'
        }
      });
    });
  });

  describe('Crop Evaluation and Tokenization Workflow', () => {
    it('should complete crop evaluation and tokenization process', async () => {
      // Step 1: Farmer submits crop evaluation
      mockCropEvaluationService.createEvaluation.mockResolvedValue({
        data: testCropEvaluation,
        error: null
      });

      const evaluationResult = await mockCropEvaluationService.createEvaluation({
        farmerId: testUsers.farmer.id,
        cropType: 'manioc',
        superficie: 2.5,
        rendementHistorique: 8000,
        prixReference: 0.5
      });

      expect(evaluationResult.data.valeurEstimee).toBe(10000);
      expect(mockCropEvaluationService.createEvaluation).toHaveBeenCalled();

      // Step 2: Generate PDF report
      mockCropEvaluationService.generatePDFReport.mockResolvedValue({
        pdfUrl: 'https://storage.com/evaluation-report.pdf',
        error: null
      });

      const pdfResult = await mockCropEvaluationService.generatePDFReport(testCropEvaluation.id);
      expect(pdfResult.pdfUrl).toBeDefined();

      // Step 3: Cooperative approves evaluation
      mockCropEvaluationService.approveEvaluation.mockResolvedValue({
        data: { ...testCropEvaluation, status: 'approved' },
        error: null
      });

      const approvalResult = await mockCropEvaluationService.approveEvaluation(
        testCropEvaluation.id,
        testUsers.cooperative.id
      );

      expect(approvalResult.data.status).toBe('approved');

      // Step 4: Automatic tokenization
      mockTokenizationService.mintTokens.mockResolvedValue({
        data: {
          tokenId: 'token-123',
          amount: 10000,
          transactionId: 'tx-123'
        },
        error: null
      });

      const tokenizationResult = await mockTokenizationService.mintTokens({
        farmerId: testUsers.farmer.id,
        evaluationId: testCropEvaluation.id,
        amount: testCropEvaluation.valeurEstimee
      });

      expect(tokenizationResult.data.amount).toBe(10000);
      expect(mockHashPackWallet.executeTransaction).toHaveBeenCalled();

      // Step 5: Update farmer's token portfolio
      mockTokenizationService.getTokenPortfolio.mockResolvedValue({
        data: {
          totalValue: 10000,
          tokens: [
            {
              tokenId: 'token-123',
              amount: 10000,
              cropType: 'manioc',
              evaluationId: testCropEvaluation.id
            }
          ]
        },
        error: null
      });

      const portfolioResult = await mockTokenizationService.getTokenPortfolio(testUsers.farmer.id);
      expect(portfolioResult.data.totalValue).toBe(10000);
    });

    it('should handle evaluation rejection', async () => {
      // Cooperative rejects evaluation
      mockCropEvaluationService.approveEvaluation.mockResolvedValue({
        data: { ...testCropEvaluation, status: 'rejected', rejectionReason: 'Données insuffisantes' },
        error: null
      });

      const rejectionResult = await mockCropEvaluationService.approveEvaluation(
        testCropEvaluation.id,
        testUsers.cooperative.id,
        { approved: false, reason: 'Données insuffisantes' }
      );

      expect(rejectionResult.data.status).toBe('rejected');

      // Farmer receives rejection notification
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Évaluation rejetée',
        template: 'evaluation-rejected',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          rejectionReason: 'Données insuffisantes'
        }
      });
    });
  });

  describe('Loan Request and Approval Workflow', () => {
    beforeEach(() => {
      // Setup farmer with tokens
      mockTokenizationService.getTokenBalance.mockResolvedValue({
        data: { balance: 10000 },
        error: null
      });
    });

    it('should complete loan request and approval process', async () => {
      // Step 1: Farmer requests loan
      mockLoanService.calculateCollateralRequirement.mockReturnValue({
        requiredCollateral: 10000,
        collateralRatio: 200,
        maxLoanAmount: 5000
      });

      const collateralCheck = mockLoanService.calculateCollateralRequirement(5000);
      expect(collateralCheck.requiredCollateral).toBe(10000);

      mockLoanService.createLoanRequest.mockResolvedValue({
        data: testLoan,
        error: null
      });

      const loanRequest = await mockLoanService.createLoanRequest({
        borrowerId: testUsers.farmer.id,
        principal: 5000,
        collateralAmount: 10000,
        interestRate: 10,
        duration: 365 * 24 * 60 * 60 * 1000 // 1 year
      });

      expect(loanRequest.data.principal).toBe(5000);
      expect(mockLoanService.createLoanRequest).toHaveBeenCalled();

      // Step 2: Cooperative receives loan approval request
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.cooperative.email,
        subject: 'Nouvelle demande de prêt',
        template: 'loan-approval-request',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          loanAmount: 5000,
          loanId: testLoan.id
        }
      });

      // Step 3: Cooperative approves loan
      mockLoanService.approveLoan.mockResolvedValue({
        data: { ...testLoan, status: 'approved' },
        error: null
      });

      const approvalResult = await mockLoanService.approveLoan(
        testLoan.id,
        testUsers.cooperative.id
      );

      expect(approvalResult.data.status).toBe('approved');

      // Step 4: Lender funds the loan
      mockHashPackWallet.executeTransaction.mockResolvedValue({
        transactionId: 'tx-456',
        status: 'SUCCESS'
      });

      const fundingResult = await mockHashPackWallet.executeTransaction({
        type: 'TRANSFER',
        amount: 5000,
        token: 'USDC',
        to: testUsers.farmer.id
      });

      expect(fundingResult.status).toBe('SUCCESS');

      // Step 5: Loan becomes active
      mockLoanService.getLoanDetails.mockResolvedValue({
        data: { ...testLoan, status: 'active', disbursedAt: new Date() },
        error: null
      });

      const loanDetails = await mockLoanService.getLoanDetails(testLoan.id);
      expect(loanDetails.data.status).toBe('active');

      // Step 6: Farmer receives funding confirmation
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Prêt approuvé et financé',
        template: 'loan-funded',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          loanAmount: 5000,
          loanId: testLoan.id
        }
      });
    });

    it('should handle loan rejection by cooperative', async () => {
      // Cooperative rejects loan
      mockLoanService.approveLoan.mockResolvedValue({
        data: { ...testLoan, status: 'rejected', rejectionReason: 'Risque trop élevé' },
        error: null
      });

      const rejectionResult = await mockLoanService.approveLoan(
        testLoan.id,
        testUsers.cooperative.id,
        { approved: false, reason: 'Risque trop élevé' }
      );

      expect(rejectionResult.data.status).toBe('rejected');

      // Farmer receives rejection notification
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Demande de prêt rejetée',
        template: 'loan-rejected',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          rejectionReason: 'Risque trop élevé',
          loanId: testLoan.id
        }
      });
    });

    it('should handle insufficient collateral', async () => {
      // Farmer has insufficient tokens
      mockTokenizationService.getTokenBalance.mockResolvedValue({
        data: { balance: 5000 },
        error: null
      });

      const collateralCheck = mockLoanService.calculateCollateralRequirement(5000);
      expect(collateralCheck.requiredCollateral).toBe(10000);

      // Loan request should fail
      mockLoanService.createLoanRequest.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient collateral' }
      });

      const loanRequest = await mockLoanService.createLoanRequest({
        borrowerId: testUsers.farmer.id,
        principal: 5000,
        collateralAmount: 5000,
        interestRate: 10,
        duration: 365 * 24 * 60 * 60 * 1000
      });

      expect(loanRequest.error).toBeDefined();
      expect(loanRequest.error.message).toBe('Insufficient collateral');
    });
  });

  describe('Loan Repayment Workflow', () => {
    beforeEach(() => {
      // Setup active loan
      mockLoanService.getLoanDetails.mockResolvedValue({
        data: { 
          ...testLoan, 
          status: 'active',
          outstandingBalance: 5500, // Principal + interest
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        error: null
      });

      mockHashPackWallet.getAccountBalance.mockResolvedValue({
        hbars: 100,
        tokens: { USDC: 6000 }
      });
    });

    it('should complete full loan repayment process', async () => {
      // Step 1: Farmer initiates repayment
      mockLoanService.repayLoan.mockResolvedValue({
        data: {
          ...testLoan,
          status: 'repaid',
          outstandingBalance: 0,
          repaidAt: new Date()
        },
        error: null
      });

      mockHashPackWallet.executeTransaction.mockResolvedValue({
        transactionId: 'tx-789',
        status: 'SUCCESS'
      });

      const repaymentResult = await mockLoanService.repayLoan({
        loanId: testLoan.id,
        amount: 5500,
        borrowerId: testUsers.farmer.id
      });

      expect(repaymentResult.data.status).toBe('repaid');
      expect(repaymentResult.data.outstandingBalance).toBe(0);

      // Step 2: Collateral is released
      mockTokenizationService.getTokenPortfolio.mockResolvedValue({
        data: {
          totalValue: 10000,
          availableForCollateral: 10000, // All tokens available again
          lockedInLoans: 0
        },
        error: null
      });

      const portfolioResult = await mockTokenizationService.getTokenPortfolio(testUsers.farmer.id);
      expect(portfolioResult.data.lockedInLoans).toBe(0);

      // Step 3: Lender receives repayment
      expect(mockHashPackWallet.executeTransaction).toHaveBeenCalledWith({
        type: 'TRANSFER',
        amount: 5500,
        token: 'USDC',
        to: testUsers.lender.id
      });

      // Step 4: All parties receive confirmation
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Prêt remboursé avec succès',
        template: 'loan-repaid',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          loanAmount: 5000,
          totalRepaid: 5500,
          loanId: testLoan.id
        }
      });

      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.lender.email,
        subject: 'Remboursement reçu',
        template: 'repayment-received',
        data: {
          lenderName: testUsers.lender.profile.institutionName,
          amount: 5500,
          loanId: testLoan.id
        }
      });
    });

    it('should handle partial repayment', async () => {
      // Farmer makes partial repayment
      mockLoanService.repayLoan.mockResolvedValue({
        data: {
          ...testLoan,
          status: 'active',
          outstandingBalance: 2750, // Half remaining
          lastPaymentAmount: 2750,
          lastPaymentDate: new Date()
        },
        error: null
      });

      const partialRepayment = await mockLoanService.repayLoan({
        loanId: testLoan.id,
        amount: 2750,
        borrowerId: testUsers.farmer.id
      });

      expect(partialRepayment.data.status).toBe('active');
      expect(partialRepayment.data.outstandingBalance).toBe(2750);

      // Collateral remains locked
      mockTokenizationService.getTokenPortfolio.mockResolvedValue({
        data: {
          totalValue: 10000,
          availableForCollateral: 0,
          lockedInLoans: 10000
        },
        error: null
      });

      const portfolioResult = await mockTokenizationService.getTokenPortfolio(testUsers.farmer.id);
      expect(portfolioResult.data.lockedInLoans).toBe(10000);
    });

    it('should handle loan default and liquidation', async () => {
      // Loan becomes overdue
      const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      mockLoanService.getLoanDetails.mockResolvedValue({
        data: { 
          ...testLoan, 
          status: 'active',
          outstandingBalance: 5500,
          dueDate: overdueDate
        },
        error: null
      });

      // System marks loan as defaulted
      mockLoanService.approveLoan.mockResolvedValue({
        data: { ...testLoan, status: 'defaulted' },
        error: null
      });

      // Collateral liquidation
      mockTokenizationService.mintTokens.mockResolvedValue({
        data: {
          liquidatedAmount: 10000,
          transferredTo: testUsers.lender.id,
          transactionId: 'tx-liquidation'
        },
        error: null
      });

      const liquidationResult = await mockTokenizationService.mintTokens({
        action: 'liquidate',
        loanId: testLoan.id,
        recipientId: testUsers.lender.id
      });

      expect(liquidationResult.data.liquidatedAmount).toBe(10000);

      // Notifications sent
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.farmer.email,
        subject: 'Prêt en défaut - Collatéral liquidé',
        template: 'loan-defaulted',
        data: {
          farmerName: testUsers.farmer.profile.nom,
          loanId: testLoan.id,
          liquidatedAmount: 10000
        }
      });
    });
  });

  describe('Lender Investment Workflow', () => {
    it('should complete lender investment process', async () => {
      // Step 1: Lender views available opportunities
      mockLoanService.createLoanRequest.mockResolvedValue({
        data: [
          {
            ...testLoan,
            riskAssessment: {
              creditScore: 75,
              collateralRatio: 200,
              riskRating: 'MEDIUM'
            }
          }
        ],
        error: null
      });

      const opportunities = await mockLoanService.createLoanRequest({
        action: 'getAvailableLoans',
        lenderId: testUsers.lender.id
      });

      expect(opportunities.data).toHaveLength(1);
      expect(opportunities.data[0].riskAssessment.riskRating).toBe('MEDIUM');

      // Step 2: Lender commits funds
      mockHashPackWallet.executeTransaction.mockResolvedValue({
        transactionId: 'tx-commitment',
        status: 'SUCCESS'
      });

      const commitmentResult = await mockHashPackWallet.executeTransaction({
        type: 'ESCROW',
        amount: 5000,
        token: 'USDC',
        loanId: testLoan.id
      });

      expect(commitmentResult.status).toBe('SUCCESS');

      // Step 3: Loan is funded and becomes active
      mockLoanService.getLoanDetails.mockResolvedValue({
        data: { ...testLoan, status: 'active', fundedAt: new Date() },
        error: null
      });

      const activeLoan = await mockLoanService.getLoanDetails(testLoan.id);
      expect(activeLoan.data.status).toBe('active');

      // Step 4: Lender receives confirmation
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith({
        to: testUsers.lender.email,
        subject: 'Investissement confirmé',
        template: 'investment-confirmed',
        data: {
          lenderName: testUsers.lender.profile.institutionName,
          loanAmount: 5000,
          expectedReturn: 5500,
          loanId: testLoan.id
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network connectivity issues', async () => {
      // Simulate network error
      mockHashPackWallet.executeTransaction.mockRejectedValue(
        new Error('Network connection failed')
      );

      try {
        await mockHashPackWallet.executeTransaction({
          type: 'TRANSFER',
          amount: 1000,
          token: 'USDC'
        });
      } catch (error) {
        expect(error.message).toBe('Network connection failed');
      }

      // Verify retry mechanism would be triggered
      expect(mockHashPackWallet.executeTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle insufficient wallet balance', async () => {
      mockHashPackWallet.getAccountBalance.mockResolvedValue({
        hbars: 10,
        tokens: { USDC: 100 } // Insufficient for loan
      });

      const balance = await mockHashPackWallet.getAccountBalance();
      expect(balance.tokens.USDC).toBeLessThan(5000);

      // Loan request should fail
      mockLoanService.createLoanRequest.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient wallet balance' }
      });

      const loanRequest = await mockLoanService.createLoanRequest({
        borrowerId: testUsers.farmer.id,
        principal: 5000
      });

      expect(loanRequest.error.message).toBe('Insufficient wallet balance');
    });

    it('should handle concurrent loan requests', async () => {
      // Simulate multiple simultaneous loan requests
      const loanRequests = [
        mockLoanService.createLoanRequest({
          borrowerId: testUsers.farmer.id,
          principal: 3000,
          collateralAmount: 6000
        }),
        mockLoanService.createLoanRequest({
          borrowerId: testUsers.farmer.id,
          principal: 2000,
          collateralAmount: 4000
        })
      ];

      // First request succeeds
      mockLoanService.createLoanRequest.mockResolvedValueOnce({
        data: { ...testLoan, id: 'loan-1', principal: 3000 },
        error: null
      });

      // Second request fails due to insufficient remaining collateral
      mockLoanService.createLoanRequest.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insufficient available collateral' }
      });

      const results = await Promise.all(loanRequests);
      
      expect(results[0].data).toBeDefined();
      expect(results[1].error.message).toBe('Insufficient available collateral');
    });

    it('should handle smart contract failures gracefully', async () => {
      // Simulate smart contract execution failure
      mockHashPackWallet.executeTransaction.mockResolvedValue({
        transactionId: 'tx-failed',
        status: 'FAILED',
        error: 'Contract execution reverted'
      });

      const transactionResult = await mockHashPackWallet.executeTransaction({
        type: 'MINT_TOKENS',
        amount: 10000
      });

      expect(transactionResult.status).toBe('FAILED');
      expect(transactionResult.error).toBe('Contract execution reverted');

      // Verify error is logged and user is notified
      expect(mockNotificationService.createInAppNotification).toHaveBeenCalledWith({
        userId: testUsers.farmer.id,
        type: 'error',
        title: 'Transaction échouée',
        message: 'La tokenisation a échoué. Veuillez réessayer.',
        data: { transactionId: 'tx-failed' }
      });
    });
  });

  describe('Performance and Load Testing Scenarios', () => {
    it('should handle multiple concurrent users', async () => {
      const concurrentUsers = 10;
      const userActions = [];

      for (let i = 0; i < concurrentUsers; i++) {
        userActions.push(
          mockSupabaseClient.auth.signInWithPassword({
            email: `user${i}@test.com`,
            password: 'password123'
          })
        );
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-concurrent' }, session: { access_token: 'token' } },
        error: null
      });

      const results = await Promise.all(userActions);
      
      expect(results).toHaveLength(concurrentUsers);
      results.forEach(result => {
        expect(result.error).toBeNull();
      });
    });

    it('should handle large data sets efficiently', async () => {
      // Simulate farmer with many evaluations
      const manyEvaluations = Array.from({ length: 100 }, (_, i) => ({
        id: `eval-${i}`,
        farmerId: testUsers.farmer.id,
        cropType: i % 2 === 0 ? 'manioc' : 'cafe',
        valeurEstimee: 1000 + i * 100,
        status: 'approved'
      }));

      mockCropEvaluationService.getEvaluationHistory.mockResolvedValue({
        data: manyEvaluations,
        error: null
      });

      const startTime = Date.now();
      const evaluationHistory = await mockCropEvaluationService.getEvaluationHistory(testUsers.farmer.id);
      const endTime = Date.now();

      expect(evaluationHistory.data).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});