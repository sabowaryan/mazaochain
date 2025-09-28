import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Simple metrics collection for Prometheus
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

export async function GET() {
  try {
    requestCount++;
    
    const supabase = createClient();
    
    // Get basic metrics from database
    const [
      { count: userCount },
      { count: loanCount },
      { count: evaluationCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('loans').select('*', { count: 'exact', head: true }),
      supabase.from('crop_evaluations').select('*', { count: 'exact', head: true })
    ]);

    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    const metrics = `
# HELP mazaochain_users_total Total number of registered users
# TYPE mazaochain_users_total counter
mazaochain_users_total ${userCount || 0}

# HELP mazaochain_loans_total Total number of loans
# TYPE mazaochain_loans_total counter
mazaochain_loans_total ${loanCount || 0}

# HELP mazaochain_evaluations_total Total number of crop evaluations
# TYPE mazaochain_evaluations_total counter
mazaochain_evaluations_total ${evaluationCount || 0}

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
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      }
    });

  } catch (error) {
    errorCount++;
    console.error('Metrics collection failed:', error);
    
    return NextResponse.json({
      error: 'Failed to collect metrics'
    }, { status: 500 });
  }
}