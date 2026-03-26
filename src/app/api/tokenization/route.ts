import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { createCropToken } from '@/lib/services/hedera-token-server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationId, cropType, farmerId, farmerAddress, estimatedValue } = body;

    if (!evaluationId || !cropType || !farmerId || !farmerAddress || !estimatedValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tokenSymbol = `MAZAO-${cropType.toUpperCase().substring(0, 6)}-${Date.now().toString().slice(-4)}`;

    const tokenResult = await createCropToken({
      cropType,
      farmerWalletAddress: farmerAddress,
      estimatedValue,
      tokenSymbol,
    });

    if (!tokenResult.success) {
      return NextResponse.json(
        { error: tokenResult.error ?? 'Token creation failed' },
        { status: 500 }
      );
    }

    // Persist the tokenization record (update existing pending record or create new one)
    const existing = await prisma.tokenizationRecord.findFirst({
      where: { evaluation_id: evaluationId },
      orderBy: { created_at: 'desc' },
    });

    const record = existing
      ? await prisma.tokenizationRecord.update({
          where: { id: existing.id },
          data: {
            token_id: tokenResult.tokenId,
            status: 'completed',
            error_message: null,
          },
        })
      : await prisma.tokenizationRecord.create({
          data: {
            evaluation_id: evaluationId,
            token_id: tokenResult.tokenId,
            status: 'completed',
          },
        });

    return NextResponse.json({
      data: {
        tokenId: tokenResult.tokenId,
        transactionId: tokenResult.transactionId,
        recordId: record.id,
      },
      message: 'Tokenisation initiée avec succès',
    });
  } catch (error) {
    console.error('Error initiating tokenization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
