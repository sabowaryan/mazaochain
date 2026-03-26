import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export interface PortfolioToken {
  tokenId: string;
  cropType: string;
  amount: number;
  estimatedValue: number;
  harvestDate: string;
  status: 'active' | 'harvested' | 'expired';
  transactionId?: string;
  evaluationId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId') ?? userId;

    // Only allow fetching own portfolio unless admin
    const callerProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (farmerId !== userId && callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const records = await prisma.tokenizationRecord.findMany({
      where: {
        evaluation: { farmer_id: farmerId },
        status: 'completed',
        token_id: { not: null },
      },
      include: {
        evaluation: {
          select: {
            id: true,
            crop_type: true,
            valeur_estimee: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const daysUntilHarvest = (cropType: string) => (cropType === 'cafe' ? 90 : 120);

    const tokens: PortfolioToken[] = records.map((record) => {
      const evaluation = record.evaluation;
      const harvestDate = new Date(evaluation.created_at);
      harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest(evaluation.crop_type));

      const now = new Date();
      const status: PortfolioToken['status'] =
        harvestDate < now ? 'harvested' : 'active';

      const estimatedValue = evaluation.valeur_estimee ?? 0;

      return {
        tokenId: record.token_id!,
        cropType: evaluation.crop_type,
        amount: Math.round(estimatedValue * 100),
        estimatedValue,
        harvestDate: harvestDate.toISOString(),
        status,
        evaluationId: evaluation.id,
      };
    });

    const totalValue = tokens.reduce((sum, t) => sum + t.estimatedValue, 0);
    const totalAmount = tokens.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      data: tokens,
      totalValue,
      totalAmount,
      tokenCount: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[farmer/portfolio] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
