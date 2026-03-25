import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluation = await prisma.cropEvaluation.findUnique({
      where: { id },
      include: { farmer: { include: { farmer_profile: true } } },
    });
    if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = ['status', 'crop_type', 'superficie', 'rendement_historique', 'prix_reference', 'valeur_estimee'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const evaluation = await prisma.cropEvaluation.update({ where: { id }, data });
    return NextResponse.json(evaluation);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    console.error('Error updating evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
