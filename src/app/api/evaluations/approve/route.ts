import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  Client, 
  PrivateKey, 
  ContractExecuteTransaction, 
  ContractId,
  ContractFunctionParameters,
  ContractCallQuery
} from "@hashgraph/sdk";

// Configuration pour Vercel - permet jusqu'à 60 secondes d'exécution
export const maxDuration = 60;

/**
 * API Route pour approuver une évaluation de culture et la tokeniser sur Hedera
 * 
 * Cette route gère:
 * 1. Validation de l'évaluation
 * 2. Création du token sur la blockchain Hedera
 * 3. Mise à jour du statut dans la base de données
 * 4. Notification de l'agriculteur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Récupérer les données de la requête
    const body = await request.json();
    const { evaluationId } = body;

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'evaluationId est requis' },
        { status: 400 }
      );
    }

    // 2. Récupérer l'évaluation avec les informations du fermier
    const { data: evaluation, error: fetchError } = await supabase
      .from('crop_evaluations')
      .select(`
        *,
        profiles!farmer_id (
          id,
          wallet_address,
          farmer_profiles (
            nom,
            localisation
          )
        )
      `)
      .eq('id', evaluationId)
      .single();

    if (fetchError || !evaluation) {
      console.error('Erreur lors de la récupération de l\'évaluation:', fetchError);
      return NextResponse.json(
        { error: 'Évaluation non trouvée' },
        { status: 404 }
      );
    }

    // 3. Vérifications de sécurité
    if (evaluation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette évaluation a déjà été traitée' },
        { status: 400 }
      );
    }

    const farmerProfile = evaluation.profiles;
    if (!farmerProfile?.wallet_address) {
      return NextResponse.json(
        { error: 'Le fermier n\'a pas d\'adresse wallet configurée' },
        { status: 400 }
      );
    }

    // 4. Initialiser le client Hedera (côté serveur uniquement)
    let client: Client;
    let tokenId: string | null = null;
    let transactionId: string | null = null;

    try {
      // Vérifier les variables d'environnement requises
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;
      const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
      const tokenFactoryId = process.env.NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID;

      if (!accountId || !privateKey) {
        throw new Error('Variables d\'environnement Hedera manquantes (HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY)');
      }

      if (!tokenFactoryId) {
        throw new Error('NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID non configuré');
      }

      // Initialiser le client Hedera
      client = network === 'mainnet' 
        ? Client.forMainnet() 
        : Client.forTestnet();

      client.setOperator(
        accountId,
        PrivateKey.fromString(privateKey)
      );

      console.log('Client Hedera initialisé:', {
        network,
        accountId,
        tokenFactoryId
      });

      // 5. Créer le token sur la blockchain
      const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
      
      // Calculer la date de récolte (90 jours à partir de maintenant pour le café, 120 jours pour le manioc)
      const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);
      const harvestDateTimestamp = Math.floor(harvestDate.getTime() / 1000);

      console.log('Préparation de la transaction createCropToken:', {
        farmer: farmerProfile.wallet_address,
        estimatedValue: evaluation.valeur_estimee,
        cropType: evaluation.crop_type,
        harvestDate: harvestDateTimestamp,
        tokenSymbol
      });

      // Préparer les paramètres de la fonction selon l'ABI du contrat
      // createCropToken(address farmer, uint256 estimatedValue, string cropType, uint256 harvestDate, string tokenSymbol)
      const functionParams = new ContractFunctionParameters()
        .addAddress(farmerProfile.wallet_address)  // farmer address
        .addUint256(evaluation.valeur_estimee)     // estimatedValue
        .addString(evaluation.crop_type)           // cropType
        .addUint256(harvestDateTimestamp)          // harvestDate (Unix timestamp)
        .addString(tokenSymbol);                   // tokenSymbol

      // Créer la transaction
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(tokenFactoryId))
        .setGas(1000000)  // 1M gas - ajuster si nécessaire
        .setFunction("createCropToken", functionParams);

      // Exécuter la transaction
      console.log('Exécution de la transaction createCropToken...');
      const txResponse = await transaction.execute(client);
      transactionId = txResponse.transactionId.toString();

      // Attendre la confirmation
      console.log('Attente de la confirmation de la transaction:', transactionId);
      const receipt = await txResponse.getReceipt(client);

      // Vérifier le statut
      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Transaction échouée avec le statut: ${receipt.status.toString()}`);
      }

      console.log('Transaction confirmée avec succès:', {
        transactionId,
        status: receipt.status.toString()
      });

      // Récupérer le tokenId créé
      // Méthode 1: Query le nextTokenId - 1 (le token qui vient d'être créé)
      try {
        const query = new ContractCallQuery()
          .setContractId(ContractId.fromString(tokenFactoryId))
          .setGas(100000)
          .setFunction("nextTokenId");

        const queryResult = await query.execute(client);
        const nextTokenId = queryResult.getUint256(0);
        
        // Le token créé est nextTokenId - 1
        const createdTokenId = nextTokenId.toNumber() - 1;
        tokenId = createdTokenId.toString();

        console.log('TokenId récupéré:', {
          nextTokenId: nextTokenId.toString(),
          createdTokenId: tokenId
        });
      } catch (queryError) {
        console.error('Erreur lors de la récupération du tokenId:', queryError);
        // Fallback: utiliser un ID temporaire basé sur le timestamp
        tokenId = `temp-${Date.now()}`;
        console.warn('Utilisation d\'un tokenId temporaire:', tokenId);
      }

      console.log('Token créé avec succès:', {
        tokenId,
        transactionId,
        evaluationId,
        cropType: evaluation.crop_type,
        estimatedValue: evaluation.valeur_estimee,
        tokenSymbol
      });

    } catch (blockchainError) {
      console.error('Erreur lors de la création du token sur Hedera:', blockchainError);
      
      // Déterminer le type d'erreur pour un message plus précis
      let errorMessage = 'Erreur blockchain inconnue';
      let errorDetails = '';
      
      if (blockchainError instanceof Error) {
        errorDetails = blockchainError.message;
        
        // Messages d'erreur spécifiques selon le type d'erreur Hedera
        if (errorDetails.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
          errorMessage = 'Solde insuffisant sur le compte Hedera pour exécuter la transaction';
        } else if (errorDetails.includes('INVALID_CONTRACT_ID')) {
          errorMessage = 'ID de contrat invalide - vérifiez la configuration';
        } else if (errorDetails.includes('CONTRACT_REVERT_EXECUTED')) {
          errorMessage = 'Le contrat a rejeté la transaction - vérifiez les paramètres';
        } else if (errorDetails.includes('INVALID_SIGNATURE')) {
          errorMessage = 'Signature invalide - vérifiez les clés privées';
        } else if (errorDetails.includes('INSUFFICIENT_GAS')) {
          errorMessage = 'Gas insuffisant - augmentez la limite de gas';
        } else if (errorDetails.includes('TIMEOUT')) {
          errorMessage = 'Timeout de la transaction - réessayez';
        } else {
          errorMessage = errorDetails;
        }
      }
      
      // Enregistrer l'erreur dans la base de données pour audit
      await supabase
        .from('crop_evaluations')
        .update({
          status: 'failed',
          metadata: {
            error: errorMessage,
            errorDetails: errorDetails,
            timestamp: new Date().toISOString(),
            errorStack: blockchainError instanceof Error ? blockchainError.stack : undefined
          }
        })
        .eq('id', evaluationId);

      return NextResponse.json(
        { 
          error: 'Erreur lors de la tokenisation sur la blockchain',
          message: errorMessage,
          details: errorDetails
        },
        { status: 500 }
      );
    }

    // 6. Mettre à jour le statut de l'évaluation dans la base de données
    const { error: updateError } = await supabase
      .from('crop_evaluations')
      .update({
        status: 'approved',
        metadata: {
          tokenId,
          transactionId,
          approvedAt: new Date().toISOString(),
          tokenSymbol: `MAZAO-${evaluation.crop_type.toUpperCase()}`
        }
      })
      .eq('id', evaluationId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut:', updateError);
      // La transaction blockchain a réussi mais la mise à jour DB a échoué
      // C'est un cas critique qui nécessite une intervention manuelle
      return NextResponse.json(
        { 
          error: 'Token créé mais erreur lors de la mise à jour de la base de données',
          tokenId,
          transactionId
        },
        { status: 500 }
      );
    }

    // 7. Créer une notification pour l'agriculteur
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: evaluation.farmer_id,
          type: 'evaluation_approved',
          title: 'Évaluation Approuvée',
          message: `Votre évaluation de ${evaluation.crop_type} a été approuvée. ${evaluation.valeur_estimee} tokens MAZAO ont été créés et ajoutés à votre portefeuille.`,
          data: {
            evaluationId,
            tokenId,
            tokenAmount: evaluation.valeur_estimee,
            cropType: evaluation.crop_type,
            actionUrl: '/dashboard/farmer/portfolio'
          },
          read: false
        });
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer le processus si la notification échoue
    }

    // 8. Retourner le succès
    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        tokenId,
        transactionId,
        tokenAmount: evaluation.valeur_estimee,
        cropType: evaluation.crop_type,
        message: 'Évaluation approuvée et tokenisée avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur serveur lors de l\'approbation:', error);
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
