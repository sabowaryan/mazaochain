import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmer_id');
    const status = searchParams.get('status');
    const cooperativeId = searchParams.get('cooperative_id');

    let farmerIds: string[] | undefined;
    if (cooperativeId) {
      const farmers = await prisma.farmerProfile.findMany({
        where: { cooperative_id: cooperativeId },
        select: { user_id: true },
      });
      if (!farmers.length) return NextResponse.json({ data: [], message: 'No evaluations for this cooperative' });
      farmerIds = farmers.map(f => f.user_id);
    }

    const evaluations = await prisma.cropEvaluation.findMany({
      where: {
        ...(farmerId ? { farmer_id: farmerId } : {}),
        ...(status ? { status } : {}),
        ...(farmerIds ? { farmer_id: { in: farmerIds } } : {}),
      },
      include: { farmer: { include: { farmer_profile: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: evaluations, message: 'Evaluations retrieved successfully' });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { farmer_id, crop_type, superficie, rendement_historique, prix_reference, valeur_estimee } = body;

    if (!farmer_id || !crop_type || !superficie || !rendement_historique || !prix_reference || !valeur_estimee) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evaluation = await prisma.cropEvaluation.create({
      data: { farmer_id, crop_type, superficie, rendement_historique, prix_reference, valeur_estimee },
    });

    return NextResponse.json({ data: evaluation, message: 'Evaluation created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
