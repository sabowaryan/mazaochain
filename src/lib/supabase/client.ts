import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'mazaochain-auth-token',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'mazaochain-web'
        }
      }
    }
  )

export const supabase = createClient()