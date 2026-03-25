import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cooperativeId = searchParams.get('cooperative_id');

    if (!cooperativeId) {
      return NextResponse.json({ error: 'cooperative_id parameter is required' }, { status: 400 });
    }

    const members = await prisma.farmerProfile.findMany({
      where: { cooperative_id: cooperativeId },
      include: { profile: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: members, message: 'Cooperative members retrieved successfully' });
  } catch (error) {
    console.error('Error fetching cooperative members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
