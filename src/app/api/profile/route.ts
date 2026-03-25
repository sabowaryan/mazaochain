import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { role, wallet_address } = body;

    const validRoles: UserRole[] = ['agriculteur', 'cooperative', 'preteur', 'admin'];
    if (!role || !validRoles.includes(role as UserRole)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    const profile = await prisma.profile.upsert({
      where: { id: userId },
      update: { role: role as UserRole, ...(wallet_address ? { wallet_address } : {}) },
      create: { id: userId, role: role as UserRole, wallet_address: wallet_address ?? null },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { wallet_address, is_validated } = body;

    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(wallet_address !== undefined ? { wallet_address } : {}),
        ...(is_validated !== undefined ? { is_validated } : {}),
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
