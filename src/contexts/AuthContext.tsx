'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  wallet_address: string | null;
  is_validated: boolean;
  created_at: string;
}

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  user: { id: string; email?: string } | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isValidated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>({
    profile: null,
    loading: true,
    initialized: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const profile: Profile = await res.json();
        setAuthState({ profile, loading: false, initialized: true });
      } else {
        setAuthState({ profile: null, loading: false, initialized: true });
      }
    } catch {
      setAuthState({ profile: null, loading: false, initialized: true });
    }
  }, []);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (isSignedIn && clerkUser) {
      fetchProfile(clerkUser.id);
    } else {
      setAuthState({ profile: null, loading: false, initialized: true });
    }
  }, [clerkLoaded, isSignedIn, clerkUser, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (clerkUser) {
      await fetchProfile(clerkUser.id);
    }
  }, [clerkUser, fetchProfile]);

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    await clerkSignOut();
    setAuthState({ profile: null, loading: false, initialized: true });
    router.push('/fr/auth/login');
  }, [clerkSignOut, router]);

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      }
    : null;

  const isAuthenticated = !!(isSignedIn && clerkUser);
  const isValidated = authState.profile?.is_validated ?? false;

  const hasRole = useCallback(
    (role: string) => authState.profile?.role === role,
    [authState.profile]
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.includes(authState.profile?.role || ''),
    [authState.profile]
  );

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        user,
        signOut,
        refreshProfile,
        isAuthenticated,
        isValidated,
        hasRole,
        hasAnyRole,
      }}
    >
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
