import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const borrowerId = searchParams.get('borrower_id');
    const lenderId = searchParams.get('lender_id');
    const status = searchParams.get('status');
    const cooperativeId = searchParams.get('cooperative_id');
    const excludeLender = searchParams.get('exclude_lender');

    let farmerIds: string[] | undefined;
    if (cooperativeId) {
      const farmers = await prisma.farmerProfile.findMany({
        where: { cooperative_id: cooperativeId },
        select: { user_id: true },
      });
      if (!farmers.length) return NextResponse.json({ data: [], message: 'No loans for this cooperative' });
      farmerIds = farmers.map(f => f.user_id);
    }

    const loans = await prisma.loan.findMany({
      where: {
        ...(borrowerId ? { borrower_id: borrowerId } : {}),
        ...(lenderId ? { lender_id: lenderId } : {}),
        ...(status ? { status } : {}),
        ...(excludeLender ? { NOT: { lender_id: excludeLender } } : {}),
        ...(farmerIds ? { borrower_id: { in: farmerIds } } : {}),
      },
      include: {
        borrower: { include: { farmer_profile: true } },
        lender: { include: { lender_profile: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: loans, message: 'Loans retrieved successfully' });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    if (!body.borrower_id || !body.principal) {
      return NextResponse.json({ error: 'Missing required fields: borrower_id and principal' }, { status: 400 });
    }

    const loan = await prisma.loan.create({
      data: {
        borrower_id: body.borrower_id,
        lender_id: body.lender_id ?? null,
        principal: body.principal,
        collateral_amount: body.collateral_amount,
        interest_rate: body.interest_rate,
        due_date: new Date(body.due_date),
        status: body.status ?? 'pending',
      },
    });

    return NextResponse.json({ data: loan, message: 'Loan created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
