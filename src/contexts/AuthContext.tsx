'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  farmer_profiles?: Database['public']['Tables']['farmer_profiles']['Row'];
  cooperative_profiles?: Database['public']['Tables']['cooperative_profiles']['Row'];
  lender_profiles?: Database['public']['Tables']['lender_profiles']['Row'];
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isValidated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false,
  });

  const router = useRouter();
  const supabase = createClient();

  // Fetch user profile with farmer profile data
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      // First, get the basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // Gestion spécifique des erreurs connues
        if (profileError.message?.includes('infinite recursion')) {
          console.warn('RLS policy recursion detected - using fallback profile');
          // Créer un profil par défaut basé sur les métadonnées utilisateur
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.role) {
            return {
              id: userId,
              email: user.email || null,
              phone_number: null,
              role: user.user_metadata.role as 'admin' | 'cooperative' | 'agriculteur' | 'preteur',
              is_validated: user.user_metadata.role !== 'agriculteur',
              wallet_address: null,
              created_at: new Date().toISOString()
            };
          }
        }
        
        if (profileError.message?.includes('permission denied')) {
          console.warn('Permission denied for profiles table - user may need to complete setup');
        }
        
        console.error('Error fetching profile:', profileError.message || profileError);
        return null;
      }

      // If user is a farmer, also fetch farmer profile data
      if (profileData?.role === 'agriculteur') {
        try {
          const { data: farmerData, error: farmerError } = await supabase
            .from('farmer_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!farmerError && farmerData) {
            // Merge farmer profile data into the main profile
            return {
              ...profileData,
              farmer_profiles: farmerData
            };
          }
        } catch (farmerError) {
          console.warn('Could not fetch farmer profile data:', farmerError);
        }
      }

      // If user is a cooperative, fetch cooperative profile data
      if (profileData?.role === 'cooperative') {
        try {
          const { data: coopData, error: coopError } = await supabase
            .from('cooperative_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!coopError && coopData) {
            return {
              ...profileData,
              cooperative_profiles: coopData
            };
          }
        } catch (coopError) {
          console.warn('Could not fetch cooperative profile data:', coopError);
        }
      }

      // If user is a lender, fetch lender profile data
      if (profileData?.role === 'preteur') {
        try {
          const { data: lenderData, error: lenderError } = await supabase
            .from('lender_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!lenderError && lenderData) {
            return {
              ...profileData,
              lender_profiles: lenderData
            };
          }
        } catch (lenderError) {
          console.warn('Could not fetch lender profile data:', lenderError);
        }
      }

      return profileData;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  }, [supabase]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;
    
    const profile = await fetchProfile(authState.user.id);
    setAuthState(prev => ({ ...prev, profile }));
  }, [authState.user, fetchProfile]);

  // Handle auth state changes
  const handleAuthChange = useCallback(async (
    event: AuthChangeEvent,
    session: Session | null
  ) => {
    console.log('Auth state changed:', event, session?.user?.email);

    setAuthState(prev => ({ ...prev, loading: true }));

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      
      setAuthState({
        user: session.user,
        profile,
        session,
        loading: false,
        initialized: true,
      });

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session.user.email);
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed for:', session.user.email);
          break;
        case 'USER_UPDATED':
          console.log('User updated:', session.user.email);
          break;
      }
    } else {
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        initialized: true,
      });

      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        router.push('/');
      }
    }
  }, [fetchProfile, router]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          await handleAuthChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, handleAuthChange]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  }, [supabase.auth]);

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData: Partial<Profile>
  ) => {
    setAuthState(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  }, [supabase.auth]);

  // Sign out function
  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth]);

  // Helper functions
  const isAuthenticated = !!authState.user;
  const isValidated = authState.profile?.is_validated ?? false;
  
  const hasRole = useCallback((role: string) => {
    return authState.profile?.role === role;
  }, [authState.profile]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.includes(authState.profile?.role || '');
  }, [authState.profile]);

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAuthenticated,
    isValidated,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };