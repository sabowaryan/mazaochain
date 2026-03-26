import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const loans = await prisma.loan.findMany({
      where: {
        status: 'pending',
        lender_id: null,
      },
      include: {
        borrower: {
          select: {
            id: true,
            farmer_profile: {
              select: {
                nom: true,
                crop_type: true,
                superficie: true,
                localisation: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const opportunities = loans.map(loan => ({
      id: loan.id,
      borrower_id: loan.borrower_id,
      principal: Number(loan.principal),
      collateral_amount: Number(loan.collateral_amount),
      interest_rate: Number(loan.interest_rate),
      status: loan.status,
      due_date: loan.due_date,
      created_at: loan.created_at,
      farmer: loan.borrower.farmer_profile
        ? {
            nom: loan.borrower.farmer_profile.nom,
            crop_type: loan.borrower.farmer_profile.crop_type,
            superficie: Number(loan.borrower.farmer_profile.superficie),
            localisation: loan.borrower.farmer_profile.localisation,
          }
        : null,
    }));

    return NextResponse.json({ data: opportunities, message: 'Loan opportunities retrieved successfully' });
  } catch (error) {
    console.error('Error fetching loan opportunities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
