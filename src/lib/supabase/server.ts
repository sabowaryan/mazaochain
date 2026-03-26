// Supabase server client removed — project now uses Clerk (auth) + Neon (database)
// This stub silently degrades to avoid crashing server components that still import it.
// Migrate callers to: src/lib/db (Prisma) or @clerk/nextjs/server.

const makeProxy = (path: string): any =>
  new Proxy(() => Promise.resolve({ data: null, error: { message: 'Supabase removed — use Prisma/Clerk instead' } }), {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      return makeProxy(`${path}.${String(prop)}`);
    },
    apply(_target, _thisArg, _args) {
      if (typeof console !== 'undefined') {
        console.warn(`[supabase-stub] ${path}() called but Supabase is removed. Migrate to Prisma/Clerk.`);
      }
      return Promise.resolve({ data: null, error: { message: 'Supabase removed — use Prisma/Clerk instead' } });
    },
  });

export const createClient = async () => {
  if (typeof console !== 'undefined') {
    console.warn('[supabase-stub] createClient() called (server) but Supabase is removed. Migrate to Prisma/Clerk.');
  }
  return makeProxy('supabase');
};
