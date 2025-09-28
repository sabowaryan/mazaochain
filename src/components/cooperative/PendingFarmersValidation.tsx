"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PendingFarmer {
  id: string;
  user_id: string;
  nom: string;
  superficie: number;
  localisation: string;
  crop_type: string;
  rendement_historique: number;
  experience_annees: number;
  created_at: string;
  email: string;
}

export function PendingFarmersValidation() {
  const { user, profile } = useAuth();
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPendingFarmers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select(
          `
          id,
          user_id,
          nom,
          superficie,
          localisation,
          crop_type,
          rendement_historique,
          experience_annees,
          created_at,
          profiles!farmer_profiles_user_id_fkey(email, is_validated)
        `
        )
        .eq("profiles.is_validated", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending farmers:", error);
        return;
      }

      const formattedData =
        data
          ?.map((item) => {
            // Type guard to ensure profiles data exists and has the expected structure
            const profileData = item.profiles as unknown;
            if (
              !profileData ||
              typeof profileData !== "object" ||
              !("email" in profileData)
            ) {
              console.warn("Invalid profile data for farmer:", item.id);
              return null;
            }

            // Now we know profileData is an object with an email property
            const profileWithEmail = profileData as Record<string, unknown>;
            if (typeof profileWithEmail.email !== "string") {
              console.warn("Invalid email type for farmer:", item.id);
              return null;
            }

            const typedProfileData = { email: profileWithEmail.email };

            return {
              id: item.id,
              user_id: item.user_id || "",
              nom: item.nom,
              superficie: item.superficie,
              localisation: item.localisation,
              crop_type: item.crop_type,
              rendement_historique: item.rendement_historique,
              experience_annees: item.experience_annees,
              created_at: item.created_at || "",
              email: typedProfileData.email,
            };
          })
          .filter(
            (item): item is PendingFarmer =>
              item !== null && Boolean(item.user_id)
          ) || [];

      setPendingFarmers(formattedData);
    } catch (error) {
      console.error("Error fetching pending farmers:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user && profile?.role === "cooperative") {
      fetchPendingFarmers();
    }
  }, [user, profile, fetchPendingFarmers]);

  const handleValidation = async (
    farmerId: string,
    userId: string,
    approve: boolean
  ) => {
    setProcessingId(farmerId);

    try {
      // Update the profile validation status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_validated: approve })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return;
      }

      // If approved, also update the farmer profile to link to this cooperative
      if (approve) {
        const { error: farmerError } = await supabase
          .from("farmer_profiles")
          .update({ cooperative_id: user?.id })
          .eq("user_id", userId);

        if (farmerError) {
          console.error("Error updating farmer profile:", farmerError);
          return;
        }
      }

      // Send notification to farmer about validation status
      const notificationTitle = approve ? "Profil approuvé" : "Profil rejeté";
      const notificationMessage = approve
        ? "Votre profil d'agriculteur a été approuvé par la coopérative. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme."
        : "Votre profil d'agriculteur a été rejeté par la coopérative. Veuillez vérifier vos informations et soumettre à nouveau.";

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: notificationTitle,
          message: notificationMessage,
          type: "validation",
        });

      if (notificationError) {
        console.error("Error sending notification:", notificationError);
      }

      // Remove from pending list
      setPendingFarmers((prev) =>
        prev.filter((farmer) => farmer.id !== farmerId)
      );
    } catch (error) {
      console.error("Error processing validation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || profile?.role !== "cooperative") {
    return (
      <div className="text-center p-4">
        <p>Accès non autorisé</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary-900">
          Validation des Agriculteurs
        </h2>
        <p className="text-primary-700">
          Examinez et validez les profils des agriculteurs en attente
        </p>
      </div>

      {pendingFarmers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Aucun agriculteur en attente de validation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingFarmers.map((farmer) => (
            <Card key={farmer.id} className="border-l-4 border-l-yellow-400">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{farmer.nom}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {new Date(farmer.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </CardTitle>
                <CardDescription>{farmer.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Localisation
                    </p>
                    <p className="text-gray-900">{farmer.localisation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Superficie
                    </p>
                    <p className="text-gray-900">
                      {farmer.superficie} hectares
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Type de culture
                    </p>
                    <p className="text-gray-900 capitalize">
                      {farmer.crop_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Rendement historique
                    </p>
                    <p className="text-gray-900">
                      {farmer.rendement_historique} kg/hectare
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Expérience
                    </p>
                    <p className="text-gray-900">
                      {farmer.experience_annees} années
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      handleValidation(farmer.id, farmer.user_id, true)
                    }
                    disabled={processingId === farmer.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === farmer.id ? "Traitement..." : "Approuver"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleValidation(farmer.id, farmer.user_id, false)
                    }
                    disabled={processingId === farmer.id}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {processingId === farmer.id ? "Traitement..." : "Rejeter"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
