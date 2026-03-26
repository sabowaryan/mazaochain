import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createCropToken } from '@/lib/services/hedera-token-server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationId } = body;

    if (!evaluationId) {
      return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const callerProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!callerProfile || !['cooperative', 'admin'].includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Load canonical evaluation data from DB — never trust request body for security-critical fields
    const evaluation = await prisma.cropEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        farmer: { select: { wallet_address: true } },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 });
    }

    // Idempotency guard: check BEFORE status gate so that already-tokenized evaluations
    // return the existing record rather than a 400. Covers retries and duplicate calls.
    const existingCompleted = await prisma.tokenizationRecord.findFirst({
      where: { evaluation_id: evaluationId, status: 'completed', token_id: { not: null } },
      orderBy: { created_at: 'desc' },
    });
    if (existingCompleted?.token_id) {
      return NextResponse.json({
        data: {
          tokenId: existingCompleted.token_id,
          transactionId: null,
          transferredToFarmer: false,
          recordId: existingCompleted.id,
        },
        message: 'Token déjà créé (réponse idempotente)',
      });
    }

    if (evaluation.status !== 'approved') {
      return NextResponse.json(
        { error: "Seules les évaluations approuvées peuvent être tokenisées. Statut actuel : " + evaluation.status },
        { status: 400 }
      );
    }
    if (!evaluation.farmer.wallet_address) {
      return NextResponse.json(
        { error: "Le fermier n'a pas d'adresse wallet configurée" },
        { status: 400 }
      );
    }

    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase().substring(0, 6)}-${Date.now().toString().slice(-4)}`;

    // Evaluated quantity = superficie × rendement_historique (total crop volume)
    const quantity = Number(evaluation.superficie ?? 0) * Number(evaluation.rendement_historique ?? 0);

    const tokenResult = await createCropToken({
      cropType: evaluation.crop_type,
      farmerWalletAddress: evaluation.farmer.wallet_address,
      quantity,
      tokenSymbol,
    });

    if (!tokenResult.success) {
      return NextResponse.json(
        { error: tokenResult.error ?? 'Token creation failed' },
        { status: 500 }
      );
    }

    // Persist the tokenization record and update evaluation status atomically
    const existing = await prisma.tokenizationRecord.findFirst({
      where: { evaluation_id: evaluationId },
      orderBy: { created_at: 'desc' },
    });

    const [, record] = await prisma.$transaction([
      prisma.cropEvaluation.update({
        where: { id: evaluationId },
        data: { status: 'tokenized' },
      }),
      existing
        ? prisma.tokenizationRecord.update({
            where: { id: existing.id },
            data: {
              token_id: tokenResult.tokenId,
              status: 'completed',
              error_message: null,
            },
          })
        : prisma.tokenizationRecord.create({
            data: {
              evaluation_id: evaluationId,
              token_id: tokenResult.tokenId,
              status: 'completed',
            },
          }),
    ]);

    return NextResponse.json({
      data: {
        tokenId: tokenResult.tokenId,
        transactionId: tokenResult.transactionId,
        transferredToFarmer: tokenResult.transferredToFarmer,
        recordId: record.id,
      },
      message: 'Tokenisation réussie',
    });
  } catch (error) {
    console.error('Error initiating tokenization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
