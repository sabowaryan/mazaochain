import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cooperativeId = searchParams.get('cooperative_id');

    const farmers = await prisma.profile.findMany({
      where: {
        role: 'agriculteur',
        ...(cooperativeId
          ? { farmer_profile: { cooperative_id: cooperativeId } }
          : {}),
      },
      include: { farmer_profile: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(farmers);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
