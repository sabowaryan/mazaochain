/**
 * Configuration for MazaoChain smart contracts
 */

export interface ContractConfig {
  // Collateral requirements
  COLLATERAL_RATIO: number; // 200% = 200
  BASIS_POINTS: number; // 10000 for percentage calculations
  
  // Interest rate limits
  MIN_INTEREST_RATE: number; // Minimum annual interest rate in basis points
  MAX_INTEREST_RATE: number; // Maximum annual interest rate in basis points
  
  // Loan duration limits
  MIN_LOAN_DURATION: number; // Minimum loan duration in seconds
  MAX_LOAN_DURATION: number; // Maximum loan duration in seconds
  
  // Token limits
  MAX_TOKEN_SUPPLY: number; // Maximum tokens that can be minted per crop
  MIN_CROP_VALUE: number; // Minimum crop value in USDC
  
  // Gas limits
  DEPLOY_GAS_LIMIT: number;
  FUNCTION_CALL_GAS_LIMIT: number;
  QUERY_GAS_LIMIT: number;
}

export const DEFAULT_CONFIG: ContractConfig = {
  // 200% collateralization required
  COLLATERAL_RATIO: 200,
  BASIS_POINTS: 10000,
  
  // Interest rates: 0.1% to 50% annually
  MIN_INTEREST_RATE: 10, // 0.1%
  MAX_INTEREST_RATE: 5000, // 50%
  
  // Loan duration: 1 day to 2 years
  MIN_LOAN_DURATION: 24 * 60 * 60, // 1 day
  MAX_LOAN_DURATION: 2 * 365 * 24 * 60 * 60, // 2 years
  
  // Token limits
  MAX_TOKEN_SUPPLY: 1000000, // 1 million tokens max per crop
  MIN_CROP_VALUE: 100, // Minimum 100 USDC crop value
  
  // Gas limits for Hedera
  DEPLOY_GAS_LIMIT: 300000,
  FUNCTION_CALL_GAS_LIMIT: 100000,
  QUERY_GAS_LIMIT: 50000
};

export const TESTNET_CONFIG: ContractConfig = {
  ...DEFAULT_CONFIG,
  // Lower limits for testing
  MIN_CROP_VALUE: 10, // 10 USDC minimum for testing
  MAX_INTEREST_RATE: 10000, // Allow up to 100% for testing
};

export const MAINNET_CONFIG: ContractConfig = {
  ...DEFAULT_CONFIG,
  // Stricter limits for production
  MAX_INTEREST_RATE: 3000, // Maximum 30% annually
  MIN_CROP_VALUE: 500, // Minimum 500 USDC for production
};

/**
 * Crop type configurations
 */
export interface CropTypeConfig {
  name: string;
  averageYieldPerHectare: number; // kg per hectare
  averageMarketPrice: number; // USDC per kg
  harvestSeasonMonths: number[]; // Months when harvest typically occurs
  riskFactor: number; // Risk multiplier (1.0 = normal risk)
}

export const SUPPORTED_CROPS: Record<string, CropTypeConfig> = {
  manioc: {
    name: "Manioc (Cassava)",
    averageYieldPerHectare: 15000, // 15 tons per hectare
    averageMarketPrice: 0.25, // $0.25 per kg
    harvestSeasonMonths: [5, 6, 7, 8], // May to August
    riskFactor: 1.0
  },
  cafe: {
    name: "Coffee",
    averageYieldPerHectare: 1200, // 1.2 tons per hectare
    averageMarketPrice: 3.50, // $3.50 per kg
    harvestSeasonMonths: [10, 11, 12, 1], // October to January
    riskFactor: 1.2 // Higher risk due to price volatility
  }
};

/**
 * Network-specific configurations
 */
export interface NetworkConfig {
  name: string;
  hederaNetwork: "testnet" | "mainnet";
  contractConfig: ContractConfig;
  explorerUrl: string;
  faucetUrl?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: "Hedera Testnet",
    hederaNetwork: "testnet",
    contractConfig: TESTNET_CONFIG,
    explorerUrl: "https://hashscan.io/testnet",
    faucetUrl: "https://portal.hedera.com/faucet"
  },
  mainnet: {
    name: "Hedera Mainnet",
    hederaNetwork: "mainnet",
    contractConfig: MAINNET_CONFIG,
    explorerUrl: "https://hashscan.io/mainnet"
  }
};

/**
 * Validation functions
 */
export class ConfigValidator {
  static validateLoanAmount(amount: number, config: ContractConfig): boolean {
    return amount > 0;
  }

  static validateCollateralRatio(
    loanAmount: number,
    collateralValue: number,
    config: ContractConfig
  ): boolean {
    const requiredCollateral = (loanAmount * config.COLLATERAL_RATIO) / 100;
    return collateralValue >= requiredCollateral;
  }

  static validateInterestRate(rate: number, config: ContractConfig): boolean {
    return rate >= config.MIN_INTEREST_RATE && rate <= config.MAX_INTEREST_RATE;
  }

  static validateLoanDuration(duration: number, config: ContractConfig): boolean {
    return duration >= config.MIN_LOAN_DURATION && duration <= config.MAX_LOAN_DURATION;
  }

  static validateCropValue(value: number, config: ContractConfig): boolean {
    return value >= config.MIN_CROP_VALUE;
  }

  static validateCropType(cropType: string): boolean {
    return cropType in SUPPORTED_CROPS;
  }

  static validateHarvestDate(harvestDate: number, cropType: string): boolean {
    const crop = SUPPORTED_CROPS[cropType];
    if (!crop) return false;

    const harvestMonth = new Date(harvestDate * 1000).getMonth() + 1;
    return crop.harvestSeasonMonths.includes(harvestMonth);
  }
}

/**
 * Utility functions for contract calculations
 */
export class ContractUtils {
  static calculateCollateralRequirement(
    loanAmount: number,
    config: ContractConfig
  ): number {
    return (loanAmount * config.COLLATERAL_RATIO) / 100;
  }

  static calculateInterest(
    principal: number,
    annualRate: number,
    durationSeconds: number,
    config: ContractConfig
  ): number {
    const secondsPerYear = 365 * 24 * 60 * 60;
    return (principal * annualRate * durationSeconds) / (config.BASIS_POINTS * secondsPerYear);
  }

  static calculateCropValue(
    superficie: number,
    rendement: number,
    prixReference: number
  ): number {
    return superficie * rendement * prixReference;
  }

  static calculateRiskAdjustedValue(
    baseValue: number,
    cropType: string
  ): number {
    const crop = SUPPORTED_CROPS[cropType];
    if (!crop) return baseValue;
    
    return baseValue / crop.riskFactor;
  }

  static formatHbar(amount: number): string {
    return `${amount.toFixed(8)} ℏ`;
  }

  static formatUSDC(amount: number): string {
    return `$${amount.toFixed(2)} USDC`;
  }
}

export default {
  DEFAULT_CONFIG,
  TESTNET_CONFIG,
  MAINNET_CONFIG,
  SUPPORTED_CROPS,
  NETWORKS,
  ConfigValidator,
  ContractUtils
};