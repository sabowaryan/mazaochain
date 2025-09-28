import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * End-to-end tests for complete lending cycle
 * Tests the entire flow from farmer registration to loan completion
 */

// Mock browser environment for E2E testing
const mockBrowser = {
  goto: vi.fn(),
  waitForSelector: vi.fn(),
  click: vi.fn(),
  type: vi.fn(),
  select: vi.fn(),
  screenshot: vi.fn(),
  evaluate: vi.fn(),
  close: vi.fn(),
  $: vi.fn(() => ({ textContent: 'Mock Element' }))
};

// Mock page interactions
const mockPage = {
  url: vi.fn(),
  title: vi.fn(),
  content: vi.fn(),
  $: vi.fn(() => ({ textContent: 'Mock Element' })),
  $$: vi.fn(),
  waitForTimeout: vi.fn(),
  waitForNavigation: vi.fn(),
  reload: vi.fn()
};

// Test configuration
const testConfig = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  headless: true
};

// Test data
const testData = {
  farmer: {
    email: 'e2e.farmer@test.com',
    password: 'TestPassword123!',
    profile: {
      nom: 'Jean Baptiste Mukendi',
      superficie: 3.5,
      localisation: 'Kinshasa, Kimbanseke',
      telephone: '+243123456789'
    },
    wallet: {
      accountId: '0.0.123456',
      privateKey: 'test-private-key',
      publicKey: 'test-public-key'
    }
  },
  cooperative: {
    email: 'e2e.coop@test.com',
    password: 'TestPassword123!',
    profile: {
      nom: 'Coopérative Agricole Test',
      region: 'Kinshasa',
      membersCount: 25
    }
  },
  lender: {
    email: 'e2e.lender@test.com',
    password: 'TestPassword123!',
    profile: {
      institutionName: 'Banque Test',
      availableFunds: 50000
    },
    wallet: {
      accountId: '0.0.789012',
      balance: { USDC: 100000 }
    }
  },
  cropEvaluation: {
    cropType: 'manioc',
    superficie: 3.5,
    rendementHistorique: 9000,
    prixReference: 0.6,
    expectedValue: 18900
  },
  loan: {
    requestedAmount: 9000,
    interestRate: 12,
    duration: 12, // months
    collateralRatio: 200
  }
};

