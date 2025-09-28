import {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateTransaction,
  ContractFunctionParameters,
  Hbar,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCallQuery,
  ContractExecuteTransaction
} from "@hashgraph/sdk";
import * as fs from "fs";
import * as path from "path";
import { compileContracts, MAZAO_TOKEN_FACTORY_BYTECODE, LOAN_MANAGER_BYTECODE } from "./compile-contracts.js";

// Environment configuration
interface DeploymentConfig {
  operatorId: string;
  operatorKey: string;
  network: "testnet" | "mainnet";
}

class ContractDeployer {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor(config: DeploymentConfig) {
    this.operatorId = AccountId.fromString(config.operatorId);
    this.operatorKey = PrivateKey.fromString(config.operatorKey);

    if (config.network === "testnet") {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
    }

    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  /**
   * Deploy a contract to Hedera
   * @param contractBytecode Compiled contract bytecode
   * @param constructorParams Constructor parameters
   * @param gas Gas limit for deployment
   * @returns Contract ID
   */
  async deployContract(
    contractBytecode: string,
    constructorParams?: ContractFunctionParameters,
    gas: number = 100000
  ): Promise<string> {
    try {
      // Create file to store contract bytecode
      const fileCreateTx = new FileCreateTransaction()
        .setContents(contractBytecode)
        .setKeys([this.operatorKey.publicKey])
        .setMaxTransactionFee(new Hbar(2));

      const fileCreateSubmit = await fileCreateTx.execute(this.client);
      const fileCreateReceipt = await fileCreateSubmit.getReceipt(this.client);
      const bytecodeFileId = fileCreateReceipt.fileId;

      console.log(`Contract bytecode file created: ${bytecodeFileId}`);

      // If bytecode is large, append in chunks
      if (contractBytecode.length > 4096) {
        const chunks = this.chunkString(contractBytecode.slice(4096), 4096);
        for (const chunk of chunks) {
          const fileAppendTx = new FileAppendTransaction()
            .setFileId(bytecodeFileId!)
            .setContents(chunk)
            .setMaxTransactionFee(new Hbar(2));

          await fileAppendTx.execute(this.client);
        }
      }

      // Deploy contract
      const contractCreateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId!)
        .setGas(gas)
        .setMaxTransactionFee(new Hbar(20));

      if (constructorParams) {
        contractCreateTx.setConstructorParameters(constructorParams);
      }

      const contractCreateSubmit = await contractCreateTx.execute(this.client);
      const contractCreateReceipt = await contractCreateSubmit.getReceipt(this.client);
      const contractId = contractCreateReceipt.contractId;

      console.log(`Contract deployed with ID: ${contractId}`);
      return contractId!.toString();
    } catch (error) {
      console.error("Error deploying contract:", error);
      throw error;
    }
  }

  /**
   * Call a contract function
   * @param contractId Contract ID
   * @param functionName Function name
   * @param params Function parameters
   * @param gas Gas limit
   * @returns Transaction receipt
   */
  async callContractFunction(
    contractId: string,
    functionName: string,
    params?: ContractFunctionParameters,
    gas: number = 100000
  ) {
    try {
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunction(functionName, params)
        .setMaxTransactionFee(new Hbar(2));

      const contractExecuteSubmit = await contractExecuteTx.execute(this.client);
      const contractExecuteReceipt = await contractExecuteSubmit.getReceipt(this.client);

      console.log(`Function ${functionName} called successfully`);
      return contractExecuteReceipt;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Query a contract function
   * @param contractId Contract ID
   * @param functionName Function name
   * @param params Function parameters
   * @returns Query result
   */
  async queryContractFunction(
    contractId: string,
    functionName: string,
    params?: ContractFunctionParameters
  ) {
    try {
      const contractCallQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction(functionName, params)
        .setMaxQueryPayment(new Hbar(1));

      const contractCallResult = await contractCallQuery.execute(this.client);
      return contractCallResult;
    } catch (error) {
      console.error(`Error querying function ${functionName}:`, error);
      throw error;
    }
  }

  private chunkString(str: string, length: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += length) {
      chunks.push(str.slice(i, i + length));
    }
    return chunks;
  }

  close() {
    this.client.close();
  }
}

/**
 * Main deployment function
 */
async function deployMazaoContracts() {
  console.log("Starting MazaoChain contract deployment...");

  // Load configuration from environment
  const config: DeploymentConfig = {
    operatorId: process.env.HEDERA_ACCOUNT_ID || "",
    operatorKey: process.env.HEDERA_PRIVATE_KEY || "",
    network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") || "testnet"
  };

  if (!config.operatorId || !config.operatorKey) {
    throw new Error("Missing required environment variables: HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY");
  }

  const deployer = new ContractDeployer(config);

  try {
    // Compile contracts first
    console.log("Compiling contracts...");
    const compiler = new ContractCompiler();
    const compilationResults = await compiler.compileAll();
    
    const allSuccessful = compilationResults.every(r => r.success);
    if (!allSuccessful) {
      throw new Error("Contract compilation failed");
    }
    
    console.log("Deploying MazaoTokenFactory contract...");
    const tokenFactoryArtifact = compiler.getCompiledContract("MazaoTokenFactory");
    const tokenFactoryBytecode = tokenFactoryArtifact.bytecode;
    
    const tokenFactoryId = await deployer.deployContract(
      tokenFactoryBytecode,
      undefined, // No constructor parameters
      150000 // Gas limit
    );

    console.log("Deploying LoanManager contract...");
    const loanManagerArtifact = compiler.getCompiledContract("LoanManager");
    const loanManagerBytecode = loanManagerArtifact.bytecode;
    
    // Constructor parameters for LoanManager (token factory address)
    const constructorParams = new ContractFunctionParameters()
      .addAddress(tokenFactoryId);

    const loanManagerId = await deployer.deployContract(
      loanManagerBytecode,
      constructorParams,
      200000 // Gas limit
    );

    // Set loan manager in token factory
    console.log("Configuring contract relationships...");
    await deployer.callContractFunction(
      tokenFactoryId,
      "setLoanManager",
      new ContractFunctionParameters().addAddress(loanManagerId)
    );

    console.log("Deployment completed successfully!");
    console.log(`MazaoTokenFactory deployed at: ${tokenFactoryId}`);
    console.log(`LoanManager deployed at: ${loanManagerId}`);

    // Save deployment addresses
    const deploymentInfo = {
      network: config.network,
      timestamp: new Date().toISOString(),
      contracts: {
        MazaoTokenFactory: tokenFactoryId,
        LoanManager: loanManagerId
      }
    };

    fs.writeFileSync(
      path.join(__dirname, "../deployment-info.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment info saved to deployment-info.json");

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  } finally {
    deployer.close();
  }
}

// Export for use in other scripts
export { ContractDeployer, deployMazaoContracts };

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployMazaoContracts()
    .then(() => {
      console.log("Deployment script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Deployment script failed:", error);
      process.exit(1);
    });
}