import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await params;

    const allowed = ['status', 'lender_id', 'collateral_amount', 'interest_rate', 'due_date'];
    const updates = Object.entries(body)
      .filter(([k]) => allowed.includes(k))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, unknown>);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const setClauses = Object.keys(updates)
      .map((k, i) => `${k} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(updates)];

    const rows = await sql(
      `UPDATE loans SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT
        l.*,
        fp.nom AS borrower_nom,
        fp.localisation AS borrower_localisation,
        fp.crop_type AS borrower_crop_type,
        lp.institution_name AS lender_institution_name
      FROM loans l
      LEFT JOIN farmer_profiles fp ON fp.user_id = l.borrower_id
      LEFT JOIN lender_profiles lp ON lp.user_id = l.lender_id
      WHERE l.id = ${id}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
