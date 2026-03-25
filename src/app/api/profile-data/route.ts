import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

const ALLOWED_TABLES: Record<string, string> = {
  farmer_profiles: 'farmer_profiles',
  cooperative_profiles: 'cooperative_profiles',
  lender_profiles: 'lender_profiles',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES[table]) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const rows = await sql(`SELECT * FROM ${ALLOWED_TABLES[table]} WHERE user_id = $1`, [userId]);
    if (!rows.length) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId: authUserId } = await auth();
  if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES[table] || !userId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const fields = Object.keys(body);
    const values = Object.values(body);
    const placeholders = fields.map((_, i) => `$${i + 2}`).join(', ');
    const columns = ['user_id', ...fields].join(', ');
    const allValues = [userId, ...values];
    const allPlaceholders = `$1, ${placeholders}`;

    const rows = await sql(
      `INSERT INTO ${ALLOWED_TABLES[table]} (${columns}) VALUES (${allPlaceholders}) RETURNING *`,
      allValues
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { userId: authUserId } = await auth();
  if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES[table] || !userId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const fields = Object.keys(body);
    const values = Object.values(body);
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

    const rows = await sql(
      `UPDATE ${ALLOWED_TABLES[table]} SET ${setClauses} WHERE user_id = $1 RETURNING *`,
      [userId, ...values]
    );

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
