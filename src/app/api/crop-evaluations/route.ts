import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { generateRequestId, createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmer_id');
    const status = searchParams.get('status');
    const cooperativeId = searchParams.get('cooperative_id');

    let farmerIds: string[] = [];
    if (cooperativeId) {
      const rows = await sql`
        SELECT user_id FROM farmer_profiles WHERE cooperative_id = ${cooperativeId}
      `;
      if (!rows.length) return createSuccessResponse([], 'No evaluations for this cooperative');
      farmerIds = rows.map((r: any) => r.user_id);
    }

    const rows = await sql`
      SELECT
        ce.*,
        fp.nom AS farmer_nom,
        fp.superficie AS farmer_superficie,
        fp.localisation AS farmer_localisation
      FROM crop_evaluations ce
      LEFT JOIN farmer_profiles fp ON fp.user_id = ce.farmer_id
      WHERE
        (${farmerId}::text IS NULL OR ce.farmer_id = ${farmerId})
        AND (${status}::text IS NULL OR ce.status = ${status})
        AND (
          ${cooperativeId}::text IS NULL
          OR ce.farmer_id = ANY(${farmerIds.length ? farmerIds : ['__none__']}::text[])
        )
      ORDER BY ce.created_at DESC
    `;

    return createSuccessResponse(rows, 'Evaluations retrieved successfully');
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
    const { farmer_id, crop_type, superficie, rendement_historique, prix_reference, valeur_estimee } = body;

    if (!farmer_id || !crop_type || !superficie || !rendement_historique || !prix_reference || !valeur_estimee) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO crop_evaluations (farmer_id, crop_type, superficie, rendement_historique, prix_reference, valeur_estimee)
      VALUES (${farmer_id}, ${crop_type}, ${superficie}, ${rendement_historique}, ${prix_reference}, ${valeur_estimee})
      RETURNING *
    `;

    return createSuccessResponse(rows[0], 'Evaluation created successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
