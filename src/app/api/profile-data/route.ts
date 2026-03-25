import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

type ProfileTable = 'farmer_profiles' | 'cooperative_profiles' | 'lender_profiles';

async function getProfile(table: ProfileTable, userId: string) {
  switch (table) {
    case 'farmer_profiles':
      return prisma.farmerProfile.findUnique({ where: { user_id: userId } });
    case 'cooperative_profiles':
      return prisma.cooperativeProfile.findUnique({ where: { user_id: userId } });
    case 'lender_profiles':
      return prisma.lenderProfile.findUnique({ where: { user_id: userId } });
  }
}

async function createProfile(table: ProfileTable, userId: string, data: Record<string, unknown>) {
  switch (table) {
    case 'farmer_profiles':
      return prisma.farmerProfile.create({ data: { user_id: userId, ...(data as any) } });
    case 'cooperative_profiles':
      return prisma.cooperativeProfile.create({ data: { user_id: userId, ...(data as any) } });
    case 'lender_profiles':
      return prisma.lenderProfile.create({ data: { user_id: userId, ...(data as any) } });
  }
}

async function updateProfile(table: ProfileTable, userId: string, data: Record<string, unknown>) {
  switch (table) {
    case 'farmer_profiles':
      return prisma.farmerProfile.update({ where: { user_id: userId }, data: data as any });
    case 'cooperative_profiles':
      return prisma.cooperativeProfile.update({ where: { user_id: userId }, data: data as any });
    case 'lender_profiles':
      return prisma.lenderProfile.update({ where: { user_id: userId }, data: data as any });
  }
}

const ALLOWED_TABLES: ProfileTable[] = ['farmer_profiles', 'cooperative_profiles', 'lender_profiles'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as ProfileTable | null;
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const profile = await getProfile(table, userId);
    if (!profile) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId: authUserId } = await auth();
  if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as ProfileTable | null;
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES.includes(table) || !userId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const profile = await createProfile(table, userId, body);
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { userId: authUserId } = await auth();
  if (!authUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as ProfileTable | null;
  const userId = searchParams.get('userId');

  if (!table || !ALLOWED_TABLES.includes(table) || !userId) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const profile = await updateProfile(table, userId, body);
    return NextResponse.json(profile);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('Error updating profile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
