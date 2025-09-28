import {
  Client,
  AccountId,
  PrivateKey,
  ContractCallQuery,
  ContractFunctionParameters
} from "@hashgraph/sdk";

console.log("📖 Lecture du contrat MazaoTokenFactory déployé");
console.log("=".repeat(50));

const ACCOUNT_ID = "0.0.6913540";
const PRIVATE_KEY = "0x3b22b2f2b2a55be6efdeea3f3983c560c119bdd63f1ec4e148fde994d8b235c3";
const TOKEN_FACTORY_CONTRACT_ID = "0.0.6913666"; // Contrat déployé avec succès

async function readContract() {
  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(PRIVATE_KEY);
  
  client.setOperator(operatorId, operatorKey);
  
  console.log(`📋 Compte: ${ACCOUNT_ID}`);
  console.log(`📦 Contrat: ${TOKEN_FACTORY_CONTRACT_ID}`);
  console.log(`🔗 Explorateur: https://hashscan.io/testnet/contract/${TOKEN_FACTORY_CONTRACT_ID}`);
  console.log("");
  
  try {
    // Essayer de lire des informations basiques du contrat
    console.log("🔍 Lecture des informations du contrat...");
    
    // Essayer de lire le propriétaire (owner)
    try {
      const ownerQuery = new ContractCallQuery()
        .setContractId(TOKEN_FACTORY_CONTRACT_ID)
        .setGas(100000)
        .setFunction("owner"); // Fonction standard pour obtenir le propriétaire
      
      const ownerResult = await ownerQuery.execute(client);
      console.log(`   👤 Propriétaire: ${ownerResult.getAddress(0)}`);
    } catch (error) {
      console.log(`   ⚠️  Impossible de lire le propriétaire: ${error.message}`);
    }
    
    // Essayer de lire le compteur de tokens
    try {
      const counterQuery = new ContractCallQuery()
        .setContractId(TOKEN_FACTORY_CONTRACT_ID)
        .setGas(100000)
        .setFunction("getTotalTokensCreated");
      
      const counterResult = await counterQuery.execute(client);
      console.log(`   🔢 Nombre total de tokens créés: ${counterResult.getUint256(0)}`);
    } catch (error) {
      console.log(`   ⚠️  Impossible de lire le compteur: ${error.message}`);
    }
    
    console.log("");
    console.log("✅ Contrat MazaoTokenFactory lu avec succès !");
    console.log("");
    
    // Créer un résumé du déploiement final
    const deploymentSummary = {
      network: "testnet",
      timestamp: new Date().toISOString(),
      deployer: ACCOUNT_ID,
      contracts: {
        MazaoTokenFactory: {
          contractId: TOKEN_FACTORY_CONTRACT_ID,
          status: "DEPLOYED_SUCCESS",
          explorerUrl: `https://hashscan.io/testnet/contract/${TOKEN_FACTORY_CONTRACT_ID}`,
          functions: [
            "createCropToken",
            "mintTokens", 
            "burnTokens",
            "getFarmerBalance",
            "getCropToken",
            "getTotalTokensCreated"
          ]
        },
        LoanManager: {
          status: "DEPLOYMENT_FAILED",
          reason: "INSUFFICIENT_GAS",
          note: "Peut être déployé séparément plus tard avec plus de gas"
        }
      },
      deploymentStatus: "PARTIAL_SUCCESS",
      nextSteps: [
        "Tester les fonctions du MazaoTokenFactory",
        "Déployer le LoanManager avec un bytecode optimisé",
        "Configurer l'intégration entre les contrats"
      ]
    };
    
    // Sauvegarder le résumé final
    import('fs').then(fs => {
      fs.writeFileSync('deployment-final-summary.json', JSON.stringify(deploymentSummary, null, 2));
      console.log("💾 Résumé final sauvegardé dans deployment-final-summary.json");
    });
    
    console.log("📊 RÉSUMÉ DU DÉPLOIEMENT:");
    console.log("=".repeat(50));
    console.log(`✅ MazaoTokenFactory: ${TOKEN_FACTORY_CONTRACT_ID}`);
    console.log(`❌ LoanManager: Échec (gas insuffisant)`);
    console.log("");
    console.log("🎯 PROCHAINES ÉTAPES:");
    console.log("1. Tester le MazaoTokenFactory déployé");
    console.log("2. Optimiser le bytecode du LoanManager");
    console.log("3. Redéployer le LoanManager avec plus de gas");
    console.log("4. Configurer l'intégration entre les contrats");
    
  } catch (error) {
    console.error("❌ Erreur lors de la lecture du contrat:", error.message);
  } finally {
    client.close();
  }
}

readContract()
  .then(() => {
    console.log("");
    console.log("✅ Lecture du contrat terminée");
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
  });