import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateRequestId, createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const cooperativeId = searchParams.get('cooperative_id');

    if (!cooperativeId) {
      return NextResponse.json({ error: 'cooperative_id parameter is required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT
        fp.*,
        p.id AS profile_id,
        p.role,
        p.is_validated,
        p.wallet_address
      FROM farmer_profiles fp
      JOIN profiles p ON p.id = fp.user_id
      WHERE fp.cooperative_id = ${cooperativeId}
      ORDER BY fp.created_at DESC
    `;

    return createSuccessResponse(rows, 'Cooperative members retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
