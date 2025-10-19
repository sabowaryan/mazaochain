/**
 * Script to create 3 test wallet accounts on Hedera Testnet
 * Usage: node scripts/create-test-wallets.js
 */

import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const ACCOUNT_TYPES = ["FARMER", "COOPERATIVE", "LENDER"];

async function createTestWallets() {
  console.log("🚀 Creating test wallets on Hedera Testnet...\n");

  // Initialize client with server account
  const client = Client.forTestnet();
  const operatorId = process.env.HEDERA_ACCOUNT_ID;
  const operatorKeyString = process.env.HEDERA_PRIVATE_KEY;

  if (!operatorId || !operatorKeyString) {
    throw new Error(
      "Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env.local"
    );
  }

  // Parse the private key - try different formats
  let operatorKey;
  try {
    // Try as DER format first (most common)
    if (operatorKeyString.startsWith("3030") || operatorKeyString.startsWith("302e")) {
      operatorKey = PrivateKey.fromStringDer(operatorKeyString);
    } else if (operatorKeyString.length === 64) {
      // Try as raw hex (64 characters) - could be ED25519 or ECDSA
      try {
        operatorKey = PrivateKey.fromStringED25519(operatorKeyString);
      } catch {
        operatorKey = PrivateKey.fromStringECDSA(operatorKeyString);
      }
    } else {
      throw new Error("Invalid private key format");
    }
  } catch (error) {
    console.error("❌ Failed to parse private key:", error.message);
    console.log("\n💡 Your private key should be either:");
    console.log("   - DER-encoded hex string (starts with 3030... or 302e...)");
    console.log("   - 64 character hex string (raw key)");
    console.log(`\n   Current key length: ${operatorKeyString.length}`);
    console.log(`   Current key starts with: ${operatorKeyString.substring(0, 10)}...`);
    throw error;
  }

  client.setOperator(operatorId, operatorKey);

  console.log(`📋 Using operator account: ${operatorId}\n`);

  // Check operator balance
  const operatorBalance = await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(client);

  console.log(
    `💰 Operator balance: ${operatorBalance.hbars.toString()}\n`
  );

  if (operatorBalance.hbars.toBigNumber().isLessThan(30)) {
    console.error(
      "❌ Insufficient balance. Need at least 30 HBAR to create 3 accounts."
    );
    console.log(
      "   Get testnet HBAR from: https://portal.hedera.com/faucet\n"
    );
    process.exit(1);
  }

  const accounts = [];

  // Create 3 accounts
  for (const accountType of ACCOUNT_TYPES) {
    console.log(`\n🔑 Creating ${accountType} account...`);

    try {
      // Generate new key pair
      const privateKey = PrivateKey.generateED25519();
      const publicKey = privateKey.publicKey;

      console.log(`   Generating keys...`);

      // Create account with initial balance
      const transaction = await new AccountCreateTransaction()
        .setKey(publicKey)
        .setInitialBalance(new Hbar(100)) // 100 HBAR initial balance
        .setMaxTransactionFee(new Hbar(2))
        .execute(client);

      // Get receipt
      const receipt = await transaction.getReceipt(client);
      const accountId = receipt.accountId;

      console.log(`   ✅ Account created successfully!`);
      console.log(`   Account ID: ${accountId.toString()}`);

      // Verify balance
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

      console.log(`   Balance: ${balance.hbars.toString()}`);

      accounts.push({
        type: accountType,
        accountId: accountId.toString(),
        publicKey: publicKey.toString(),
        privateKey: privateKey.toString(),
        balance: balance.hbars.toString(),
      });
    } catch (error) {
      console.error(`   ❌ Failed to create ${accountType} account:`, error.message);
    }
  }

  client.close();

  // Display results
  console.log("\n" + "=".repeat(80));
  console.log("✨ TEST WALLETS CREATED SUCCESSFULLY!");
  console.log("=".repeat(80) + "\n");

  accounts.forEach((account) => {
    console.log(`📍 ${account.type} ACCOUNT`);
    console.log(`   Account ID:  ${account.accountId}`);
    console.log(`   Public Key:  ${account.publicKey}`);
    console.log(`   Private Key: ${account.privateKey}`);
    console.log(`   Balance:     ${account.balance}`);
    console.log(`   HashScan:    https://hashscan.io/testnet/account/${account.accountId}`);
    console.log("");
  });

  // Generate .env format
  console.log("=".repeat(80));
  console.log("📝 ADD THESE TO YOUR .env.local (for testing purposes):");
  console.log("=".repeat(80) + "\n");

  accounts.forEach((account) => {
    console.log(`# ${account.type} Test Account`);
    console.log(`TEST_${account.type}_ACCOUNT_ID=${account.accountId}`);
    console.log(`TEST_${account.type}_PRIVATE_KEY=${account.privateKey}`);
    console.log(`TEST_${account.type}_PUBLIC_KEY=${account.publicKey}`);
    console.log("");
  });

  // Generate JSON file
  const outputPath = "scripts/test-wallets.json";
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        created: new Date().toISOString(),
        network: "testnet",
        accounts: accounts,
      },
      null,
      2
    )
  );

  console.log("=".repeat(80));
  console.log(`💾 Wallet details saved to: ${outputPath}`);
  console.log("=".repeat(80) + "\n");

  console.log("⚠️  IMPORTANT SECURITY NOTES:");
  console.log("   1. These are TEST accounts only - never use on mainnet");
  console.log("   2. Keep private keys secure and never commit to Git");
  console.log("   3. Add test-wallets.json to .gitignore");
  console.log("   4. For production, users will use their own HashPack wallets\n");

  console.log("🎉 Done! You can now use these accounts for testing.\n");
}

// Run the script
createTestWallets().catch((error) => {
  console.error("\n❌ Error creating test wallets:", error);
  process.exit(1);
});
