import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const allowed = ['status', 'crop_type', 'superficie', 'rendement_historique', 'prix_reference', 'valeur_estimee'];
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

    const rows = await sql(`UPDATE crop_evaluations SET ${setClauses} WHERE id = $1 RETURNING *`, values);

    if (!rows.length) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating evaluation:', error);
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
        ce.*,
        fp.nom AS farmer_nom,
        fp.localisation AS farmer_localisation,
        fp.crop_type AS farmer_crop_type
      FROM crop_evaluations ce
      LEFT JOIN farmer_profiles fp ON fp.user_id = ce.farmer_id
      WHERE ce.id = ${id}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
