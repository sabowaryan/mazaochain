import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

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

    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
    const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);

    await prisma.$transaction([
      prisma.cropEvaluation.update({ where: { id: evaluationId }, data: { status: 'approved' } }),
      prisma.tokenizationRecord.create({
        data: {
          evaluation_id: evaluationId,
          status: 'pending',
          error_message: `Awaiting blockchain tokenization. Token: ${tokenSymbol}, Farmer: ${evaluation.farmer.wallet_address}, Value: ${evaluation.valeur_estimee} USDC`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Évaluation approuvée avec succès',
      evaluationId,
      tokenSymbol,
      farmerAddress: evaluation.farmer.wallet_address,
      estimatedValue: evaluation.valeur_estimee,
      harvestDate: harvestDate.toISOString(),
    });
  } catch (error) {
    console.error('Error approving evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
