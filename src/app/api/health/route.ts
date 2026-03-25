import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const missingEnvVars = ['NEXT_PUBLIC_HEDERA_NETWORK', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'].filter(
      v => !process.env[v]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: { database: 'ok', environment: 'ok' },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: { database: 'error', environment: 'error' },
      },
      { status: 503 }
    );
  }
}
