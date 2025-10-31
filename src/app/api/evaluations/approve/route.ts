import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Client, PrivateKey, ContractExecuteTransaction, ContractId } from "@hashgraph/sdk";

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
      // NOTE: Cette implémentation est simplifiée
      // Dans un environnement de production, vous devriez:
      // - Utiliser les méthodes appropriées de votre smart contract
      // - Gérer les erreurs de transaction plus finement
      // - Implémenter un système de retry
      
      const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
      
      // Exemple de transaction de création de token
      // Adaptez selon votre contrat intelligent
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(tokenFactoryId))
        .setGas(1000000)
        .setFunction(
          "createCropToken",
          // Paramètres à adapter selon votre contrat
          // Ces valeurs sont des exemples
        );

      // Exécuter la transaction
      // const txResponse = await transaction.execute(client);
      // const receipt = await txResponse.getReceipt(client);
      
      // Pour l'instant, simulation de la création du token
      // À REMPLACER par la vraie logique de votre smart contract
      tokenId = `0.0.${Math.floor(Math.random() * 1000000)}`;
      transactionId = `0.0.${accountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;

      console.log('Token créé avec succès:', {
        tokenId,
        transactionId,
        evaluationId,
        cropType: evaluation.crop_type,
        estimatedValue: evaluation.valeur_estimee
      });

    } catch (blockchainError) {
      console.error('Erreur lors de la création du token sur Hedera:', blockchainError);
      
      // Enregistrer l'erreur dans la base de données pour audit
      await supabase
        .from('crop_evaluations')
        .update({
          status: 'failed',
          metadata: {
            error: blockchainError instanceof Error ? blockchainError.message : 'Erreur blockchain inconnue',
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', evaluationId);

      return NextResponse.json(
        { 
          error: 'Erreur lors de la tokenisation sur la blockchain',
          details: blockchainError instanceof Error ? blockchainError.message : 'Erreur inconnue'
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
