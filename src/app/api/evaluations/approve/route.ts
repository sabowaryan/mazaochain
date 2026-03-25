import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileRows = await sql`SELECT role FROM profiles WHERE id = ${userId}`;
    const profile = profileRows[0] as { role: string } | undefined;

    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { evaluationId } = body;

    if (!evaluationId) {
      return NextResponse.json({ error: "Missing evaluationId" }, { status: 400 });
    }

    const evalRows = await sql`
      SELECT ce.*, p.wallet_address, fp.nom AS farmer_nom, fp.localisation AS farmer_localisation
      FROM crop_evaluations ce
      JOIN profiles p ON p.id = ce.farmer_id
      LEFT JOIN farmer_profiles fp ON fp.user_id = ce.farmer_id
      WHERE ce.id = ${evaluationId}
    `;

    if (!evalRows.length) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    const evaluation = evalRows[0] as any;

    if (evaluation.status !== 'pending') {
      return NextResponse.json({ error: "Cette évaluation a déjà été traitée" }, { status: 400 });
    }

    if (!evaluation.wallet_address) {
      return NextResponse.json(
        { error: "Le fermier n'a pas d'adresse wallet configurée" },
        { status: 400 }
      );
    }

    const tokenSymbol = `MAZAO-${evaluation.crop_type.toUpperCase()}-${Date.now()}`;
    const daysUntilHarvest = evaluation.crop_type === 'cafe' ? 90 : 120;
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest);

    await sql`
      UPDATE crop_evaluations SET status = 'approved' WHERE id = ${evaluationId}
    `;

    await sql`
      INSERT INTO tokenization_records (evaluation_id, status, error_message)
      VALUES (
        ${evaluationId}::uuid,
        'pending',
        ${`Awaiting blockchain tokenization. Token: ${tokenSymbol}, Farmer: ${evaluation.wallet_address}, Value: ${evaluation.valeur_estimee} USDC`}
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Évaluation approuvée avec succès",
      evaluationId,
      tokenSymbol,
      farmerAddress: evaluation.wallet_address,
      estimatedValue: evaluation.valeur_estimee,
      harvestDate: harvestDate.toISOString(),
      note: "Tokenisation blockchain en attente d'implémentation complète",
    });
  } catch (error) {
    console.error('Error approving evaluation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
