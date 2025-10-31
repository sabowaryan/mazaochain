/**
 * Service de Tokenisation Blockchain MazaoChain
 * 
 * Ce service surveille la table tokenization_records dans Supabase
 * et traite les enregistrements avec status 'pending' en créant
 * des tokens sur la blockchain Hedera.
 */

import { Client, PrivateKey, ContractExecuteTransaction, ContractId, ContractFunctionParameters } from '@hashgraph/sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration
const CONFIG = {
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK || 'testnet',
    tokenFactoryId: process.env.MAZAO_TOKEN_FACTORY_CONTRACT_ID
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  service: {
    pollInterval: parseInt(process.env.POLL_INTERVAL_MS) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY_MS) || 5000,
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Validation de la configuration
function validateConfig() {
  const required = [
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY',
    'MAZAO_TOKEN_FACTORY_CONTRACT_ID',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }

  console.log('✅ Configuration validée');
  console.log(`   - Réseau Hedera: ${CONFIG.hedera.network}`);
  console.log(`   - Compte Hedera: ${CONFIG.hedera.accountId}`);
  console.log(`   - Contrat Token Factory: ${CONFIG.hedera.tokenFactoryId}`);
  console.log(`   - Intervalle de polling: ${CONFIG.service.pollInterval}ms`);
}

// Initialiser le client Supabase
const supabase = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.serviceRoleKey
);

// Initialiser le client Hedera
let hederaClient;

function initializeHederaClient() {
  try {
    hederaClient = CONFIG.hedera.network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();

    hederaClient.setOperator(
      CONFIG.hedera.accountId,
      PrivateKey.fromString(CONFIG.hedera.privateKey)
    );

    console.log('✅ Client Hedera initialisé');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du client Hedera:', error);
    return false;
  }
}

/**
 * Créer un token sur la blockchain Hedera
 */
async function createCropToken(evaluation, farmerAddress) {
  try {
    console.log(`🔄 Création du token pour l'évaluation ${evaluation.id}...`);

    // Générer le symbole du token
    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
    
    // Calculer la date de récolte
    const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);
    const harvestDateTimestamp = Math.floor(harvestDate.getTime() / 1000);

    console.log(`   Token: ${tokenSymbol}`);
    console.log(`   Fermier: ${farmerAddress}`);
    console.log(`   Valeur: ${evaluation.valeur_estimee} USDC`);
    console.log(`   Date de récolte: ${harvestDate.toISOString()}`);

    // Préparer les paramètres de la fonction
    const functionParams = new ContractFunctionParameters()
      .addAddress(farmerAddress)
      .addUint256(evaluation.valeur_estimee)
      .addString(evaluation.crop_type)
      .addUint256(harvestDateTimestamp)
      .addString(tokenSymbol);

    // Exécuter la transaction
    const transaction = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(CONFIG.hedera.tokenFactoryId))
      .setGas(1000000)
      .setFunction('createCropToken', functionParams);

    const txResponse = await transaction.execute(hederaClient);
    const receipt = await txResponse.getReceipt(hederaClient);

    console.log(`✅ Token créé avec succès!`);
    console.log(`   Transaction ID: ${txResponse.transactionId.toString()}`);
    console.log(`   Status: ${receipt.status.toString()}`);

    return {
      success: true,
      transactionId: txResponse.transactionId.toString(),
      tokenSymbol,
      status: receipt.status.toString()
    };

  } catch (error) {
    console.error(`❌ Erreur lors de la création du token:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Traiter un enregistrement de tokenisation en attente
 */
async function processTokenizationRecord(record) {
  console.log(`\n📋 Traitement de l'enregistrement ${record.id}`);
  
  try {
    // Mettre à jour le status à 'minting'
    await supabase
      .from('tokenization_records')
      .update({ status: 'minting' })
      .eq('id', record.id);

    // Récupérer les détails de l'évaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('crop_evaluations')
      .select(`
        *,
        profiles!farmer_id (
          wallet_address
        )
      `)
      .eq('id', record.evaluation_id)
      .single();

    if (evalError || !evaluation) {
      throw new Error(`Évaluation non trouvée: ${evalError?.message}`);
    }

    const farmerAddress = evaluation.profiles?.wallet_address;
    if (!farmerAddress) {
      throw new Error('Adresse wallet du fermier non trouvée');
    }

    // Créer le token sur Hedera
    const result = await createCropToken(evaluation, farmerAddress);

    if (result.success) {
      // Mettre à jour l'enregistrement avec succès
      await supabase
        .from('tokenization_records')
        .update({
          status: 'completed',
          transaction_ids: [result.transactionId],
          completed_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', record.id);

      console.log(`✅ Enregistrement ${record.id} complété avec succès`);
      
      // Créer une notification pour l'agriculteur
      await supabase
        .from('notifications')
        .insert({
          user_id: evaluation.farmer_id,
          type: 'tokenization_completed',
          title: 'Tokenisation complétée',
          message: `Votre récolte de ${evaluation.crop_type} a été tokenisée sur la blockchain Hedera.`,
          metadata: {
            evaluation_id: evaluation.id,
            transaction_id: result.transactionId,
            token_symbol: result.tokenSymbol
          }
        });

      return { success: true };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error(`❌ Erreur lors du traitement:`, error);

    // Mettre à jour l'enregistrement avec l'erreur
    await supabase
      .from('tokenization_records')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', record.id);

    return { success: false, error: error.message };
  }
}

/**
 * Polling des enregistrements en attente
 */
async function pollPendingRecords() {
  try {
    // Récupérer les enregistrements en attente
    const { data: records, error } = await supabase
      .from('tokenization_records')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Erreur lors de la récupération des enregistrements:', error);
      return;
    }

    if (!records || records.length === 0) {
      console.log('⏳ Aucun enregistrement en attente');
      return;
    }

    console.log(`\n🔔 ${records.length} enregistrement(s) en attente`);

    // Traiter chaque enregistrement
    for (const record of records) {
      await processTokenizationRecord(record);
      
      // Petit délai entre chaque traitement
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error('❌ Erreur lors du polling:', error);
  }
}

/**
 * Démarrer le service
 */
async function startService() {
  console.log('\n🚀 Démarrage du service de tokenisation MazaoChain...\n');

  try {
    // Valider la configuration
    validateConfig();

    // Initialiser le client Hedera
    if (!initializeHederaClient()) {
      throw new Error('Impossible d\'initialiser le client Hedera');
    }

    console.log('\n✅ Service démarré avec succès!\n');
    console.log('📡 Polling des enregistrements en attente...\n');

    // Lancer le polling
    setInterval(pollPendingRecords, CONFIG.service.pollInterval);
    
    // Premier polling immédiat
    await pollPendingRecords();

  } catch (error) {
    console.error('❌ Erreur fatale lors du démarrage:', error);
    process.exit(1);
  }
}

// Gestion des signaux d'arrêt
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du service...');
  if (hederaClient) {
    hederaClient.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Arrêt du service...');
  if (hederaClient) {
    hederaClient.close();
  }
  process.exit(0);
});

// Démarrer le service
startService();
