import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    const enriched = await Promise.all(
      members.map(async m => {
        const evalCount = await prisma.cropEvaluation.count({ where: { farmer_id: m.user_id } });
        return {
          user_id: m.user_id,
          nom: m.nom,
          superficie: Number(m.superficie),
          localisation: m.localisation,
          crop_type: m.crop_type,
          experience_annees: m.experience_annees,
          created_at: m.created_at,
          evaluation_count: evalCount,
        };
      })
    );

    return NextResponse.json({ data: enriched, message: 'Cooperative members retrieved successfully' });
  } catch (error) {
    console.error('Error fetching cooperative members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const coopProfile = await prisma.cooperativeProfile.findUnique({ where: { user_id: userId } });
    if (!coopProfile) {
      return NextResponse.json({ error: 'Only cooperatives can manage members' }, { status: 403 });
    }

    const body = await request.json();
    const { farmer_id } = body;

    if (!farmer_id || typeof farmer_id !== 'string' || !farmer_id.trim()) {
      return NextResponse.json({ error: 'farmer_id is required' }, { status: 400 });
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { user_id: farmer_id.trim() } });
    if (!farmerProfile) {
      return NextResponse.json({ error: 'Farmer not found with this user ID' }, { status: 404 });
    }

    if (farmerProfile.cooperative_id && farmerProfile.cooperative_id !== userId) {
      return NextResponse.json({ error: 'This farmer is already a member of another cooperative' }, { status: 409 });
    }

    const updated = await prisma.farmerProfile.update({
      where: { user_id: farmer_id.trim() },
      data: { cooperative_id: userId },
    });

    return NextResponse.json({ data: updated, message: 'Farmer added to cooperative successfully' });
  } catch (error) {
    console.error('Error adding cooperative member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const coopProfile = await prisma.cooperativeProfile.findUnique({ where: { user_id: userId } });
    if (!coopProfile) {
      return NextResponse.json({ error: 'Only cooperatives can manage members' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmer_id');
    if (!farmerId) return NextResponse.json({ error: 'farmer_id is required' }, { status: 400 });

    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { user_id: farmerId } });
    if (!farmerProfile || farmerProfile.cooperative_id !== userId) {
      return NextResponse.json({ error: 'Farmer is not a member of your cooperative' }, { status: 404 });
    }

    await prisma.farmerProfile.update({
      where: { user_id: farmerId },
      data: { cooperative_id: null },
    });

    return NextResponse.json({ message: 'Farmer removed from cooperative successfully' });
  } catch (error) {
    console.error('Error removing cooperative member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
