import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createCropToken, deriveTokenParams } from '@/lib/services/hedera-token-server';

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

    // Cooperative ownership check: cooperative can only tokenize evaluations for farmers in their cooperative
    if (callerProfile.role === 'cooperative') {
      const [callerCoop, farmerProfile] = await Promise.all([
        prisma.cooperativeProfile.findUnique({ where: { user_id: userId }, select: { id: true } }),
        prisma.farmerProfile.findFirst({ where: { user_id: evaluation.farmer_id }, select: { cooperative_id: true } }),
      ]);
      if (!callerCoop || farmerProfile?.cooperative_id !== callerCoop.id) {
        return NextResponse.json(
          { error: "Cette évaluation appartient à un fermier d'une autre coopérative" },
          { status: 403 }
        );
      }
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

    // Derive token params from evaluation (shared helper, avoids duplication with /api/evaluations/approve)
    const { cropType, quantity, tokenSymbol } = deriveTokenParams(evaluation);

    const tokenResult = await createCropToken({
      cropType,
      farmerWalletAddress: evaluation.farmer.wallet_address,
      quantity,
      tokenSymbol,
    });

    if (!tokenResult.success) {
      // Persist a pending/failed record for retry observability and audit trail
      const existingForFailure = await prisma.tokenizationRecord.findFirst({
        where: { evaluation_id: evaluationId },
        orderBy: { created_at: 'desc' },
      });
      if (existingForFailure) {
        await prisma.tokenizationRecord.update({
          where: { id: existingForFailure.id },
          data: { status: 'pending', error_message: tokenResult.error ?? 'Token creation failed' },
        });
      } else {
        await prisma.tokenizationRecord.create({
          data: {
            evaluation_id: evaluationId,
            status: 'pending',
            error_message: tokenResult.error ?? 'Token creation failed',
          },
        });
      }
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
