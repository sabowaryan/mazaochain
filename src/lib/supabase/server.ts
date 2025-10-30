import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'

export const createClient = async () => {
  // Never use browser client in server context
  if (typeof window !== 'undefined') {
    throw new Error('createClient from server.ts should only be used in server context')
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
    console.error('Error creating Supabase server client:', error)
    throw error
  }
}