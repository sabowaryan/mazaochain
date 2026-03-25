/**
 * Hook for managing user profile data
 * Uses API routes backed by Neon (PostgreSQL) instead of Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

interface UseProfileReturn<T> {
  profileData: T | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>;
}

function getProfileTable(role: UserRole): string | null {
  switch (role) {
    case 'agriculteur': return 'farmer_profiles';
    case 'cooperative': return 'cooperative_profiles';
    case 'preteur': return 'lender_profiles';
    default: return null;
  }
}

export function useProfile<T = any>(role?: UserRole): UseProfileReturn<T> {
  const { user, profile, initialized } = useAuth();
  const [profileData, setProfileData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveRole = (role || profile?.role) as UserRole | undefined;
  const table = effectiveRole ? getProfileTable(effectiveRole) : null;

  const refreshProfile = useCallback(async () => {
    if (!user || !table) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/profile-data?table=${table}&userId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else if (res.status === 404) {
        setProfileData(null);
      } else {
        setError('Erreur lors du chargement du profil');
      }
    } catch (err) {
      setError('Erreur inattendue lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user, table]);

  const updateProfile = useCallback(
    async (updateData: Partial<T>): Promise<{ success: boolean; error?: string }> => {
      if (!user || !table) return { success: false, error: 'Utilisateur non connecté' };
      try {
        setLoading(true);
        const method = profileData ? 'PATCH' : 'POST';
        const res = await fetch(`/api/profile-data?table=${table}&userId=${encodeURIComponent(user.id)}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) {
          const err = await res.json();
          setError('Erreur lors de la sauvegarde');
          return { success: false, error: err.error };
        }
        const updated = await res.json();
        setProfileData(updated as T);
        return { success: true };
      } catch (err) {
        const msg = 'Erreur inattendue lors de la sauvegarde';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user, table, profileData]
  );

  useEffect(() => {
    if (!initialized) return;
    if (!user || !table) {
      setLoading(false);
      setProfileData(null);
      return;
    }
    refreshProfile();
  }, [initialized, user, table]);

  return { profileData, loading, error, refreshProfile, updateProfile };
}

export function useFarmerProfile() {
  return useProfile('agriculteur');
}

export function useCooperativeProfile() {
  return useProfile('cooperative');
}

export function useLenderProfile() {
  return useProfile('preteur');
}

export function useUserStats() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.role) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user-stats?userId=${encodeURIComponent(user.id)}&role=${profile.role}`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, profile]);

  return { stats, loading };
}
