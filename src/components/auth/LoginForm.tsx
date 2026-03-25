'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  const { isLoaded, signIn, setActive } = useSignIn();

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = "L'adresse email est requise";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "L'adresse email n'est pas valide";
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !isLoaded) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        const profileRes = await fetch(`/api/profile?userId=${encodeURIComponent(result.createdUserId!)}`);
        let role = 'agriculteur';
        if (profileRes.ok) {
          const profile = await profileRes.json();
          role = profile.role;
        }

        const dashboardPaths: Record<string, string> = {
          agriculteur: '/fr/dashboard/farmer',
          cooperative: '/fr/dashboard/cooperative',
          preteur: '/fr/dashboard/lender',
          admin: '/fr/admin',
        };
        router.push(dashboardPaths[role] || '/fr/dashboard');
      } else {
        setErrors({ general: 'Une étape supplémentaire est requise. Veuillez utiliser la page de connexion.' });
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_password_incorrect' || code === 'form_identifier_not_found') {
        setErrors({ general: 'Email ou mot de passe incorrect' });
      } else {
        setErrors({ general: "Une erreur inattendue s'est produite" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  return (
    <div className="w-full max-w-screen-md mx-auto">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50/40 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-50/30 rounded-full translate-y-8 -translate-x-8"></div>

        <CardContent className="p-8 sm:p-10 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange('password')}
                className={errors.password ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Créer un compte
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
