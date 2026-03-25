import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: { include: { farmer_profile: true } },
        lender: { include: { lender_profile: true } },
      },
    });

    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = ['status', 'lender_id', 'collateral_amount', 'interest_rate', 'due_date'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = key === 'due_date' ? new Date(body[key]) : body[key];
      }
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const loan = await prisma.loan.update({ where: { id }, data });
    return NextResponse.json(loan);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
