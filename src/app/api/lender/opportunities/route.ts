import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
} from "@/lib/errors/api-errors";
import { lenderService } from "@/lib/services/lender";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const opportunities = await lenderService.getAvailableLoanOpportunities();
    return createSuccessResponse(
      opportunities,
      "Loan opportunities retrieved successfully"
    );
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
