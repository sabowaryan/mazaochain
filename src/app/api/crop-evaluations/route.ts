import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createDatabaseErrorResponse,
  generateRequestId 
} from '@/lib/errors/api-errors';
import { ErrorCode } from '@/lib/errors/types';
import { MazaoChainError } from '@/lib/errors/MazaoChainError';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
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
      return createDatabaseErrorResponse(error, requestId);
    }

    return createSuccessResponse(data || [], 'Crop evaluations retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.farmer_id || !body.crop_type || !body.superficie || !body.rendement_estime) {
      const validationError = new MazaoChainError(
        ErrorCode.VALIDATION_ERROR,
        'Missing required fields for crop evaluation',
        {
          userMessage: 'Veuillez fournir tous les champs obligatoires (type de culture, superficie, rendement)'
        }
      );
      return createErrorResponse(validationError, 400, requestId);
    }

    const { data, error } = await supabase
      .from('crop_evaluations')
      .insert([body])
      .select()
      .single();

    if (error) {
      return createDatabaseErrorResponse(error, requestId);
    }

    return createSuccessResponse(data, 'Crop evaluation created successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}