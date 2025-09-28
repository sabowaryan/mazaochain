import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for LoanManager smart contract
 * Tests all contract functions and edge cases
 */

// Mock interfaces for testing
interface MockLoanManager {
  owner: string;
  tokenFactory: MockTokenFactory;
  loans: Map<number, Loan>;
  borrowerLoans: Map<string, number[]>;
  lenderLoans: Map<string, number[]>;
  loanCollateral: Map<number, CollateralInfo>;
  loanIdCounter: number;
}

interface MockTokenFactory {
  getFarmerBalance(farmer: string): number;
  getCropToken(tokenId: number): CropData;
  burnTokens(tokenId: number, amount: number): void;
}

interface CropData {
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
  isActive: boolean;
  totalSupply: number;
  createdAt: number;
}

enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED }

interface Loan {
  borrower: string;
  lender: string;
  principal: number;
  collateralAmount: number;
  collateralTokenId: number;
  interestRate: number;
  dueDate: number;
  outstandingBalance: number;
  status: LoanStatus;
  createdAt: number;
  approvedAt: number;
}

interface CollateralInfo {
  tokenId: number;
  amount: number;
  value: number;
  isLocked: boolean;
}

class MockTokenFactoryContract implements MockTokenFactory {
  private farmerBalances: Map<string, number> = new Map();
  private cropTokens: Map<number, CropData> = new Map();

  setFarmerBalance(farmer: string, balance: number): void {
    this.farmerBalances.set(farmer, balance);
  }

  setCropToken(tokenId: number, cropData: CropData): void {
    this.cropTokens.set(tokenId, cropData);
  }

  getFarmerBalance(farmer: string): number {
    return this.farmerBalances.get(farmer) || 0;
  }

  getCropToken(tokenId: number): CropData {
    const token = this.cropTokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }
    return token;
  }

  burnTokens(tokenId: number, amount: number): void {
    const token = this.cropTokens.get(tokenId);
    if (!token) {
      throw new Error('Token does not exist');
    }
    if (token.totalSupply < amount) {
      throw new Error('Insufficient token supply');
    }
    token.totalSupply -= amount;
  }
}

class MockLoanManagerContract implements MockLoanManager {
  owner: string;
  tokenFactory: MockTokenFactory;
  loans: Map<number, Loan> = new Map();
  borrowerLoans: Map<string, number[]> = new Map();
  lenderLoans: Map<string, number[]> = new Map();
  loanCollateral: Map<number, CollateralInfo> = new Map();
  loanIdCounter: number = 1;

  static readonly COLLATERAL_RATIO = 200;
  static readonly BASIS_POINTS = 10000;

  constructor(owner: string, tokenFactory: MockTokenFactory) {
    this.owner = owner;
    this.tokenFactory = tokenFactory;
  }

  createLoan(
    loanAmount: number,
    collateralTokenId: number,
    collateralAmount: number,
    interestRate: number,
    loanDuration: number,
    caller: string
  ): number {
    if (loanAmount <= 0) {
      throw new Error('Loan amount must be greater than 0');
    }
    if (collateralAmount <= 0) {
      throw new Error('Collateral amount must be greater than 0');
    }
    if (interestRate <= 0 || interestRate > 5000) {
      throw new Error('Interest rate must be between 0.01% and 50%');
    }
    if (loanDuration <= 0) {
      throw new Error('Loan duration must be greater than 0');
    }

    // Verify borrower owns sufficient collateral
    const farmerBalance = this.tokenFactory.getFarmerBalance(caller);
    if (farmerBalance < collateralAmount) {
      throw new Error('Insufficient collateral balance');
    }

    // Get crop token details
    const cropData = this.tokenFactory.getCropToken(collateralTokenId);
    if (cropData.farmer !== caller) {
      throw new Error('Not owner of collateral token');
    }
    if (!cropData.isActive) {
      throw new Error('Collateral token is not active');
    }

    // Calculate collateral value and verify 200% coverage
    const collateralValue = (collateralAmount * cropData.estimatedValue) / cropData.totalSupply;
    const requiredCollateralValue = (loanAmount * MockLoanManagerContract.COLLATERAL_RATIO) / 100;

    if (collateralValue < requiredCollateralValue) {
      throw new Error('Insufficient collateral value for 200% coverage');
    }

    const loanId = this.loanIdCounter++;
    const dueDate = Date.now() + loanDuration;

    this.loans.set(loanId, {
      borrower: caller,
      lender: '',
      principal: loanAmount,
      collateralAmount,
      collateralTokenId,
      interestRate,
      dueDate,
      outstandingBalance: loanAmount,
      status: LoanStatus.PENDING,
      createdAt: Date.now(),
      approvedAt: 0
    });

    this.loanCollateral.set(loanId, {
      tokenId: collateralTokenId,
      amount: collateralAmount,
      value: collateralValue,
      isLocked: false
    });

    if (!this.borrowerLoans.has(caller)) {
      this.borrowerLoans.set(caller, []);
    }
    this.borrowerLoans.get(caller)!.push(loanId);

    return loanId;
  }

