import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configuration pour Vercel - permet jusqu'à 60 secondes d'exécution
export const maxDuration = 60;

/**
 * API Route pour approuver une évaluation de culture et la tokeniser sur Hedera
 * 
 * IMPLÉMENTATION TEMPORAIRE: Utilise l'API REST Hedera au lieu du SDK JavaScript
 * pour éviter les problèmes de compatibilité avec l'environnement serverless de Vercel.
 * 
 * Note: L'API REST Hedera Mirror Node est en lecture seule. Pour les transactions,
 * nous devons utiliser le JSON-RPC API ou attendre que le SDK soit compatible.
 * 
 * Pour l'instant, cette route approuve l'évaluation dans la DB et enregistre
 * les détails de tokenisation pour traitement ultérieur.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Récupérer les données de la requête
    const body = await request.json();
    const { evaluationId } = body;

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'ID d\'évaluation manquant' },
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
          farmer_profiles!farmer_profiles_user_id_fkey (
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

    // 4. Préparer les données de tokenisation
    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
    const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);
    const harvestDateTimestamp = Math.floor(harvestDate.getTime() / 1000);

    console.log('Préparation de la tokenisation:', {
      evaluationId,
      farmer: farmerProfile.wallet_address,
      estimatedValue: evaluation.valeur_estimee,
      cropType: evaluation.crop_type,
      harvestDate: harvestDateTimestamp,
      tokenSymbol
    });

    // 5. IMPLÉMENTATION TEMPORAIRE: Approuver l'évaluation sans tokenisation blockchain
    // TODO: Implémenter la vraie tokenisation via JSON-RPC API ou service externe
    
    // Mettre à jour le statut de l'évaluation
    const { error: updateError } = await supabase
      .from('crop_evaluations')
      .update({ 
        status: 'approved'
      })
      .eq('id', evaluationId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'évaluation:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'approbation de l\'évaluation' },
        { status: 500 }
      );
    }

    // 6. Créer un enregistrement de tokenisation en attente
    const { error: tokenizationError } = await supabase
      .from('tokenization_records')
      .insert({
        evaluation_id: evaluationId,
        status: 'pending',
        error_message: `En attente de tokenisation blockchain. Token: ${tokenSymbol}, Farmer: ${farmerProfile.wallet_address}, Value: ${evaluation.valeur_estimee} USDC`
      });

    if (tokenizationError) {
      console.error('Erreur lors de la création de l\'enregistrement de tokenisation:', tokenizationError);
      // Ne pas bloquer l'approbation si l'enregistrement de tokenisation échoue
    }

    // 7. Créer une notification pour l'agriculteur
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: evaluation.farmer_id,
        type: 'evaluation_approved',
        title: 'Évaluation approuvée',
        message: `Votre évaluation de ${evaluation.crop_type} a été approuvée. La tokenisation blockchain sera effectuée prochainement.`,
        metadata: {
          evaluation_id: evaluationId,
          token_symbol: tokenSymbol,
          estimated_value: evaluation.valeur_estimee
        }
      });

    if (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
      // Ne pas bloquer l'approbation si la notification échoue
    }

    // 8. Retourner la réponse de succès
    return NextResponse.json({
      success: true,
      message: 'Évaluation approuvée avec succès',
      data: {
        evaluationId,
        status: 'approved',
        tokenSymbol,
        estimatedValue: evaluation.valeur_estimee,
        note: 'La tokenisation blockchain sera effectuée via un service externe. Cet enregistrement a été créé dans tokenization_records.'
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'approbation de l\'évaluation:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error.message,
        note: 'Implémentation temporaire sans SDK Hedera'
      },
      { status: 500 }
    );
  }
}
