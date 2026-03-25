import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { generateRequestId } from '@/lib/errors/api-errors';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const borrowerId = searchParams.get('borrower_id');
    const lenderId = searchParams.get('lender_id');
    const status = searchParams.get('status');
    const cooperativeId = searchParams.get('cooperative_id');
    const excludeLender = searchParams.get('exclude_lender');

    let farmerIds: string[] = [];
    if (cooperativeId) {
      const rows = await sql`
        SELECT user_id FROM farmer_profiles WHERE cooperative_id = ${cooperativeId}
      `;
      if (!rows.length) return createSuccessResponse([], 'No loans for this cooperative');
      farmerIds = rows.map((r: any) => r.user_id);
    }

    const rows = await sql`
      SELECT
        l.*,
        fp.nom AS borrower_nom,
        fp.localisation AS borrower_localisation,
        lp.institution_name AS lender_institution_name
      FROM loans l
      LEFT JOIN farmer_profiles fp ON fp.user_id = l.borrower_id
      LEFT JOIN lender_profiles lp ON lp.user_id = l.lender_id
      WHERE
        (${borrowerId}::text IS NULL OR l.borrower_id = ${borrowerId})
        AND (${lenderId}::text IS NULL OR l.lender_id = ${lenderId})
        AND (${status}::text IS NULL OR l.status = ${status})
        AND (${excludeLender}::text IS NULL OR l.lender_id != ${excludeLender})
        AND (
          ${cooperativeId}::text IS NULL
          OR l.borrower_id = ANY(${farmerIds.length ? farmerIds : ['__none__']}::text[])
        )
      ORDER BY l.created_at DESC
    `;

    return createSuccessResponse(rows, 'Loans retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.borrower_id || !body.principal) {
      return NextResponse.json(
        { error: 'Missing required fields: borrower_id and principal are required' },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO loans (borrower_id, lender_id, principal, collateral_amount, interest_rate, due_date, status)
      VALUES (
        ${body.borrower_id},
        ${body.lender_id || null},
        ${body.principal},
        ${body.collateral_amount},
        ${body.interest_rate},
        ${body.due_date},
        ${body.status || 'pending'}
      )
      RETURNING *
    `;

    return createSuccessResponse(rows[0], 'Loan created successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
