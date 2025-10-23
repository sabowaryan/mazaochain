import { createClient } from './client'
import { getUserProfile } from '../auth/role-redirect'

// Client-side only auth functions
export const clientAuth = {
  async signUp(email: string, password: string, userData: { role: 'agriculteur' | 'cooperative' | 'preteur' }) {
    const supabase = createClient()
    
    // Le profil sera créé automatiquement par le trigger handle_new_user()
    // On passe les données dans raw_user_meta_data pour que le trigger puisse les utiliser
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { data, error }
  },

  async signInWithProfile(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error || !data.user) {
      return { data, error, profile: null }
    }

    // Get user profile with role
    try {
      const profile = await getUserProfile(supabase, data.user.id)
      return { data, error: null, profile }
    } catch (profileError) {
      return { 
        data, 
        error: { message: 'Profile not found' }, 
        profile: null 
      }
    }
  },

  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async updateProfile(updates: Record<string, unknown>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('No authenticated user')
    
    // TODO: Fix type issue with Supabase generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    return { data, error }
  }
}