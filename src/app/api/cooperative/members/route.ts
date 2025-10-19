import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createDatabaseErrorResponse,
  generateRequestId 
} from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const cooperativeId = searchParams.get('cooperative_id');

    if (!cooperativeId) {
      return createErrorResponse(
        new Error('cooperative_id parameter is required'),
        400,
        requestId
      );
    }

    // Récupérer les profils des fermiers de cette coopérative
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select(`
        *,
        user:profiles!farmer_profiles_user_id_fkey (
          id,
          email,
          role,
          is_validated
        )
      `)
      .eq('cooperative_id', cooperativeId);

    if (error) {
      return createDatabaseErrorResponse(error, requestId);
    }

    return createSuccessResponse(data || [], 'Cooperative members retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
