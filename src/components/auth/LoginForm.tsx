"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

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
      const { data, error } = await clientAuth.signIn(
        formData.email,
        formData.password
      );

      if (error) {
        setErrors({ general: "Email ou mot de passe incorrect" });
        return;
      }

      if (data.user) {
        // Redirect to dashboard - the middleware will handle role-based routing
        router.push("/dashboard");
      }
    } catch (error) {
      setErrors({ general: "Une erreur inattendue s'est produite" });
    } finally {
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
    <Card className="w-full  mx-auto">
      <CardHeader>
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte MazaoChain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 text-sm text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-md">
              {errors.general}
            </div>
          )}

          <Input
            label="Adresse email"
            type="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={errors.email}
            placeholder="votre@email.com"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Se connecter
          </Button>

          <div className="text-center text-sm text-primary-600">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-secondary-500 hover:text-secondary-600"
            >
              Créer un compte
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
