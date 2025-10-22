import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'

export const createClient = async () => {
  // During build time or when cookies are not available, use a minimal client
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
    // For build time or client-side, create a basic client without cookies
    const { createClient: createBrowserClient } = await import('./client')
    return createBrowserClient()
  }

  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error) {
    // Fallback to browser client if next/headers is not available
    const { createClient: createBrowserClient } = await import('./client')
    return createBrowserClient()
  }
}