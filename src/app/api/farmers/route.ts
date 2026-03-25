import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cooperativeId = searchParams.get('cooperative_id');

    let rows;
    if (cooperativeId) {
      rows = await sql`
        SELECT
          p.id, p.role, p.wallet_address, p.is_validated, p.created_at,
          fp.nom, fp.superficie, fp.localisation, fp.crop_type,
          fp.rendement_historique, fp.experience_annees
        FROM profiles p
        LEFT JOIN farmer_profiles fp ON fp.user_id = p.id
        WHERE p.role = 'agriculteur' AND fp.cooperative_id = ${cooperativeId}
        ORDER BY p.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT
          p.id, p.role, p.wallet_address, p.is_validated, p.created_at,
          fp.nom, fp.superficie, fp.localisation, fp.crop_type,
          fp.rendement_historique, fp.experience_annees
        FROM profiles p
        LEFT JOIN farmer_profiles fp ON fp.user_id = p.id
        WHERE p.role = 'agriculteur'
        ORDER BY p.created_at DESC
      `;
    }

    return NextResponse.json(rows || []);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
