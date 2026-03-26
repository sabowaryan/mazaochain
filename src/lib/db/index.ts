import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeon(sql);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Lazy proxy: Prisma is only initialized on the first actual method call,
// not at module evaluation time. This avoids Turbopack chunking issues
// where `base64url` encoding is unavailable during SSR bundle evaluation.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return (getPrismaClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
