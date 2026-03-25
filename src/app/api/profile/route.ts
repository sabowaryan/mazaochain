import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT id, role, wallet_address, is_validated, created_at
      FROM profiles
      WHERE id = ${userId}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, wallet_address } = body;

    if (!role || !['agriculteur', 'cooperative', 'preteur', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO profiles (id, role, wallet_address, is_validated)
      VALUES (${userId}, ${role}, ${wallet_address || null}, false)
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        wallet_address = COALESCE(EXCLUDED.wallet_address, profiles.wallet_address)
      RETURNING id, role, wallet_address, is_validated, created_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { wallet_address, is_validated } = body;

    const rows = await sql`
      UPDATE profiles
      SET
        wallet_address = COALESCE(${wallet_address ?? null}, wallet_address),
        is_validated = COALESCE(${is_validated ?? null}, is_validated)
      WHERE id = ${userId}
      RETURNING id, role, wallet_address, is_validated, created_at
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
