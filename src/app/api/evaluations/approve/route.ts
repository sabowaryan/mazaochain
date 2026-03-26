import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createCropToken } from '@/lib/services/hedera-token-server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { evaluationId } = body;
    if (!evaluationId) return NextResponse.json({ error: 'Missing evaluationId' }, { status: 400 });

    const evaluation = await prisma.cropEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        farmer: {
          select: { wallet_address: true },
          include: { farmer_profile: true },
        },
      },
    });

    if (!evaluation) return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 });
    if (evaluation.status !== 'pending') {
      return NextResponse.json({ error: 'Cette évaluation a déjà été traitée' }, { status: 400 });
    }
    if (!evaluation.farmer.wallet_address) {
      return NextResponse.json({ error: "Le fermier n'a pas d'adresse wallet configurée" }, { status: 400 });
    }

    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase().substring(0, 6)}-${Date.now().toString().slice(-4)}`;
    const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);

    // Mark evaluation as approved and create a pending tokenization record
    const [, tokenRecord] = await prisma.$transaction([
      prisma.cropEvaluation.update({ where: { id: evaluationId }, data: { status: 'approved' } }),
      prisma.tokenizationRecord.create({
        data: {
          evaluation_id: evaluationId,
          status: 'pending',
          error_message: `Tokenisation en cours...`,
        },
      }),
    ]);

    // Attempt real on-chain token creation
    const tokenResult = await createCropToken({
      cropType: evaluation.crop_type,
      farmerWalletAddress: evaluation.farmer.wallet_address,
      estimatedValue: evaluation.valeur_estimee ?? 0,
      tokenSymbol,
    });

    if (tokenResult.success && tokenResult.tokenId) {
      // Update DB with real token ID and mark as completed + evaluation tokenized
      await prisma.$transaction([
        prisma.tokenizationRecord.update({
          where: { id: tokenRecord.id },
          data: {
            token_id: tokenResult.tokenId,
            status: 'completed',
            error_message: null,
          },
        }),
        prisma.cropEvaluation.update({
          where: { id: evaluationId },
          data: { status: 'tokenized' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Évaluation approuvée et token créé avec succès',
        evaluationId,
        tokenId: tokenResult.tokenId,
        transactionId: tokenResult.transactionId,
        tokenSymbol,
        farmerAddress: evaluation.farmer.wallet_address,
        estimatedValue: evaluation.valeur_estimee,
        harvestDate: harvestDate.toISOString(),
      });
    }

    // Token creation failed — keep evaluation as 'approved' and record as 'pending' with error
    await prisma.tokenizationRecord.update({
      where: { id: tokenRecord.id },
      data: {
        status: 'pending',
        error_message: tokenResult.error ?? 'Échec de la création du token blockchain',
      },
    });

    return NextResponse.json({
      success: true,
      message: "Évaluation approuvée. La tokenisation blockchain sera retentée ultérieurement.",
      evaluationId,
      tokenSymbol,
      farmerAddress: evaluation.farmer.wallet_address,
      estimatedValue: evaluation.valeur_estimee,
      harvestDate: harvestDate.toISOString(),
      tokenizationPending: true,
      tokenizationError: tokenResult.error,
    });
  } catch (error) {
    console.error('Error approving evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
