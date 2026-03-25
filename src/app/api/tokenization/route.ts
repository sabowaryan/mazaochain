import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { mazaoContractsService } from '@/lib/services/mazao-contracts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationId, cropType, farmerId, farmerAddress, estimatedValue, harvestDate } = body;

    if (!evaluationId || !cropType || !farmerId || !farmerAddress || !estimatedValue || !harvestDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { role: true } });
    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await mazaoContractsService.tokenizeApprovedEvaluation(
      evaluationId, cropType, farmerId, farmerAddress, estimatedValue, harvestDate
    );

    return NextResponse.json({ data: result, message: 'Tokenization initiated successfully' });
  } catch (error) {
    console.error('Error initiating tokenization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
