import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
} from "@/lib/errors/api-errors";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Dynamic import to avoid build-time issues
    const { lenderService } = await import("@/lib/services/lender");
    const opportunities = await lenderService.getAvailableLoanOpportunities();
    return createSuccessResponse(
      opportunities,
      "Loan opportunities retrieved successfully"
    );
  } catch (error) {
    console.error("Error in lender opportunities API:", error);
    return createErrorResponse(error, 500, requestId);
  }
}
