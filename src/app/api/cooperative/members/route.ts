import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cooperativeId = searchParams.get('cooperative_id');

    if (!cooperativeId) {
      return NextResponse.json({ error: 'cooperative_id parameter is required' }, { status: 400 });
    }

    const requesterProfile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!requesterProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    if (requesterProfile.role !== 'admin' && userId !== cooperativeId) {
      return NextResponse.json({ error: 'Access denied: you can only view your own cooperative members' }, { status: 403 });
    }

    const members = await prisma.farmerProfile.findMany({
      where: { cooperative_id: cooperativeId },
      orderBy: { created_at: 'desc' },
    });

    const enriched = await Promise.all(
      members.map(async m => {
        const latestEval = await prisma.cropEvaluation.findFirst({
          where: { farmer_id: m.user_id },
          orderBy: { created_at: 'desc' },
          select: { status: true, crop_type: true },
        });
        const evalCount = await prisma.cropEvaluation.count({ where: { farmer_id: m.user_id } });
        return {
          user_id: m.user_id,
          nom: m.nom,
          superficie: Number(m.superficie),
          localisation: m.localisation,
          crop_type: m.crop_type,
          telephone: m.telephone,
          experience_annees: m.experience_annees,
          created_at: m.created_at,
          evaluation_count: evalCount,
          latest_evaluation_status: latestEval?.status ?? null,
          latest_evaluation_crop: latestEval?.crop_type ?? null,
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
    const { farmer_id, email } = body as { farmer_id?: string; email?: string };

    let resolvedFarmerId: string | null = null;

    if (farmer_id && typeof farmer_id === 'string' && farmer_id.trim()) {
      resolvedFarmerId = farmer_id.trim();
    } else if (email && typeof email === 'string' && email.trim()) {
      const clerk = await clerkClient();
      const usersResult = await clerk.users.getUserList({ emailAddress: [email.trim()] });
      if (usersResult.totalCount === 0) {
        return NextResponse.json({ error: 'No user found with this email address' }, { status: 404 });
      }
      resolvedFarmerId = usersResult.data[0].id;
    } else {
      return NextResponse.json({ error: 'Either farmer_id (user ID) or email is required' }, { status: 400 });
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { user_id: resolvedFarmerId } });
    if (!farmerProfile) {
      return NextResponse.json({ error: 'No farmer profile found for this user. The user must register as a farmer first.' }, { status: 404 });
    }

    if (farmerProfile.cooperative_id && farmerProfile.cooperative_id !== userId) {
      return NextResponse.json({ error: 'This farmer is already a member of another cooperative' }, { status: 409 });
    }

    if (farmerProfile.cooperative_id === userId) {
      return NextResponse.json({ error: 'This farmer is already a member of your cooperative' }, { status: 409 });
    }

    const updated = await prisma.farmerProfile.update({
      where: { user_id: resolvedFarmerId },
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
