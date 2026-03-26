import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neon } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeon(sql);
  const client = new PrismaClient({ adapter });

  // Cache unconditionally — in dev this avoids HMR instantiation churn;
  // in production it prevents per-request client creation and DB connection exhaustion.
  globalForPrisma.prisma = client;

  return client;
}

// Lazy proxy: Prisma is only initialized on the first actual method call,
// not at module evaluation time. This avoids Turbopack chunking issues
// where `base64url` encoding is unavailable during SSR bundle evaluation.
//
// Functions are explicitly bound to the real PrismaClient instance so that
// `this` inside methods like $transaction, $connect, etc. is always correct.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as Function).bind(client);
    }
    return value;
  },
});
