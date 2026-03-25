import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const role = searchParams.get('role');

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
  }

  try {
    const stats: Record<string, number> = {};

    if (role === 'agriculteur') {
      const [evaluations, activeLoans, totalLoans] = await Promise.all([
        prisma.cropEvaluation.count({ where: { farmer_id: userId } }),
        prisma.loan.count({ where: { borrower_id: userId, status: 'active' } }),
        prisma.loan.count({ where: { borrower_id: userId } }),
      ]);
      stats.evaluations = evaluations;
      stats.activeLoans = activeLoans;
      stats.totalLoans = totalLoans;
      stats.mazaoTokens = 0;
    }

    if (role === 'cooperative') {
      const [farmers, pendingEvaluations] = await Promise.all([
        prisma.farmerProfile.count({ where: { cooperative_id: userId } }),
        prisma.cropEvaluation.count({ where: { status: 'pending' } }),
      ]);
      stats.farmers = farmers;
      stats.pendingEvaluations = pendingEvaluations;
    }

    if (role === 'preteur') {
      const [loansGranted, activeLoans] = await Promise.all([
        prisma.loan.count({ where: { lender_id: userId } }),
        prisma.loan.count({ where: { lender_id: userId, status: 'active' } }),
      ]);
      stats.loansGranted = loansGranted;
      stats.activeLoans = activeLoans;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
