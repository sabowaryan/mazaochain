import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Only create instance in browser environment
export const supabase =
  typeof window !== "undefined"
    ? createClient()
    : (null as unknown as ReturnType<typeof createClient>);
