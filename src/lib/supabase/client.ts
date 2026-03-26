// Supabase client removed — project now uses Clerk (auth) + Neon (database)
// This stub silently degrades to avoid crashing files that still import it.
// Migrate callers to: src/lib/db (Prisma) or @clerk/nextjs hooks.

const warnOnce = (() => {
  const warned = new Set<string>();
  return (key: string, msg: string) => {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[supabase-stub] ${msg}`);
    }
  };
})();

const makeProxy = (path: string): any =>
  new Proxy(() => Promise.resolve({ data: null, error: { message: 'Supabase removed — use Prisma/Clerk instead' } }), {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      return makeProxy(`${path}.${String(prop)}`);
    },
    apply(_target, _thisArg, _args) {
      warnOnce(path, `${path}() called but Supabase is removed. Migrate to Prisma/Clerk.`);
      return Promise.resolve({ data: null, error: { message: 'Supabase removed — use Prisma/Clerk instead' } });
    },
  });

export const createClient = () => {
  warnOnce('createClient', 'createClient() called but Supabase is removed. Migrate to Prisma/Clerk.');
  return makeProxy('supabase');
};

export const supabase = makeProxy('supabase');
