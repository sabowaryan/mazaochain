import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
      const [evals, activeLoans, totalLoans] = await Promise.all([
        sql`SELECT COUNT(*) AS count FROM crop_evaluations WHERE farmer_id = ${userId}`,
        sql`SELECT COUNT(*) AS count FROM loans WHERE borrower_id = ${userId} AND status = 'active'`,
        sql`SELECT COUNT(*) AS count FROM loans WHERE borrower_id = ${userId}`,
      ]);
      stats.evaluations = Number((evals[0] as any).count);
      stats.activeLoans = Number((activeLoans[0] as any).count);
      stats.totalLoans = Number((totalLoans[0] as any).count);
      stats.mazaoTokens = 0;
    }

    if (role === 'cooperative') {
      const [farmers, pendingEvals] = await Promise.all([
        sql`SELECT COUNT(*) AS count FROM farmer_profiles WHERE cooperative_id = ${userId}`,
        sql`SELECT COUNT(*) AS count FROM crop_evaluations WHERE status = 'pending'`,
      ]);
      stats.farmers = Number((farmers[0] as any).count);
      stats.pendingEvaluations = Number((pendingEvals[0] as any).count);
    }

    if (role === 'preteur') {
      const [loansGranted, activeLoans] = await Promise.all([
        sql`SELECT COUNT(*) AS count FROM loans WHERE lender_id = ${userId}`,
        sql`SELECT COUNT(*) AS count FROM loans WHERE lender_id = ${userId} AND status = 'active'`,
      ]);
      stats.loansGranted = Number((loansGranted[0] as any).count);
      stats.activeLoans = Number((activeLoans[0] as any).count);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
