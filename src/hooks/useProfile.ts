/**
 * Hook générique pour la gestion des profils utilisateur
 * Gère tous les types de profils (agriculteur, coopérative, prêteur)
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = "agriculteur" | "cooperative" | "preteur" | "admin";

type FarmerProfile = Database["public"]["Tables"]["farmer_profiles"]["Row"];
type CooperativeProfile =
  Database["public"]["Tables"]["cooperative_profiles"]["Row"];
type LenderProfile = Database["public"]["Tables"]["lender_profiles"]["Row"];

interface UseProfileReturn<T> {
  profileData: T | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    data: Partial<T>
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook générique pour récupérer et gérer les données de profil spécialisées
 */
export function useProfile<T = any>(role?: UserRole): UseProfileReturn<T> {
  const { user, profile, initialized } = useAuth();
  const [profileData, setProfileData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Déterminer la table et les champs en fonction du rôle
  const getTableInfo = useCallback((userRole: UserRole) => {
    switch (userRole) {
      case "agriculteur":
        return {
          table: "farmer_profiles",
          fields: "*",
        };
      case "cooperative":
        return {
          table: "cooperative_profiles",
          fields: "*",
        };
      case "preteur":
        return {
          table: "lender_profiles",
          fields: "*",
        };
      default:
        return null;
    }
  }, []);

  // Actualiser les données du profil
  const refreshProfile = useCallback(async () => {
    if (!user || !profile?.role) {
      setLoading(false);
      return;
    }

    const currentRole = role || profile.role;
    const tableInfo = getTableInfo(currentRole);

    if (!tableInfo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from(tableInfo.table as any)
        .select(tableInfo.fields)
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        if (fetchError.code !== "PGRST116") {
          console.error(`Error refreshing ${tableInfo.table}:`, fetchError);
          setError("Erreur lors du rechargement du profil");
        } else {
          setProfileData(null);
        }
      } else {
        setProfileData(data as T);
      }
    } catch (err) {
      console.error("Unexpected error refreshing profile:", err);
      setError("Erreur inattendue lors du rechargement");
    } finally {
      setLoading(false);
    }
  }, [user, profile, role, getTableInfo, supabase]);

  // Mettre à jour les données du profil
  const updateProfile = useCallback(
    async (
      updateData: Partial<T>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user || !profile?.role) {
        return { success: false, error: "Utilisateur non connecté" };
      }

      const currentRole = role || profile.role;
      const tableInfo = getTableInfo(currentRole);

      if (!tableInfo) {
        return { success: false, error: "Type de profil non supporté" };
      }

      try {
        setLoading(true);
        setError(null);

        let result;

        if (profileData && (profileData as any).id) {
          // Mettre à jour le profil existant
          result = await supabase
            .from(tableInfo.table as any)
            .update(updateData)
            .eq("id", (profileData as unknown).id)
            .select()
            .single();
        } else {
          // Créer un nouveau profil
          const newProfileData = {
            user_id: user.id,
            ...updateData,
          };

          result = await supabase
            .from(tableInfo.table as unknown)
            .insert([newProfileData])
            .select()
            .single();
        }

        if (result.error) {
          console.error(`Error updating ${tableInfo.table}:`, result.error);
          setError("Erreur lors de la sauvegarde");
          return { success: false, error: result.error.message };
        }

        // Mettre à jour l'état local
        setProfileData(result.data as T);
        return { success: true };
      } catch (err) {
        console.error("Unexpected error updating profile:", err);
        const errorMessage = "Erreur inattendue lors de la sauvegarde";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [user, profile, role, profileData, getTableInfo, supabase]
  );

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      // Attendre que l'auth soit initialisée
      if (!initialized) {
        return;
      }

      // Si pas d'utilisateur, arrêter le chargement immédiatement
      if (!user) {
        if (mounted) {
          setLoading(false);
          setProfileData(null);
        }
        return;
      }

      // Si pas de rôle dans le profil, arrêter le chargement
      if (!profile?.role) {
        if (mounted) {
          setLoading(false);
          setProfileData(null);
        }
        return;
      }

      const currentRole = role || profile.role;
      const tableInfo = getTableInfo(currentRole);

      // Si pas de table correspondante (ex: admin), arrêter le chargement
      if (!tableInfo) {
        if (mounted) {
          setLoading(false);
          setProfileData(null);
        }
        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }

        const { data, error: fetchError } = await supabase
          .from(tableInfo.table as unknown)
          .select(tableInfo.fields)
          .eq("user_id", user.id)
          .single();

        if (!mounted) return;

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // Aucun profil trouvé - normal pour les nouveaux utilisateurs
            setProfileData(null);
            setError(null);
          } else {
            console.error(`Error fetching ${tableInfo.table}:`, fetchError);
            setError("Erreur lors du chargement du profil");
          }
        } else {
          setProfileData(data as T);
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (mounted) {
          setError("Erreur inattendue lors du chargement");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [initialized, user, profile, role, getTableInfo, supabase]);

  return {
    profileData,
    loading,
    error,
    refreshProfile,
    updateProfile,
  };
}

/**
 * Hooks spécialisés pour chaque type de profil
 */
export function useFarmerProfile() {
  return useProfile<FarmerProfile>("agriculteur");
}

export function useCooperativeProfile() {
  return useProfile<CooperativeProfile>("cooperative");
}

export function useLenderProfile() {
  return useProfile<LenderProfile>("preteur");
}

/**
 * Hook pour les statistiques utilisateur
 */
export function useUserStats() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!user || !profile?.role) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const newStats: Record<string, number> = {};

        // Statistiques communes
        if (profile.role === "agriculteur") {
          // Nombre d'évaluations
          const { count: evaluationsCount } = await supabase
            .from("crop_evaluations")
            .select("*", { count: "exact", head: true })
            .eq("farmer_id", user.id);

          // Prêts actifs
          const { count: activeLoansCount } = await supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("borrower_id", user.id)
            .eq("status", "active");

          // Total des prêts
          const { count: totalLoansCount } = await supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("borrower_id", user.id);

          newStats.evaluations = evaluationsCount || 0;
          newStats.activeLoans = activeLoansCount || 0;
          newStats.totalLoans = totalLoansCount || 0;
          newStats.mazaoTokens = 12000; // Mock value - would come from blockchain
        }

        if (profile.role === "cooperative") {
          // Nombre d'agriculteurs
          const { count: farmersCount } = await supabase
            .from("farmer_profiles")
            .select("*", { count: "exact", head: true })
            .eq("cooperative_id", user.id);

          // Évaluations en attente
          const { count: pendingEvaluationsCount } = await supabase
            .from("crop_evaluations")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

          newStats.farmers = farmersCount || 0;
          newStats.pendingEvaluations = pendingEvaluationsCount || 0;
        }

        if (profile.role === "preteur") {
          // Prêts accordés
          const { count: loansGrantedCount } = await supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("lender_id", user.id);

          // Prêts actifs
          const { count: activeLoansCount } = await supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("lender_id", user.id)
            .eq("status", "active");

          newStats.loansGranted = loansGrantedCount || 0;
          newStats.activeLoans = activeLoansCount || 0;
        }

        setStats(newStats);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, profile, supabase]);

  return { stats, loading };
}
