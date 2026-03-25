import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { generateRequestId, createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';
import { mazaoContractsService } from '@/lib/services/mazao-contracts';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();
    const { evaluationId, cropType, farmerId, farmerAddress, estimatedValue, harvestDate } = body;

    if (!evaluationId || !cropType || !farmerId || !farmerAddress || !estimatedValue || !harvestDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileRows = await sql`SELECT role FROM profiles WHERE id = ${userId}`;
    const profile = profileRows[0] as { role: string } | undefined;

    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await mazaoContractsService.tokenizeApprovedEvaluation(
      evaluationId,
      cropType,
      farmerId,
      farmerAddress,
      estimatedValue,
      harvestDate
    );

    return createSuccessResponse(result, 'Tokenization initiated successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
