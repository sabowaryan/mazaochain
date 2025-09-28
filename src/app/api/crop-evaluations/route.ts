import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const farmerId = searchParams.get('farmer_id');
    const status = searchParams.get('status');
    const cooperativeId = searchParams.get('cooperative_id');

    let query = supabase
      .from('crop_evaluations')
      .select(`
        *,
        farmer:profiles!farmer_id (
          id,
          role,
          farmer_profiles!farmer_profiles_user_id_fkey (
            nom,
            superficie,
            localisation
          )
        )
      `);

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (cooperativeId) {
      // Filtrer par coopérative via une sous-requête
      const { data: farmerIds } = await supabase
        .from('farmer_profiles')
        .select('user_id')
        .eq('cooperative_id', cooperativeId);
      
      if (farmerIds && farmerIds.length > 0) {
        const ids = farmerIds.map(f => f.user_id);
        query = query.in('farmer_id', ids);
      } else {
        // Aucun fermier dans cette coopérative
        query = query.eq('farmer_id', 'no-match');
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('crop_evaluations')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}