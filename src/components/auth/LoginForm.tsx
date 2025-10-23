"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { clientAuth } from "@/lib/supabase/client-auth";
import { usePostLoginRedirect } from "@/hooks/usePostLoginRedirect";
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm() {
  const router = useRouter();
  const { redirectAfterLogin } = usePostLoginRedirect();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse email n'est pas valide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Use the enhanced signIn method that also fetches the profile
      const { data, error, profile } = await clientAuth.signInWithProfile(
        formData.email,
        formData.password
      );

      if (error) {
        setErrors({ general: "Email ou mot de passe incorrect" });
        setLoading(false);
        return;
      }

      if (data.user && profile) {
        // Show redirecting state
        setIsRedirecting(true);
        // Use the hook for clean role-based redirection
        redirectAfterLogin(profile.role);
        // Note: We don't set loading to false here to maintain the loading state
        // during the redirect process for better UX
      } else {
        setErrors({ general: "Impossible de récupérer les informations du profil" });
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: "Une erreur inattendue s'est produite" });
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  return (
    <div className="w-full max-w-screen-md mx-auto">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl relative overflow-hidden">
        {/* Subtle decorative elements inside the card */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50/40 rounded-full -translate-y-10 translate-x-10 auth-form-decoration"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-50/30 rounded-full translate-y-8 -translate-x-8 auth-form-decoration"></div>
        
        <CardContent className="p-8 sm:p-10 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-5">
              <Input
                label="Adresse email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                error={errors.email}
                placeholder="votre@email.com"
                className="h-12 text-base"
                required
              />

              <Input
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={handleInputChange("password")}
                error={errors.password}
                placeholder="••••••••"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-gray-600">Se souvenir de moi</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
              loading={loading || isRedirecting}
              disabled={loading || isRedirecting}
            >
              {isRedirecting 
                ? "Redirection en cours..." 
                : loading 
                  ? "Connexion en cours..." 
                  : "Se connecter"
              }
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-gray-600">Pas encore de compte ? </span>
              <Link
                href="/auth/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
