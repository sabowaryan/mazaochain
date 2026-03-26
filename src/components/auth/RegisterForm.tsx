'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs/legacy';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ExclamationTriangleIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

type UserRole = 'agriculteur' | 'cooperative' | 'preteur';
type Step = 'form' | 'verify' | 'success';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
  code?: string;
}

const ROLE_LABELS: Record<UserRole, { label: string; description: string }> = {
  agriculteur: { label: 'Agriculteur', description: 'Je cultive des terres et cherche un financement' },
  cooperative: { label: 'Coopérative', description: "Je gère une coopérative agricole et valide les évaluations" },
  preteur: { label: 'Prêteur', description: 'Je souhaite financer des projets agricoles' },
};

const DASHBOARD_PATHS: Record<UserRole, string> = {
  agriculteur: '/fr/dashboard/farmer',
  cooperative: '/fr/dashboard/cooperative',
  preteur: '/fr/dashboard/lender',
};

export function RegisterForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'agriculteur',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = "L'adresse email est requise";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "L'adresse email n'est pas valide";
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!formData.role) newErrors.role = 'Veuillez sélectionner votre rôle';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !isLoaded) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: formData.role }),
        });
        setStep('success');
        setTimeout(() => router.push(DASHBOARD_PATHS[formData.role]), 1500);
      } else if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
      } else {
        setErrors({ general: 'Inscription incomplète. Veuillez réessayer.' });
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_identifier_exists') {
        setErrors({ email: 'Cette adresse email est déjà utilisée' });
      } else if (code === 'form_password_pwned') {
        setErrors({ password: 'Ce mot de passe est trop commun. Veuillez en choisir un plus sécurisé.' });
      } else {
        setErrors({ general: "Une erreur inattendue s'est produite. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode.trim()) {
      setErrors({ code: 'Veuillez entrer le code de vérification' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: formData.role }),
        });
        setStep('success');
        setTimeout(() => router.push(DASHBOARD_PATHS[formData.role]), 1500);
      } else {
        setErrors({ code: 'Code invalide. Veuillez réessayer.' });
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_code_incorrect' || code === 'verification_failed') {
        setErrors({ code: 'Code incorrect. Vérifiez votre boîte mail et réessayez.' });
      } else if (code === 'verification_expired') {
        setErrors({ code: 'Le code a expiré. Cliquez sur "Renvoyer le code".' });
      } else {
        setErrors({ code: "Une erreur s'est produite. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setErrors({});
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setErrors({ general: 'Un nouveau code a été envoyé à votre adresse email.' });
    } catch {
      setErrors({ general: "Impossible de renvoyer le code. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  if (step === 'success') {
    return (
      <div className="w-full max-w-screen-md mx-auto">
        <Card className="bg-white/80 border-0 shadow-xl">
          <CardContent className="p-10 text-center">
            <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte créé avec succès !</h2>
            <p className="text-gray-600">Redirection vers votre tableau de bord...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="w-full max-w-screen-md mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="p-8 pb-0 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Vérifiez votre email</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Un code de vérification a été envoyé à{' '}
              <span className="font-medium text-gray-800">{formData.email}</span>.
              Consultez votre boîte mail (et les spams).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleVerify} className="space-y-5">
              {errors.general && (
                <div className={`p-4 text-sm rounded-lg flex items-center space-x-3 ${
                  errors.general.includes('nouveau code')
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  <span>{errors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification (6 chiffres)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={e => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.code) setErrors(prev => ({ ...prev, code: undefined }));
                  }}
                  className={`text-center text-xl tracking-widest font-mono ${errors.code ? 'border-red-500' : ''}`}
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading || !isLoaded || verificationCode.length < 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
              >
                {loading ? 'Vérification...' : 'Vérifier mon email'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setErrors({}); setVerificationCode(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Modifier l&apos;adresse email
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-md mx-auto">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl relative overflow-hidden">
        <CardHeader className="p-8 pb-0">
          <CardTitle className="text-2xl font-bold text-gray-900">Créer un compte</CardTitle>
          <CardDescription className="text-gray-600">Rejoignez MazaoChain et accédez au financement agricole décentralisé</CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
              <Input
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange('password')}
                className={errors.password ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je suis</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.role === role
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{ROLE_LABELS[role].label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[role].description}</div>
                  </button>
                ))}
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || !isLoaded}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
