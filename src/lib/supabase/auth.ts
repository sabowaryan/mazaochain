import { createClient as createServerClient } from './server'
import { redirect } from 'next/navigation'
import type { Database } from './database.types'

export type AuthUser = Database['public']['Tables']['profiles']['Row']

// Server-side auth functions only
export const serverAuth = {
  async getCurrentUser() {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getUserProfile(userId: string) {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  }
}

export async function requireAuth(allowedRoles?: string[]) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      // For admin role, redirect to unauthorized page
      if (allowedRoles.includes('admin')) {
        redirect('/unauthorized')
      }
      redirect('/dashboard')
    }
  }

  return user
}