  approveLoan(loanId: number, lender: string, fundingAmount: number): void {
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }

    const loan = this.loans.get(loanId)!;
    if (loan.status !== LoanStatus.PENDING) {
      throw new Error('Loan is not pending');
    }
    if (fundingAmount < loan.principal) {
      throw new Error('Insufficient USDC provided');
    }

    // Lock collateral
    const collateral = this.loanCollateral.get(loanId)!;
    collateral.isLocked = true;

    // Update loan details
    loan.lender = lender;
    loan.status = LoanStatus.ACTIVE;
    loan.approvedAt = Date.now();

    // Calculate interest and update outstanding balance
    const interest = this.calculateInterest(loan.principal, loan.interestRate, loan.dueDate - Date.now());
    loan.outstandingBalance = loan.principal + interest;

    if (!this.lenderLoans.has(lender)) {
      this.lenderLoans.set(lender, []);
    }
    this.lenderLoans.get(lender)!.push(loanId);
  }

  repayLoan(loanId: number, repaymentAmount: number, caller: string): void {
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }

    const loan = this.loans.get(loanId)!;
    if (loan.borrower !== caller) {
      throw new Error('Only borrower can call this function');
    }
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error('Loan is not active');
    }
    if (repaymentAmount <= 0) {
      throw new Error('Repayment amount must be greater than 0');
    }

    const remainingBalance = loan.outstandingBalance;

    if (repaymentAmount >= remainingBalance) {
      // Full repayment
      loan.outstandingBalance = 0;
      loan.status = LoanStatus.REPAID;

      // Unlock collateral
      const collateral = this.loanCollateral.get(loanId)!;
      collateral.isLocked = false;
    } else {
      // Partial repayment
      loan.outstandingBalance -= repaymentAmount;
    }
  }

  liquidateCollateral(loanId: number, caller: string): void {
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }

    const loan = this.loans.get(loanId)!;
    if (caller !== loan.lender && caller !== this.owner) {
      throw new Error('Only lender or owner can liquidate');
    }
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error('Loan is not active');
    }
    if (Date.now() <= loan.dueDate) {
      throw new Error('Loan is not yet due');
    }

    const collateral = this.loanCollateral.get(loanId)!;
    if (!collateral.isLocked) {
      throw new Error('Collateral is not locked');
    }

    // Mark loan as liquidated
    loan.status = LoanStatus.LIQUIDATED;
    collateral.isLocked = false;

    // Burn the collateral tokens
    this.tokenFactory.burnTokens(collateral.tokenId, collateral.amount);
  }

  markLoanAsDefaulted(loanId: number, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }

    const loan = this.loans.get(loanId)!;
    if (loan.status !== LoanStatus.ACTIVE) {
      throw new Error('Loan is not active');
    }
    if (Date.now() <= loan.dueDate) {
      throw new Error('Loan is not yet due');
    }

    loan.status = LoanStatus.DEFAULTED;
  }

  calculateInterest(principal: number, annualRate: number, duration: number): number {
    const secondsPerYear = 365 * 24 * 60 * 60;
    return (principal * annualRate * duration) / (MockLoanManagerContract.BASIS_POINTS * secondsPerYear);
  }

  checkCollateralRatio(loanAmount: number, collateralValue: number): boolean {
    const requiredCollateralValue = (loanAmount * MockLoanManagerContract.COLLATERAL_RATIO) / 100;
    return collateralValue >= requiredCollateralValue;
  }

  getLoan(loanId: number): Loan {
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }
    return this.loans.get(loanId)!;
  }

  getBorrowerLoans(borrower: string): number[] {
    return this.borrowerLoans.get(borrower) || [];
  }

  getLenderLoans(lender: string): number[] {
    return this.lenderLoans.get(lender) || [];
  }

  getCollateralInfo(loanId: number): CollateralInfo {
    if (!this.loans.has(loanId)) {
      throw new Error('Loan does not exist');
    }
    return this.loanCollateral.get(loanId)!;
  }

  getTotalLoansCreated(): number {
    return this.loanIdCounter - 1;
  }

  transferOwnership(newOwner: string, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (newOwner === '0x0') {
      throw new Error('New owner cannot be zero address');
    }
    this.owner = newOwner;
  }
}

