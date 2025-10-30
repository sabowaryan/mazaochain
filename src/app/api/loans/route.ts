import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createDatabaseErrorResponse,
  generateRequestId 
} from "@/lib/errors/api-errors";
import { ErrorCode } from "@/lib/errors/types";
import { MazaoChainError } from "@/lib/errors/MazaoChainError";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse(
        new MazaoChainError(
          ErrorCode.UNAUTHORIZED,
          'Authentication required',
          { userMessage: 'Vous devez vous connecter pour accéder à cette fonctionnalité' }
        ),
        401,
        requestId
      );
    }

    const { searchParams } = new URL(request.url);

    const borrowerId = searchParams.get("borrower_id");
    const lenderId = searchParams.get("lender_id");
    const status = searchParams.get("status");
    const cooperativeId = searchParams.get("cooperative_id");
    const excludeLender = searchParams.get("exclude_lender");

    let query = supabase.from("loans").select(`
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
      const { data: farmerIds } = await supabase
        .from('farmer_profiles')
        .select('user_id')
        .eq('cooperative_id', cooperativeId);

      if (!farmerIds || farmerIds.length === 0) {
        // Aucun fermier dans cette coopérative → retourner une liste vide
        return createSuccessResponse([], 'No loans for this cooperative');
      }

      const ids = farmerIds.map(f => f.user_id);
      query = query.in('borrower_id', ids);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return createDatabaseErrorResponse(error, requestId);
    }

    return createSuccessResponse(data || [], 'Loans retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse(
        new MazaoChainError(
          ErrorCode.UNAUTHORIZED,
          'Authentication required',
          { userMessage: 'Vous devez vous connecter pour accéder à cette fonctionnalité' }
        ),
        401,
        requestId
      );
    }
    const body = await request.json();

    // Validate required fields
    if (!body.borrower_id || !body.amount) {
      const validationError = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Missing required fields: borrower_id and amount are required',
        {
          userMessage: 'Veuillez fournir tous les champs obligatoires'
        }
      );
      return createErrorResponse(validationError, 400, requestId);
    }

    const { data, error } = await supabase
      .from("loans")
      .insert([body])
      .select()
      .single();

    if (error) {
      return createDatabaseErrorResponse(error, requestId);
    }

    return createSuccessResponse(data, 'Loan created successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
