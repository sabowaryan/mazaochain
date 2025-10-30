import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

export const createClient = () => {
  // Don't use custom cookie handling - let @supabase/ssr handle it automatically
  // The library will use localStorage/sessionStorage which is then synced with cookies by the middleware
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
};

// Only create instance in browser environment
export const supabase =
  typeof window !== "undefined"
    ? createClient()
    : (null as unknown as ReturnType<typeof createClient>);
