import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get("borrower_id");
    const lenderId = searchParams.get("lender_id");
    const status = searchParams.get("status");
    const cooperativeId = searchParams.get("cooperative_id");
    const excludeLender = searchParams.get("exclude_lender");

    let query = (await supabase).from("loans").select(`
        *,
        borrower:profiles!borrower_id (
          id,
          role,
          farmer_profiles!farmer_profiles_user_id_fkey (
            nom,
            localisation
          )
        ),
        lender:profiles!lender_id (
          id,
          role,
          lender_profiles!lender_profiles_user_id_fkey (
            institution_name
          )
        )
      `);

    if (borrowerId) {
      query = query.eq("borrower_id", borrowerId);
    }

    if (lenderId) {
      query = query.eq("lender_id", lenderId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (excludeLender) {
      query = query.neq("lender_id", excludeLender);
    }

    if (cooperativeId) {
      // Filtrer par coopérative via une sous-requête
      const { data: farmerIds } = await (await supabase)
        .from('farmer_profiles')
        .select('user_id')
        .eq('cooperative_id', cooperativeId);
      
      if (farmerIds && farmerIds.length > 0) {
        const ids = farmerIds.map(f => f.user_id);
        query = query.in('borrower_id', ids);
      } else {
        // Aucun fermier dans cette coopérative
        query = query.eq('borrower_id', 'no-match');
      }
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Erreur lors de la récupération des prêts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await (await supabase)
      .from("loans")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création du prêt:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