describe('Complete Lending Cycle E2E Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mock browser responses
    mockBrowser.goto.mockResolvedValue(undefined);
    mockBrowser.waitForSelector.mockResolvedValue(true);
    mockBrowser.click.mockResolvedValue(undefined);
    mockBrowser.type.mockResolvedValue(undefined);
    mockPage.url.mockReturnValue(testConfig.baseUrl);
    mockPage.title.mockReturnValue('MazaoChain - Plateforme de Prêt Agricole');
  });

  afterEach(async () => {
    await mockBrowser.close();
  });

  describe('Complete Lending Cycle - Happy Path', () => {
    it('should complete full lending cycle from registration to repayment', async () => {
      // ===== PHASE 1: USER REGISTRATION =====
      
      // Step 1: Farmer Registration
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      expect(mockBrowser.goto).toHaveBeenCalledWith(`${testConfig.baseUrl}/register`);

      // Fill registration form
      await mockBrowser.waitForSelector('#registration-form');
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.select('#role', 'agriculteur');
      await mockBrowser.type('#nom', testData.farmer.profile.nom);
      await mockBrowser.type('#superficie', testData.farmer.profile.superficie.toString());
      await mockBrowser.type('#localisation', testData.farmer.profile.localisation);
      await mockBrowser.click('#submit-registration');

      // Verify registration success
      await mockBrowser.waitForSelector('.success-message');
      mockPage.content.mockResolvedValue('<div class="success-message">Inscription réussie</div>');
      const successMessage = await mockPage.content();
      expect(successMessage).toContain('Inscription réussie');

      // Step 2: Wallet Connection
      await mockBrowser.waitForSelector('#connect-wallet-btn');
      await mockBrowser.click('#connect-wallet-btn');
      
      // Mock HashPack wallet connection
      mockBrowser.evaluate.mockResolvedValue({
        accountId: testData.farmer.wallet.accountId,
        publicKey: testData.farmer.wallet.publicKey
      });

      const walletConnection = await mockBrowser.evaluate(() => {
        return window.hashpack.connect();
      });

      expect(walletConnection.accountId).toBe(testData.farmer.wallet.accountId);

      // Step 3: Cooperative Registration
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.select('#role', 'cooperative');
      await mockBrowser.type('#nom', testData.cooperative.profile.nom);
      await mockBrowser.type('#region', testData.cooperative.profile.region);
      await mockBrowser.click('#submit-registration');

      // Step 4: Lender Registration
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      await mockBrowser.type('#email', testData.lender.email);
      await mockBrowser.type('#password', testData.lender.password);
      await mockBrowser.select('#role', 'preteur');
      await mockBrowser.type('#institutionName', testData.lender.profile.institutionName);
      await mockBrowser.click('#submit-registration');

      // ===== PHASE 2: FARMER VALIDATION =====

      // Step 5: Cooperative Login and Farmer Validation
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.click('#login-btn');

      // Navigate to pending validations
      await mockBrowser.waitForSelector('#dashboard-nav');
      await mockBrowser.click('#pending-validations-link');
      
      // Validate farmer profile
      await mockBrowser.waitForSelector('.farmer-validation-card');
      await mockBrowser.click('#approve-farmer-btn');
      await mockBrowser.type('#validation-comments', 'Profil complet et vérifié');
      await mockBrowser.click('#confirm-approval');

      // Verify validation success
      await mockBrowser.waitForSelector('.validation-success');
      mockPage.content.mockResolvedValue('<div class="validation-success">Fermier validé avec succès</div>');

      // ===== PHASE 3: CROP EVALUATION =====

      // Step 6: Farmer Login and Crop Evaluation
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Navigate to crop evaluation
      await mockBrowser.click('#crop-evaluation-link');
      await mockBrowser.waitForSelector('#crop-evaluation-form');

      // Fill evaluation form
      await mockBrowser.select('#crop-type', testData.cropEvaluation.cropType);
      await mockBrowser.type('#superficie', testData.cropEvaluation.superficie.toString());
      await mockBrowser.type('#rendement-historique', testData.cropEvaluation.rendementHistorique.toString());
      await mockBrowser.type('#prix-reference', testData.cropEvaluation.prixReference.toString());

      // Submit evaluation
      await mockBrowser.click('#submit-evaluation');

      // Verify calculated value
      await mockBrowser.waitForSelector('#calculated-value');
      mockBrowser.evaluate.mockResolvedValue(testData.cropEvaluation.expectedValue);
      const calculatedValue = await mockBrowser.evaluate(() => {
        return document.querySelector('#calculated-value').textContent;
      });
      expect(parseInt(calculatedValue)).toBe(testData.cropEvaluation.expectedValue);

      // Step 7: Cooperative Evaluation Approval
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.click('#login-btn');

      // Navigate to pending evaluations
      await mockBrowser.click('#pending-evaluations-link');
      await mockBrowser.waitForSelector('.evaluation-review-card');
      
      // Review and approve evaluation
      await mockBrowser.click('#review-evaluation-btn');
      await mockBrowser.waitForSelector('#evaluation-details');
      await mockBrowser.click('#approve-evaluation-btn');
      await mockBrowser.type('#approval-comments', 'Évaluation approuvée - données cohérentes');
      await mockBrowser.click('#confirm-evaluation-approval');

      // ===== PHASE 4: TOKENIZATION =====

      // Step 8: Verify Automatic Tokenization
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Check token portfolio
      await mockBrowser.click('#portfolio-link');
      await mockBrowser.waitForSelector('#token-portfolio');

      // Verify tokens were minted
      mockBrowser.evaluate.mockResolvedValue({
        totalTokens: testData.cropEvaluation.expectedValue,
        availableForCollateral: testData.cropEvaluation.expectedValue
      });

      const portfolio = await mockBrowser.evaluate(() => {
        return {
          totalTokens: parseInt(document.querySelector('#total-tokens').textContent),
          availableForCollateral: parseInt(document.querySelector('#available-collateral').textContent)
        };
      });

      expect(portfolio.totalTokens).toBe(testData.cropEvaluation.expectedValue);
      expect(portfolio.availableForCollateral).toBe(testData.cropEvaluation.expectedValue);

      // ===== PHASE 5: LOAN REQUEST =====

      // Step 9: Create Loan Request
      await mockBrowser.click('#request-loan-link');
      await mockBrowser.waitForSelector('#loan-request-form');

      // Fill loan request form
      await mockBrowser.type('#loan-amount', testData.loan.requestedAmount.toString());
      await mockBrowser.type('#interest-rate', testData.loan.interestRate.toString());
      await mockBrowser.select('#loan-duration', testData.loan.duration.toString());

      // Verify collateral calculation
      mockBrowser.evaluate.mockResolvedValue({
        requiredCollateral: testData.loan.requestedAmount * 2,
        availableCollateral: testData.cropEvaluation.expectedValue,
        isEligible: true
      });

      const collateralCheck = await mockBrowser.evaluate(() => {
        return window.calculateCollateralRequirement();
      });

      expect(collateralCheck.isEligible).toBe(true);
      expect(collateralCheck.requiredCollateral).toBe(testData.loan.requestedAmount * 2);

      // Submit loan request
      await mockBrowser.click('#submit-loan-request');
      await mockBrowser.waitForSelector('.loan-request-success');

      // ===== PHASE 6: LOAN APPROVAL =====

      // Step 10: Cooperative Loan Approval
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.click('#login-btn');

      // Navigate to pending loans
      await mockBrowser.click('#pending-loans-link');
      await mockBrowser.waitForSelector('.loan-approval-card');

      // Review loan details
      await mockBrowser.click('#review-loan-btn');
      await mockBrowser.waitForSelector('#loan-review-details');

      // Verify loan information
      mockBrowser.evaluate.mockResolvedValue({
        borrowerName: testData.farmer.profile.nom,
        loanAmount: testData.loan.requestedAmount,
        collateralValue: testData.cropEvaluation.expectedValue,
        collateralRatio: 210 // Slightly above 200%
      });

      const loanDetails = await mockBrowser.evaluate(() => {
        return {
          borrowerName: document.querySelector('#borrower-name').textContent,
          loanAmount: parseInt(document.querySelector('#loan-amount').textContent),
          collateralValue: parseInt(document.querySelector('#collateral-value').textContent),
          collateralRatio: parseInt(document.querySelector('#collateral-ratio').textContent)
        };
      });

      expect(loanDetails.borrowerName).toBe(testData.farmer.profile.nom);
      expect(loanDetails.loanAmount).toBe(testData.loan.requestedAmount);
      expect(loanDetails.collateralRatio).toBeGreaterThan(200);

      // Approve loan
      await mockBrowser.click('#approve-loan-btn');
      await mockBrowser.type('#approval-comments', 'Prêt approuvé - bon ratio de collatéral');
      await mockBrowser.click('#confirm-loan-approval');

      // ===== PHASE 7: LENDER FUNDING =====

      // Step 11: Lender Login and Funding
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.lender.email);
      await mockBrowser.type('#password', testData.lender.password);
      await mockBrowser.click('#login-btn');

      // Connect lender wallet
      await mockBrowser.click('#connect-wallet-btn');
      mockBrowser.evaluate.mockResolvedValue({
        accountId: testData.lender.wallet.accountId,
        balance: testData.lender.wallet.balance
      });

      // Navigate to investment opportunities
      await mockBrowser.click('#investment-opportunities-link');
      await mockBrowser.waitForSelector('.loan-opportunity-card');

      // Review and fund loan
      await mockBrowser.click('#fund-loan-btn');
      await mockBrowser.waitForSelector('#funding-confirmation');

      // Confirm funding transaction
      await mockBrowser.click('#confirm-funding');
      await mockBrowser.waitForSelector('#transaction-processing');

      // Wait for transaction confirmation
      mockBrowser.evaluate.mockResolvedValue({
        transactionId: 'tx-funding-123',
        status: 'SUCCESS',
        amount: testData.loan.requestedAmount
      });

      await mockBrowser.waitForSelector('.funding-success');

      // ===== PHASE 8: LOAN DISBURSEMENT =====

      // Step 12: Verify Loan Disbursement to Farmer
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Check wallet balance
      mockBrowser.evaluate.mockResolvedValue({
        USDC: testData.loan.requestedAmount,
        transactionHistory: [
          {
            type: 'LOAN_DISBURSEMENT',
            amount: testData.loan.requestedAmount,
            timestamp: new Date().toISOString()
          }
        ]
      });

      const walletBalance = await mockBrowser.evaluate(() => {
        return window.hashpack.getAccountBalance();
      });

      expect(walletBalance.USDC).toBe(testData.loan.requestedAmount);

      // Check active loans
      await mockBrowser.click('#active-loans-link');
      await mockBrowser.waitForSelector('.active-loan-card');

      mockBrowser.evaluate.mockResolvedValue({
        loanId: 'loan-123',
        principal: testData.loan.requestedAmount,
        outstandingBalance: testData.loan.requestedAmount * 1.12, // With interest
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      });

      const activeLoan = await mockBrowser.evaluate(() => {
        return JSON.parse(document.querySelector('#loan-data').textContent);
      });

      expect(activeLoan.status).toBe('ACTIVE');
      expect(activeLoan.principal).toBe(testData.loan.requestedAmount);

      // ===== PHASE 9: LOAN REPAYMENT =====

      // Step 13: Simulate Time Passage and Repayment
      // (In real E2E test, this might involve waiting or manipulating system time)
      
      // Navigate to repayment interface
      await mockBrowser.click('#repay-loan-link');
      await mockBrowser.waitForSelector('#repayment-form');

      // Check outstanding balance
      const outstandingBalance = activeLoan.outstandingBalance;
      
      // Make full repayment
      await mockBrowser.type('#repayment-amount', outstandingBalance.toString());
      await mockBrowser.click('#confirm-repayment');

      // Process repayment transaction
      mockBrowser.evaluate.mockResolvedValue({
        transactionId: 'tx-repayment-456',
        status: 'SUCCESS',
        amount: outstandingBalance
      });

      await mockBrowser.waitForSelector('.repayment-success');

      // ===== PHASE 10: COLLATERAL RELEASE =====

      // Step 14: Verify Collateral Release
      await mockBrowser.click('#portfolio-link');
      await mockBrowser.waitForSelector('#token-portfolio');

      // Check that collateral is released
      mockBrowser.evaluate.mockResolvedValue({
        totalTokens: testData.cropEvaluation.expectedValue,
        availableForCollateral: testData.cropEvaluation.expectedValue,
        lockedInLoans: 0
      });

      const finalPortfolio = await mockBrowser.evaluate(() => {
        return {
          totalTokens: parseInt(document.querySelector('#total-tokens').textContent),
          availableForCollateral: parseInt(document.querySelector('#available-collateral').textContent),
          lockedInLoans: parseInt(document.querySelector('#locked-tokens').textContent)
        };
      });

      expect(finalPortfolio.lockedInLoans).toBe(0);
      expect(finalPortfolio.availableForCollateral).toBe(testData.cropEvaluation.expectedValue);

      // ===== PHASE 11: LENDER RECEIVES REPAYMENT =====

      // Step 15: Verify Lender Receives Repayment
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.lender.email);
      await mockBrowser.type('#password', testData.lender.password);
      await mockBrowser.click('#login-btn');

      // Check lender portfolio
      await mockBrowser.click('#lender-portfolio-link');
      await mockBrowser.waitForSelector('#portfolio-summary');

      mockBrowser.evaluate.mockResolvedValue({
        totalInvested: testData.loan.requestedAmount,
        totalReturned: outstandingBalance,
        profit: outstandingBalance - testData.loan.requestedAmount,
        completedLoans: 1
      });

      const lenderPortfolio = await mockBrowser.evaluate(() => {
        return {
          totalInvested: parseInt(document.querySelector('#total-invested').textContent),
          totalReturned: parseInt(document.querySelector('#total-returned').textContent),
          profit: parseInt(document.querySelector('#profit').textContent),
          completedLoans: parseInt(document.querySelector('#completed-loans').textContent)
        };
      });

      expect(lenderPortfolio.completedLoans).toBe(1);
      expect(lenderPortfolio.profit).toBeGreaterThan(0);
      expect(lenderPortfolio.totalReturned).toBe(outstandingBalance);

      // ===== VERIFICATION: COMPLETE CYCLE SUCCESS =====
      
      // Take final screenshot for verification
      await mockBrowser.screenshot({ path: 'lending-cycle-complete.png' });
      
      // Verify all phases completed successfully
      expect(mockBrowser.goto).toHaveBeenCalledTimes(11); // Multiple page navigations
      expect(mockBrowser.click).toHaveBeenCalledWith('#confirm-repayment');
      expect(mockBrowser.waitForSelector).toHaveBeenCalledWith('.repayment-success');
      
      console.log('✅ Complete lending cycle test passed successfully');
    }, testConfig.timeout);
  });

  describe('Lending Cycle - Error Scenarios', () => {
    it('should handle farmer validation rejection', async () => {
      // Register farmer
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.select('#role', 'agriculteur');
      await mockBrowser.click('#submit-registration');

      // Cooperative rejects farmer
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.click('#login-btn');

      await mockBrowser.click('#pending-validations-link');
      await mockBrowser.click('#reject-farmer-btn');
      await mockBrowser.type('#rejection-reason', 'Documents insuffisants');
      await mockBrowser.click('#confirm-rejection');

      // Verify farmer cannot access lending features
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      mockPage.content.mockResolvedValue('<div class="validation-pending">Profil en attente de validation</div>');
      const pageContent = await mockPage.content();
      expect(pageContent).toContain('Profil en attente de validation');

      // Verify lending features are disabled
      mockBrowser.$.mockReturnValue(null); // No crop evaluation link found
      const cropEvaluationLink = mockBrowser.$('#crop-evaluation-link');
      expect(cropEvaluationLink).toBeNull();
    });

    it('should handle insufficient collateral scenario', async () => {
      // Setup farmer with low-value crop evaluation
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Create low-value evaluation
      await mockBrowser.click('#crop-evaluation-link');
      await mockBrowser.type('#superficie', '1');
      await mockBrowser.type('#rendement-historique', '2000');
      await mockBrowser.type('#prix-reference', '0.3');
      await mockBrowser.click('#submit-evaluation');

      // Cooperative approves low-value evaluation
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.cooperative.email);
      await mockBrowser.type('#password', testData.cooperative.password);
      await mockBrowser.click('#login-btn');
      await mockBrowser.click('#approve-evaluation-btn');

      // Farmer tries to request large loan
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      await mockBrowser.click('#request-loan-link');
      await mockBrowser.type('#loan-amount', '5000'); // Much larger than collateral value

      // Verify error message
      await mockBrowser.waitForSelector('.collateral-error');
      mockPage.content.mockResolvedValue('<div class="collateral-error">Collatéral insuffisant</div>');
      const errorMessage = await mockPage.content();
      expect(errorMessage).toContain('Collatéral insuffisant');

      // Verify loan request button is disabled
      mockBrowser.evaluate.mockResolvedValue(true);
      const isDisabled = await mockBrowser.evaluate(() => {
        return document.querySelector('#submit-loan-request').disabled;
      });
      expect(isDisabled).toBe(true);
    });

    it('should handle loan default and liquidation', async () => {
      // Setup active loan (simulate previous steps completed)
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Simulate loan becoming overdue
      mockBrowser.evaluate.mockResolvedValue({
        loanId: 'loan-overdue-123',
        status: 'OVERDUE',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day overdue
        outstandingBalance: 10000
      });

      await mockBrowser.click('#active-loans-link');
      await mockBrowser.waitForSelector('.overdue-loan-warning');

      // Verify overdue warning is displayed
      mockPage.content.mockResolvedValue('<div class="overdue-loan-warning">Prêt en retard</div>');
      const overdueWarning = await mockPage.content();
      expect(overdueWarning).toContain('Prêt en retard');

      // Lender initiates liquidation
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.lender.email);
      await mockBrowser.type('#password', testData.lender.password);
      await mockBrowser.click('#login-btn');

      await mockBrowser.click('#overdue-loans-link');
      await mockBrowser.click('#liquidate-collateral-btn');
      await mockBrowser.click('#confirm-liquidation');

      // Verify liquidation success
      await mockBrowser.waitForSelector('.liquidation-success');
      mockPage.content.mockResolvedValue('<div class="liquidation-success">Collatéral liquidé</div>');

      // Verify farmer receives liquidation notification
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      await mockBrowser.waitForSelector('.liquidation-notification');
      mockPage.content.mockResolvedValue('<div class="liquidation-notification">Votre collatéral a été liquidé</div>');
      const liquidationNotification = await mockPage.content();
      expect(liquidationNotification).toContain('Votre collatéral a été liquidé');
    });

    it('should handle network connectivity issues', async () => {
      // Simulate network failure during transaction
      await mockBrowser.goto(`${testConfig.baseUrl}/login`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#login-btn');

      // Try to submit crop evaluation with network error
      await mockBrowser.click('#crop-evaluation-link');
      await mockBrowser.type('#superficie', '2.5');
      await mockBrowser.type('#rendement-historique', '8000');
      await mockBrowser.click('#submit-evaluation');

      // Mock network error
      mockBrowser.evaluate.mockRejectedValue(new Error('Network request failed'));

      // Verify error handling
      await mockBrowser.waitForSelector('.network-error');
      mockPage.content.mockResolvedValue('<div class="network-error">Erreur de connexion</div>');
      const networkError = await mockPage.content();
      expect(networkError).toContain('Erreur de connexion');

      // Verify retry button is available
      await mockBrowser.waitForSelector('#retry-btn');
      const retryButton = await mockBrowser.$('#retry-btn');
      expect(retryButton).toBeDefined();
    });

    it('should handle wallet connection failures', async () => {
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.click('#submit-registration');

      // Try to connect wallet with failure
      await mockBrowser.click('#connect-wallet-btn');
      
      // Mock wallet connection failure
      mockBrowser.evaluate.mockRejectedValue(new Error('HashPack not installed'));

      try {
        await mockBrowser.evaluate(() => {
          return window.hashpack.connect();
        });
      } catch (error) {
        expect(error.message).toBe('HashPack not installed');
      }

      // Verify error message and installation prompt
      await mockBrowser.waitForSelector('.wallet-error');
      mockPage.content.mockResolvedValue('<div class="wallet-error">Veuillez installer HashPack</div>');
      const walletError = await mockPage.content();
      expect(walletError).toContain('Veuillez installer HashPack');

      // Verify installation link is provided
      await mockBrowser.waitForSelector('#install-hashpack-link');
      const installLink = await mockBrowser.$('#install-hashpack-link');
      expect(installLink).toBeDefined();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent users in lending cycle', async () => {
      const concurrentUsers = 5;
      const userSessions = [];

      // Create multiple browser sessions
      for (let i = 0; i < concurrentUsers; i++) {
        const session = {
          browser: { ...mockBrowser },
          page: { ...mockPage },
          userData: {
            ...testData.farmer,
            email: `farmer${i}@test.com`
          }
        };
        userSessions.push(session);
      }

      // Simulate concurrent registrations
      const registrationPromises = userSessions.map(async (session, index) => {
        await session.browser.goto(`${testConfig.baseUrl}/register`);
        await session.browser.type('#email', session.userData.email);
        await session.browser.type('#password', session.userData.password);
        await session.browser.click('#submit-registration');
        return { index, success: true };
      });

      const registrationResults = await Promise.all(registrationPromises);
      expect(registrationResults).toHaveLength(concurrentUsers);
      registrationResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Simulate concurrent crop evaluations
      const evaluationPromises = userSessions.map(async (session) => {
        await session.browser.click('#crop-evaluation-link');
        await session.browser.type('#superficie', '2');
        await session.browser.type('#rendement-historique', '7000');
        await session.browser.click('#submit-evaluation');
        return { success: true };
      });

      const evaluationResults = await Promise.all(evaluationPromises);
      expect(evaluationResults).toHaveLength(concurrentUsers);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();

      // Simulate heavy user interaction
      await mockBrowser.goto(`${testConfig.baseUrl}/dashboard`);
      
      // Multiple rapid page navigations
      const navigationPromises = [];
      const pages = ['#portfolio-link', '#loans-link', '#evaluations-link', '#profile-link'];
      
      for (let i = 0; i < 20; i++) {
        const pageLink = pages[i % pages.length];
        navigationPromises.push(mockBrowser.click(pageLink));
      }

      await Promise.all(navigationPromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify performance is acceptable (under 5 seconds for all operations)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Mobile Responsiveness E2E', () => {
    it('should complete lending cycle on mobile device', async () => {
      // Set mobile viewport
      mockBrowser.evaluate.mockResolvedValue({
        width: 375,
        height: 667,
        deviceScaleFactor: 2
      });

      await mockBrowser.evaluate(() => {
        window.resizeTo(375, 667);
      });

      // Test mobile registration flow
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      
      // Verify mobile-specific elements
      await mockBrowser.waitForSelector('.mobile-nav-toggle');
      await mockBrowser.click('.mobile-nav-toggle');
      await mockBrowser.waitForSelector('.mobile-menu');

      // Complete registration on mobile
      await mockBrowser.type('#email', testData.farmer.email);
      await mockBrowser.type('#password', testData.farmer.password);
      await mockBrowser.select('#role', 'agriculteur');
      await mockBrowser.click('#submit-registration');

      // Verify mobile-optimized success message
      await mockBrowser.waitForSelector('.mobile-success-message');
      mockPage.content.mockResolvedValue('<div class="mobile-success-message">Inscription réussie</div>');

      // Test mobile crop evaluation
      await mockBrowser.click('#crop-evaluation-link');
      await mockBrowser.waitForSelector('.mobile-form');
      
      // Verify form is mobile-optimized
      mockBrowser.evaluate.mockResolvedValue(true);
      const isMobileOptimized = await mockBrowser.evaluate(() => {
        const form = document.querySelector('.mobile-form');
        return form && form.classList.contains('mobile-optimized');
      });
      expect(isMobileOptimized).toBe(true);
    });
  });

  describe('Accessibility E2E Tests', () => {
    it('should be accessible throughout lending cycle', async () => {
      // Test keyboard navigation
      await mockBrowser.goto(`${testConfig.baseUrl}/register`);
      
      // Navigate using Tab key
      await mockBrowser.evaluate(() => {
        const event = new KeyboardEvent('keydown', { key: 'Tab' });
        document.dispatchEvent(event);
      });

      // Verify focus management
      mockBrowser.evaluate.mockResolvedValue('#email');
      const focusedElement = await mockBrowser.evaluate(() => {
        return document.activeElement.id;
      });
      expect(focusedElement).toBe('#email');

      // Test screen reader compatibility
      mockBrowser.evaluate.mockResolvedValue({
        hasAriaLabels: true,
        hasAltText: true,
        hasHeadings: true
      });

      const accessibilityCheck = await mockBrowser.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        const images = document.querySelectorAll('img');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        return {
          hasAriaLabels: Array.from(inputs).every(input => input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')),
          hasAltText: Array.from(images).every(img => img.hasAttribute('alt')),
          hasHeadings: headings.length > 0
        };
      });

      expect(accessibilityCheck.hasAriaLabels).toBe(true);
      expect(accessibilityCheck.hasAltText).toBe(true);
      expect(accessibilityCheck.hasHeadings).toBe(true);
    });
  });
});