describe('LoanManager Contract Tests', () => {
  let contract: MockLoanManagerContract;
  let tokenFactory: MockTokenFactoryContract;
  let owner: string;
  let borrower: string;
  let lender: string;

  beforeEach(() => {
    owner = '0x1234567890123456789012345678901234567890';
    borrower = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    lender = '0x9876543210987654321098765432109876543210';
    
    tokenFactory = new MockTokenFactoryContract();
    contract = new MockLoanManagerContract(owner, tokenFactory);

    // Setup default crop token and farmer balance
    tokenFactory.setCropToken(1, {
      farmer: borrower,
      estimatedValue: 2000,
      cropType: 'manioc',
      harvestDate: Date.now() + 86400000,
      isActive: true,
      totalSupply: 1000,
      createdAt: Date.now()
    });
    tokenFactory.setFarmerBalance(borrower, 1000);
  });

  describe('Constructor and Initial State', () => {
    it('should set the correct owner and token factory', () => {
      expect(contract.owner).toBe(owner);
      expect(contract.tokenFactory).toBe(tokenFactory);
    });

    it('should initialize loan counter to 1', () => {
      expect(contract.loanIdCounter).toBe(1);
    });

    it('should have correct constants', () => {
      expect(MockLoanManagerContract.COLLATERAL_RATIO).toBe(200);
      expect(MockLoanManagerContract.BASIS_POINTS).toBe(10000);
    });
  });

  describe('createLoan', () => {
    const validParams = {
      loanAmount: 500,
      collateralTokenId: 1,
      collateralAmount: 500, // 50% of total supply, worth 1000 USDC (200% of loan)
      interestRate: 1000, // 10%
      loanDuration: 86400000 // 1 day
    };

    it('should create a loan with valid parameters', () => {
      const loanId = contract.createLoan(
        validParams.loanAmount,
        validParams.collateralTokenId,
        validParams.collateralAmount,
        validParams.interestRate,
        validParams.loanDuration,
        borrower
      );

      expect(loanId).toBe(1);
      
      const loan = contract.getLoan(loanId);
      expect(loan.borrower).toBe(borrower);
      expect(loan.principal).toBe(validParams.loanAmount);
      expect(loan.collateralAmount).toBe(validParams.collateralAmount);
      expect(loan.status).toBe(LoanStatus.PENDING);
    });

    it('should add loan to borrower\'s loan list', () => {
      const loanId = contract.createLoan(
        validParams.loanAmount,
        validParams.collateralTokenId,
        validParams.collateralAmount,
        validParams.interestRate,
        validParams.loanDuration,
        borrower
      );

      const borrowerLoans = contract.getBorrowerLoans(borrower);
      expect(borrowerLoans).toContain(loanId);
    });

    it('should create collateral info', () => {
      const loanId = contract.createLoan(
        validParams.loanAmount,
        validParams.collateralTokenId,
        validParams.collateralAmount,
        validParams.interestRate,
        validParams.loanDuration,
        borrower
      );

      const collateralInfo = contract.getCollateralInfo(loanId);
      expect(collateralInfo.tokenId).toBe(validParams.collateralTokenId);
      expect(collateralInfo.amount).toBe(validParams.collateralAmount);
      expect(collateralInfo.isLocked).toBe(false);
    });

    it('should revert with zero loan amount', () => {
      expect(() => {
        contract.createLoan(0, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, validParams.loanDuration, borrower);
      }).toThrow('Loan amount must be greater than 0');
    });

    it('should revert with zero collateral amount', () => {
      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, 0, validParams.interestRate, validParams.loanDuration, borrower);
      }).toThrow('Collateral amount must be greater than 0');
    });

    it('should revert with invalid interest rate', () => {
      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, 0, validParams.loanDuration, borrower);
      }).toThrow('Interest rate must be between 0.01% and 50%');

      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, 6000, validParams.loanDuration, borrower);
      }).toThrow('Interest rate must be between 0.01% and 50%');
    });

    it('should revert with zero loan duration', () => {
      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, 0, borrower);
      }).toThrow('Loan duration must be greater than 0');
    });

    it('should revert with insufficient collateral balance', () => {
      tokenFactory.setFarmerBalance(borrower, 100);
      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, validParams.loanDuration, borrower);
      }).toThrow('Insufficient collateral balance');
    });

    it('should revert when not owner of collateral token', () => {
      const anotherBorrower = '0x1111111111111111111111111111111111111111';
      // Set sufficient balance for the other borrower to pass the balance check
      tokenFactory.setFarmerBalance(anotherBorrower, 1000);
      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, validParams.loanDuration, anotherBorrower);
      }).toThrow('Not owner of collateral token');
    });

    it('should revert with inactive collateral token', () => {
      tokenFactory.setCropToken(1, {
        farmer: borrower,
        estimatedValue: 2000,
        cropType: 'manioc',
        harvestDate: Date.now() + 86400000,
        isActive: false,
        totalSupply: 1000,
        createdAt: Date.now()
      });

      expect(() => {
        contract.createLoan(validParams.loanAmount, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, validParams.loanDuration, borrower);
      }).toThrow('Collateral token is not active');
    });

    it('should revert with insufficient collateral value', () => {
      expect(() => {
        contract.createLoan(1200, validParams.collateralTokenId, validParams.collateralAmount, validParams.interestRate, validParams.loanDuration, borrower);
      }).toThrow('Insufficient collateral value for 200% coverage');
    });
  });

  describe('approveLoan', () => {
    let loanId: number;

    beforeEach(() => {
      loanId = contract.createLoan(500, 1, 500, 1000, 86400000, borrower);
    });

    it('should approve loan successfully', () => {
      contract.approveLoan(loanId, lender, 500);

      const loan = contract.getLoan(loanId);
      expect(loan.lender).toBe(lender);
      expect(loan.status).toBe(LoanStatus.ACTIVE);
      expect(loan.approvedAt).toBeGreaterThan(0);

      const collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(true);
    });

    it('should add loan to lender\'s loan list', () => {
      contract.approveLoan(loanId, lender, 500);

      const lenderLoans = contract.getLenderLoans(lender);
      expect(lenderLoans).toContain(loanId);
    });

    it('should calculate and set outstanding balance with interest', () => {
      contract.approveLoan(loanId, lender, 500);

      const loan = contract.getLoan(loanId);
      expect(loan.outstandingBalance).toBeGreaterThan(loan.principal);
    });

    it('should revert for non-existent loan', () => {
      expect(() => {
        contract.approveLoan(999, lender, 500);
      }).toThrow('Loan does not exist');
    });

    it('should revert for non-pending loan', () => {
      contract.approveLoan(loanId, lender, 500);
      expect(() => {
        contract.approveLoan(loanId, lender, 500);
      }).toThrow('Loan is not pending');
    });

    it('should revert with insufficient funding', () => {
      expect(() => {
        contract.approveLoan(loanId, lender, 400);
      }).toThrow('Insufficient USDC provided');
    });
  });

  describe('repayLoan', () => {
    let loanId: number;

    beforeEach(() => {
      loanId = contract.createLoan(500, 1, 500, 1000, 86400000, borrower);
      contract.approveLoan(loanId, lender, 500);
    });

    it('should handle full repayment', () => {
      const loan = contract.getLoan(loanId);
      const outstandingBalance = loan.outstandingBalance;

      contract.repayLoan(loanId, outstandingBalance, borrower);

      const updatedLoan = contract.getLoan(loanId);
      expect(updatedLoan.outstandingBalance).toBe(0);
      expect(updatedLoan.status).toBe(LoanStatus.REPAID);

      const collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(false);
    });

    it('should handle partial repayment', () => {
      const loan = contract.getLoan(loanId);
      const outstandingBalance = loan.outstandingBalance;
      const partialPayment = Math.floor(outstandingBalance / 2);

      contract.repayLoan(loanId, partialPayment, borrower);

      const updatedLoan = contract.getLoan(loanId);
      expect(updatedLoan.outstandingBalance).toBe(outstandingBalance - partialPayment);
      expect(updatedLoan.status).toBe(LoanStatus.ACTIVE);

      const collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(true);
    });

    it('should revert for non-existent loan', () => {
      expect(() => {
        contract.repayLoan(999, 100, borrower);
      }).toThrow('Loan does not exist');
    });

    it('should revert when called by non-borrower', () => {
      expect(() => {
        contract.repayLoan(loanId, 100, lender);
      }).toThrow('Only borrower can call this function');
    });

    it('should revert for non-active loan', () => {
      const loan = contract.getLoan(loanId);
      contract.repayLoan(loanId, loan.outstandingBalance, borrower);

      expect(() => {
        contract.repayLoan(loanId, 100, borrower);
      }).toThrow('Loan is not active');
    });

    it('should revert with zero repayment amount', () => {
      expect(() => {
        contract.repayLoan(loanId, 0, borrower);
      }).toThrow('Repayment amount must be greater than 0');
    });
  });

  describe('liquidateCollateral', () => {
    let loanId: number;

    beforeEach(() => {
      loanId = contract.createLoan(500, 1, 500, 1000, 1000, borrower); // Very short duration
      contract.approveLoan(loanId, lender, 500);
      
      // Simulate time passing beyond due date
      const loan = contract.getLoan(loanId);
      loan.dueDate = Date.now() - 1000; // Set due date in the past
    });

    it('should liquidate collateral when called by lender', () => {
      contract.liquidateCollateral(loanId, lender);

      const loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.LIQUIDATED);

      const collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(false);
    });

    it('should liquidate collateral when called by owner', () => {
      contract.liquidateCollateral(loanId, owner);

      const loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.LIQUIDATED);
    });

    it('should burn collateral tokens', () => {
      const initialSupply = tokenFactory.getCropToken(1).totalSupply;
      contract.liquidateCollateral(loanId, lender);
      
      const finalSupply = tokenFactory.getCropToken(1).totalSupply;
      expect(finalSupply).toBe(initialSupply - 500);
    });

    it('should revert for non-existent loan', () => {
      expect(() => {
        contract.liquidateCollateral(999, lender);
      }).toThrow('Loan does not exist');
    });

    it('should revert when called by unauthorized address', () => {
      const unauthorized = '0x1111111111111111111111111111111111111111';
      expect(() => {
        contract.liquidateCollateral(loanId, unauthorized);
      }).toThrow('Only lender or owner can liquidate');
    });

    it('should revert for non-active loan', () => {
      contract.liquidateCollateral(loanId, lender);
      expect(() => {
        contract.liquidateCollateral(loanId, lender);
      }).toThrow('Loan is not active');
    });

    it('should revert when loan is not yet due', () => {
      const loan = contract.getLoan(loanId);
      loan.dueDate = Date.now() + 86400000; // Set due date in the future

      expect(() => {
        contract.liquidateCollateral(loanId, lender);
      }).toThrow('Loan is not yet due');
    });
  });

  describe('markLoanAsDefaulted', () => {
    let loanId: number;

    beforeEach(() => {
      loanId = contract.createLoan(500, 1, 500, 1000, 1000, borrower);
      contract.approveLoan(loanId, lender, 500);
      
      // Set due date in the past
      const loan = contract.getLoan(loanId);
      loan.dueDate = Date.now() - 1000;
    });

    it('should mark loan as defaulted when called by owner', () => {
      contract.markLoanAsDefaulted(loanId, owner);

      const loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.DEFAULTED);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.markLoanAsDefaulted(loanId, lender);
      }).toThrow('Only owner can call this function');
    });

    it('should revert for non-existent loan', () => {
      expect(() => {
        contract.markLoanAsDefaulted(999, owner);
      }).toThrow('Loan does not exist');
    });

    it('should revert for non-active loan', () => {
      contract.markLoanAsDefaulted(loanId, owner);
      expect(() => {
        contract.markLoanAsDefaulted(loanId, owner);
      }).toThrow('Loan is not active');
    });

    it('should revert when loan is not yet due', () => {
      const loan = contract.getLoan(loanId);
      loan.dueDate = Date.now() + 86400000;

      expect(() => {
        contract.markLoanAsDefaulted(loanId, owner);
      }).toThrow('Loan is not yet due');
    });
  });

  describe('Utility Functions', () => {
    describe('calculateInterest', () => {
      it('should calculate interest correctly', () => {
        const principal = 1000;
        const annualRate = 1000; // 10%
        const duration = 365 * 24 * 60 * 60; // 1 year in seconds

        const interest = contract.calculateInterest(principal, annualRate, duration);
        expect(interest).toBe(100); // 10% of 1000
      });

      it('should calculate interest for partial year', () => {
        const principal = 1000;
        const annualRate = 1000; // 10%
        const duration = 182.5 * 24 * 60 * 60; // 6 months in seconds

        const interest = contract.calculateInterest(principal, annualRate, duration);
        expect(Math.round(interest)).toBe(50); // 5% of 1000
      });

      it('should handle zero values', () => {
        expect(contract.calculateInterest(0, 1000, 86400)).toBe(0);
        expect(contract.calculateInterest(1000, 0, 86400)).toBe(0);
        expect(contract.calculateInterest(1000, 1000, 0)).toBe(0);
      });
    });

    describe('checkCollateralRatio', () => {
      it('should return true for sufficient collateral', () => {
        expect(contract.checkCollateralRatio(100, 200)).toBe(true);
        expect(contract.checkCollateralRatio(100, 250)).toBe(true);
      });

      it('should return false for insufficient collateral', () => {
        expect(contract.checkCollateralRatio(100, 199)).toBe(false);
        expect(contract.checkCollateralRatio(100, 100)).toBe(false);
      });

      it('should handle edge case of exactly 200%', () => {
        expect(contract.checkCollateralRatio(100, 200)).toBe(true);
      });
    });
  });

  describe('View Functions', () => {
    let loanId1: number;
    let loanId2: number;

    beforeEach(() => {
      loanId1 = contract.createLoan(500, 1, 500, 1000, 86400000, borrower);
      loanId2 = contract.createLoan(300, 1, 300, 1200, 86400000, borrower);
      contract.approveLoan(loanId1, lender, 500);
    });

    describe('getLoan', () => {
      it('should return correct loan data', () => {
        const loan = contract.getLoan(loanId1);
        expect(loan.borrower).toBe(borrower);
        expect(loan.lender).toBe(lender);
        expect(loan.principal).toBe(500);
        expect(loan.status).toBe(LoanStatus.ACTIVE);
      });

      it('should revert for non-existent loan', () => {
        expect(() => {
          contract.getLoan(999);
        }).toThrow('Loan does not exist');
      });
    });

    describe('getBorrowerLoans', () => {
      it('should return all loans for a borrower', () => {
        const loans = contract.getBorrowerLoans(borrower);
        expect(loans).toEqual([loanId1, loanId2]);
      });

      it('should return empty array for borrower with no loans', () => {
        const newBorrower = '0x1111111111111111111111111111111111111111';
        const loans = contract.getBorrowerLoans(newBorrower);
        expect(loans).toEqual([]);
      });
    });

    describe('getLenderLoans', () => {
      it('should return all loans for a lender', () => {
        const loans = contract.getLenderLoans(lender);
        expect(loans).toEqual([loanId1]);
      });

      it('should return empty array for lender with no loans', () => {
        const newLender = '0x2222222222222222222222222222222222222222';
        const loans = contract.getLenderLoans(newLender);
        expect(loans).toEqual([]);
      });
    });

    describe('getCollateralInfo', () => {
      it('should return correct collateral info', () => {
        const collateral = contract.getCollateralInfo(loanId1);
        expect(collateral.tokenId).toBe(1);
        expect(collateral.amount).toBe(500);
        expect(collateral.isLocked).toBe(true);
      });

      it('should revert for non-existent loan', () => {
        expect(() => {
          contract.getCollateralInfo(999);
        }).toThrow('Loan does not exist');
      });
    });

    describe('getTotalLoansCreated', () => {
      it('should return correct total loans created', () => {
        expect(contract.getTotalLoansCreated()).toBe(2);
      });
    });
  });

  describe('transferOwnership', () => {
    const newOwner = '0x4444444444444444444444444444444444444444';

    it('should transfer ownership when called by current owner', () => {
      contract.transferOwnership(newOwner, owner);
      expect(contract.owner).toBe(newOwner);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.transferOwnership(newOwner, borrower);
      }).toThrow('Only owner can call this function');
    });

    it('should revert with zero address', () => {
      expect(() => {
        contract.transferOwnership('0x0', owner);
      }).toThrow('New owner cannot be zero address');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle multiple loans from same borrower', () => {
      const loan1 = contract.createLoan(200, 1, 200, 1000, 86400000, borrower);
      const loan2 = contract.createLoan(300, 1, 300, 1200, 86400000, borrower);

      contract.approveLoan(loan1, lender, 200);
      contract.approveLoan(loan2, lender, 300);

      const borrowerLoans = contract.getBorrowerLoans(borrower);
      const lenderLoans = contract.getLenderLoans(lender);

      expect(borrowerLoans).toHaveLength(2);
      expect(lenderLoans).toHaveLength(2);
    });

    it('should handle loan lifecycle correctly', () => {
      const loanId = contract.createLoan(500, 1, 500, 1000, 86400000, borrower);
      
      // Check initial state
      let loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.PENDING);
      
      // Approve loan
      contract.approveLoan(loanId, lender, 500);
      loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.ACTIVE);
      
      // Repay loan
      contract.repayLoan(loanId, loan.outstandingBalance, borrower);
      loan = contract.getLoan(loanId);
      expect(loan.status).toBe(LoanStatus.REPAID);
    });

    it('should maintain correct collateral state throughout loan lifecycle', () => {
      const loanId = contract.createLoan(500, 1, 500, 1000, 86400000, borrower);
      
      // Initial state
      let collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(false);
      
      // After approval
      contract.approveLoan(loanId, lender, 500);
      collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(true);
      
      // After repayment
      const loan = contract.getLoan(loanId);
      contract.repayLoan(loanId, loan.outstandingBalance, borrower);
      collateral = contract.getCollateralInfo(loanId);
      expect(collateral.isLocked).toBe(false);
    });
  });
});