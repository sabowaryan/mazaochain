import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createErrorResponse, 
  createSuccessResponse,
  generateRequestId 
} from '@/lib/errors/api-errors';
import { mazaoContractsService } from '@/lib/services/mazao-contracts';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { 
      evaluationId, 
      cropType, 
      farmerId, 
      farmerAddress, 
      estimatedValue, 
      harvestDate 
    } = body;

    // Validate required fields
    if (!evaluationId || !cropType || !farmerId || !farmerAddress || !estimatedValue || !harvestDate) {
      return createErrorResponse(
        new Error('Missing required fields'),
        400,
        requestId
      );
    }

    // Verify user has permission (must be cooperative or admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return createErrorResponse(
        new Error('Unauthorized'),
        401,
        requestId
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['cooperative', 'admin'].includes(profile.role)) {
      return createErrorResponse(
        new Error('Insufficient permissions'),
        403,
        requestId
      );
    }

    // Perform tokenization
    const result = await mazaoContractsService.tokenizeApprovedEvaluation(
      evaluationId,
      cropType,
      farmerId,
      farmerAddress,
      estimatedValue,
      harvestDate
    );

    if (!result.success) {
      return createErrorResponse(
        new Error(result.error || 'Tokenization failed'),
        500,
        requestId
      );
    }

    return createSuccessResponse(result, 'Tokenization completed successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
