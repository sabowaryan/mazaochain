import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const cooperativeId = searchParams.get('cooperative_id');

    let query = supabase
      .from('profiles')
      .select(`
        *,
        farmer_profiles (
          nom,
          superficie,
          localisation,
          crop_type,
          rendement_historique,
          experience_annees
        )
      `)
      .eq('role', 'agriculteur');

    if (cooperativeId) {
      query = query.eq('farmer_profiles.cooperative_id', cooperativeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des agriculteurs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}