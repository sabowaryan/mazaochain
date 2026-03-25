import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

export async function GET() {
  try {
    requestCount++;

    const [userCount, loanCount, evaluationCount] = await Promise.all([
      prisma.profile.count(),
      prisma.loan.count(),
      prisma.cropEvaluation.count(),
    ]);

    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const metrics = `
# HELP mazaochain_users_total Total number of registered users
# TYPE mazaochain_users_total counter
mazaochain_users_total ${userCount}

# HELP mazaochain_loans_total Total number of loans
# TYPE mazaochain_loans_total counter
mazaochain_loans_total ${loanCount}

# HELP mazaochain_evaluations_total Total number of crop evaluations
# TYPE mazaochain_evaluations_total counter
mazaochain_evaluations_total ${evaluationCount}

# HELP mazaochain_http_requests_total Total number of HTTP requests
# TYPE mazaochain_http_requests_total counter
mazaochain_http_requests_total ${requestCount}

# HELP mazaochain_http_errors_total Total number of HTTP errors
# TYPE mazaochain_http_errors_total counter
mazaochain_http_errors_total ${errorCount}

# HELP mazaochain_uptime_seconds Application uptime in seconds
# TYPE mazaochain_uptime_seconds gauge
mazaochain_uptime_seconds ${uptime}

# HELP mazaochain_version_info Application version information
# TYPE mazaochain_version_info gauge
mazaochain_version_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV}"} 1
`;

    return new NextResponse(metrics, {
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
  } catch (error) {
    errorCount++;
    console.error('Metrics collection failed:', error);
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}
