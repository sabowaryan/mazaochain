'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User, AuthChangeEvent } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  farmer_profiles?: Database['public']['Tables']['farmer_profiles']['Row'];
  cooperative_profiles?: Database['public']['Tables']['cooperative_profiles']['Row'];
  lender_profiles?: Database['public']['Tables']['lender_profiles']['Row'];
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: unknown }>;
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
    loading: true,
    initialized: false,
  });

  const router = useRouter();
  const supabase = createClient();

  // Fetch user profile with farmer profile data
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
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
        
        if (profileError.message?.includes('permission denied') || profileError.message?.includes('JWT')) {
          console.warn('Permission denied for profiles table - using fallback profile from user metadata');
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
        
        console.error('Error fetching profile:', profileError.message || profileError);
        // Retourner un profil minimal plutôt que null pour éviter le blocage
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: userId,
            email: user.email || null,
            phone_number: null,
            role: (user.user_metadata?.role as 'admin' | 'cooperative' | 'agriculteur' | 'preteur') || 'agriculteur',
            is_validated: false,
            wallet_address: null,
            created_at: new Date().toISOString()
          };
        }
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
    setAuthState(prev => ({ ...prev, loading: true }));

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      
      setAuthState({
        user: session.user,
        profile,
        loading: false,
        initialized: true,
      });
    } else {
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });

      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    }
  }, [fetchProfile, router]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!supabase) {
        console.warn('Supabase client not available during initialization');
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false, initialized: true }));
        }
        return;
      }

      try {
        // Get session first (safer approach)
        const { data: { session } } = await supabase.auth.getSession();
        
        // If no session, user is not authenticated - this is normal, not an error
        if (!session) {
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
            });
          }
          return;
        }

        // If we have a session, verify the user
        const { error: userError } = await supabase.auth.getUser();
        
        if (userError && !userError.message?.includes('Auth session missing')) {
          console.error('Error getting user:', userError);
        }

        if (mounted) {
          await handleAuthChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        // Only log unexpected errors, not auth session missing
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Auth session missing')) {
          console.error('Error initializing auth:', error);
        }
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (only if supabase is available)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [supabase, handleAuthChange]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') };
    }

    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    return { error };
  }, [supabase]);

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData: Partial<Profile>
  ) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') };
    }

    setAuthState(prev => ({ ...prev, loading: true }));

    const { error } = await supabase.auth.signUp({
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
  }, [supabase]);

  // Sign out function
  const signOut = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    console.log('🔓 Starting sign out process...');
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      // Disconnect wallet first
      try {
        const { hederaWalletService } = await import('@/lib/wallet/hedera-wallet');
        await hederaWalletService.disconnectWallet();
        console.log('✅ Wallet disconnected successfully');
      } catch (walletError) {
        console.warn('⚠️ Error disconnecting wallet:', walletError);
        // Continue with sign out even if wallet disconnect fails
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Error signing out from Supabase:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('✅ Successfully signed out from Supabase');

      // Clear local state immediately
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });

      // Clear any remaining session data
      if (typeof window !== 'undefined') {
        try {
          // Clear localStorage items related to wallet and session
          localStorage.removeItem('hedera_wallet_session');
          sessionStorage.clear();
          
          // Clear any WalletConnect storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('wc@2:') || key.startsWith('appkit') || key.startsWith('reown')) {
              localStorage.removeItem(key);
            }
          });
          
          console.log('✅ Cleared local storage and wallet sessions');
        } catch (storageError) {
          console.warn('⚠️ Error clearing storage:', storageError);
        }
      }

      // Redirect to login page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/fr';
      const locale = currentPath.split('/')[1] || 'fr';
      const loginUrl = `/${locale}/auth/login`;
      
      console.log(`🔄 Redirecting to ${loginUrl}`);
      
      // Use router.push first, then fallback to window.location if needed
      router.push(loginUrl);
      
      // Force reload after a short delay to ensure middleware processes the sign out
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 100);
      
    } catch (error) {
      console.error('❌ Unexpected error during sign out:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase, router]);

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