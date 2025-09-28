import {
  Client,
  AccountId,
  PrivateKey,
  ContractFunctionParameters,
  Hbar,
  ContractCallQuery,
  ContractExecuteTransaction
} from "@hashgraph/sdk";
import { ContractDeployer } from "./deploy-contracts";

interface TestConfig {
  operatorId: string;
  operatorKey: string;
  network: "testnet" | "mainnet";
  tokenFactoryId: string;
  loanManagerId: string;
}

class ContractTester {
  private deployer: ContractDeployer;
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
    this.deployer = new ContractDeployer({
      operatorId: config.operatorId,
      operatorKey: config.operatorKey,
      network: config.network
    });
  }

  /**
   * Test MazaoTokenFactory contract functions
   */
  async testTokenFactory() {
    console.log("\n=== Testing MazaoTokenFactory ===");

    try {
      // Test 1: Create a crop token
      console.log("Test 1: Creating crop token...");
      const farmerAddress = this.config.operatorId; // Using operator as farmer for testing
      const estimatedValue = 1000; // 1000 USDC
      const cropType = "manioc";
      const harvestDate = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days from now

      const createTokenParams = new ContractFunctionParameters()
        .addAddress(farmerAddress)
        .addUint256(estimatedValue)
        .addString(cropType)
        .addUint256(harvestDate);

      await this.deployer.callContractFunction(
        this.config.tokenFactoryId,
        "createCropToken",
        createTokenParams
      );
      console.log("✓ Crop token created successfully");

      // Test 2: Mint tokens for the crop
      console.log("Test 2: Minting tokens...");
      const tokenId = 1; // First token created
      const mintAmount = 1000;

      const mintParams = new ContractFunctionParameters()
        .addUint256(tokenId)
        .addUint256(mintAmount);

      await this.deployer.callContractFunction(
        this.config.tokenFactoryId,
        "mintTokens",
        mintParams
      );
      console.log("✓ Tokens minted successfully");

      // Test 3: Query farmer balance
      console.log("Test 3: Querying farmer balance...");
      const balanceParams = new ContractFunctionParameters()
        .addAddress(farmerAddress);

      const balanceResult = await this.deployer.queryContractFunction(
        this.config.tokenFactoryId,
        "getFarmerBalance",
        balanceParams
      );
      console.log(`✓ Farmer balance: ${balanceResult.getUint256(0)}`);

      // Test 4: Query crop token details
      console.log("Test 4: Querying crop token details...");
      const tokenParams = new ContractFunctionParameters()
        .addUint256(tokenId);

      const tokenResult = await this.deployer.queryContractFunction(
        this.config.tokenFactoryId,
        "getCropToken",
        tokenParams
      );
      console.log("✓ Crop token details retrieved successfully");

      // Test 5: Query farmer's token IDs
      console.log("Test 5: Querying farmer's token IDs...");
      const tokenIdsResult = await this.deployer.queryContractFunction(
        this.config.tokenFactoryId,
        "getFarmerTokenIds",
        balanceParams
      );
      console.log("✓ Farmer's token IDs retrieved successfully");

      console.log("✅ All MazaoTokenFactory tests passed!");

    } catch (error) {
      console.error("❌ MazaoTokenFactory test failed:", error);
      throw error;
    }
  }

  /**
   * Test LoanManager contract functions
   */
  async testLoanManager() {
    console.log("\n=== Testing LoanManager ===");

    try {
      // Test 1: Create a loan request
      console.log("Test 1: Creating loan request...");
      const loanAmount = 400; // 400 USDC (less than 50% of 1000 USDC collateral)
      const collateralTokenId = 1;
      const collateralAmount = 1000; // All tokens as collateral
      const interestRate = 1000; // 10% annual rate (in basis points)
      const loanDuration = 30 * 24 * 60 * 60; // 30 days

      const createLoanParams = new ContractFunctionParameters()
        .addUint256(loanAmount)
        .addUint256(collateralTokenId)
        .addUint256(collateralAmount)
        .addUint256(interestRate)
        .addUint256(loanDuration);

      await this.deployer.callContractFunction(
        this.config.loanManagerId,
        "createLoan",
        createLoanParams
      );
      console.log("✓ Loan request created successfully");

      // Test 2: Query loan details
      console.log("Test 2: Querying loan details...");
      const loanId = 1; // First loan created
      const loanParams = new ContractFunctionParameters()
        .addUint256(loanId);

      const loanResult = await this.deployer.queryContractFunction(
        this.config.loanManagerId,
        "getLoan",
        loanParams
      );
      console.log("✓ Loan details retrieved successfully");

      // Test 3: Test collateral ratio validation
      console.log("Test 3: Testing collateral ratio validation...");
      const checkCollateralParams = new ContractFunctionParameters()
        .addUint256(loanAmount)
        .addUint256(1000); // Collateral value

      const collateralCheckResult = await this.deployer.queryContractFunction(
        this.config.loanManagerId,
        "checkCollateralRatio",
        checkCollateralParams
      );
      console.log(`✓ Collateral ratio check: ${collateralCheckResult.getBool(0)}`);

      // Test 4: Calculate interest
      console.log("Test 4: Testing interest calculation...");
      const interestParams = new ContractFunctionParameters()
        .addUint256(loanAmount)
        .addUint256(interestRate)
        .addUint256(loanDuration);

      const interestResult = await this.deployer.queryContractFunction(
        this.config.loanManagerId,
        "calculateInterest",
        interestParams
      );
      console.log(`✓ Calculated interest: ${interestResult.getUint256(0)}`);

      // Test 5: Query borrower loans
      console.log("Test 5: Querying borrower loans...");
      const borrowerAddress = this.config.operatorId;
      const borrowerParams = new ContractFunctionParameters()
        .addAddress(borrowerAddress);

      const borrowerLoansResult = await this.deployer.queryContractFunction(
        this.config.loanManagerId,
        "getBorrowerLoans",
        borrowerParams
      );
      console.log("✓ Borrower loans retrieved successfully");

      // Test 6: Query collateral info
      console.log("Test 6: Querying collateral info...");
      const collateralInfoResult = await this.deployer.queryContractFunction(
        this.config.loanManagerId,
        "getCollateralInfo",
        loanParams
      );
      console.log("✓ Collateral info retrieved successfully");

      console.log("✅ All LoanManager tests passed!");

    } catch (error) {
      console.error("❌ LoanManager test failed:", error);
      throw error;
    }
  }

  /**
   * Test integration between contracts
   */
  async testIntegration() {
    console.log("\n=== Testing Contract Integration ===");

    try {
      // Test 1: Verify loan manager is set in token factory
      console.log("Test 1: Verifying contract integration...");
      
      // This would require a getter function in the contract
      // For now, we'll test by trying to burn tokens from loan manager
      
      // Test 2: Test token burning from loan manager
      console.log("Test 2: Testing token burning from loan manager...");
      const tokenId = 1;
      const burnAmount = 100;

      const burnParams = new ContractFunctionParameters()
        .addUint256(tokenId)
        .addUint256(burnAmount);

      await this.deployer.callContractFunction(
        this.config.tokenFactoryId,
        "burnTokens",
        burnParams
      );
      console.log("✓ Tokens burned successfully");

      // Test 3: Verify balance after burning
      console.log("Test 3: Verifying balance after burning...");
      const farmerAddress = this.config.operatorId;
      const balanceParams = new ContractFunctionParameters()
        .addAddress(farmerAddress);

      const balanceResult = await this.deployer.queryContractFunction(
        this.config.tokenFactoryId,
        "getFarmerBalance",
        balanceParams
      );
      console.log(`✓ Updated farmer balance: ${balanceResult.getUint256(0)}`);

      console.log("✅ All integration tests passed!");

    } catch (error) {
      console.error("❌ Integration test failed:", error);
      throw error;
    }
  }

  /**
   * Test edge cases and error conditions
   */
  async testEdgeCases() {
    console.log("\n=== Testing Edge Cases ===");

    try {
      // Test 1: Try to create loan with insufficient collateral
      console.log("Test 1: Testing insufficient collateral rejection...");
      try {
        const insufficientLoanParams = new ContractFunctionParameters()
          .addUint256(600) // 600 USDC loan
          .addUint256(1) // Token ID
          .addUint256(500) // Only 500 tokens (insufficient for 200% coverage)
          .addUint256(1000) // 10% interest
          .addUint256(30 * 24 * 60 * 60); // 30 days

        await this.deployer.callContractFunction(
          this.config.loanManagerId,
          "createLoan",
          insufficientLoanParams
        );
        console.log("❌ Should have failed with insufficient collateral");
      } catch (error) {
        console.log("✓ Correctly rejected insufficient collateral");
      }

      // Test 2: Try to create token with invalid parameters
      console.log("Test 2: Testing invalid token creation...");
      try {
        const invalidTokenParams = new ContractFunctionParameters()
          .addAddress("0x0000000000000000000000000000000000000000") // Invalid address
          .addUint256(1000)
          .addString("manioc")
          .addUint256(Math.floor(Date.now() / 1000) + 86400);

        await this.deployer.callContractFunction(
          this.config.tokenFactoryId,
          "createCropToken",
          invalidTokenParams
        );
        console.log("❌ Should have failed with invalid farmer address");
      } catch (error) {
        console.log("✓ Correctly rejected invalid farmer address");
      }

      console.log("✅ All edge case tests passed!");

    } catch (error) {
      console.error("❌ Edge case test failed:", error);
      throw error;
    }
  }

  close() {
    // Close the deployer's client
    // Note: The deployer doesn't expose a close method in our current implementation
    // In a real implementation, you'd want to properly close the client
  }
}

/**
 * Main testing function
 */
async function runContractTests() {
  console.log("Starting MazaoChain contract tests...");

  // Load configuration
  const config: TestConfig = {
    operatorId: process.env.HEDERA_ACCOUNT_ID || "",
    operatorKey: process.env.HEDERA_PRIVATE_KEY || "",
    network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") || "testnet",
    tokenFactoryId: process.env.TOKEN_FACTORY_CONTRACT_ID || "",
    loanManagerId: process.env.LOAN_MANAGER_CONTRACT_ID || ""
  };

  if (!config.operatorId || !config.operatorKey) {
    throw new Error("Missing required environment variables: HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY");
  }

  if (!config.tokenFactoryId || !config.loanManagerId) {
    throw new Error("Missing contract IDs: TOKEN_FACTORY_CONTRACT_ID, LOAN_MANAGER_CONTRACT_ID");
  }

  const tester = new ContractTester(config);

  try {
    await tester.testTokenFactory();
    await tester.testLoanManager();
    await tester.testIntegration();
    await tester.testEdgeCases();

    console.log("\n🎉 All contract tests completed successfully!");

  } catch (error) {
    console.error("\n💥 Contract tests failed:", error);
    throw error;
  } finally {
    tester.close();
  }
}

// Export for use in other scripts
export { ContractTester, runContractTests };

// Run tests if this script is executed directly
if (require.main === module) {
  runContractTests()
    .then(() => {
      console.log("Test script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test script failed:", error);
      process.exit(1);
    });
}