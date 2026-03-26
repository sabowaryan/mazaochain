'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ExclamationTriangleIcon, ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';

type LoginStep = 'login' | 'reset-request' | 'reset-verify';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  code?: string;
  newPassword?: string;
  general?: string;
}

const DASHBOARD_PATHS: Record<string, string> = {
  agriculteur: '/fr/dashboard/farmer',
  cooperative: '/fr/dashboard/cooperative',
  preteur: '/fr/dashboard/lender',
  admin: '/fr/admin',
};

export function LoginForm() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<LoginStep>('login');
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = "L'adresse email est requise";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "L'adresse email n'est pas valide";
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm() || !isLoaded) return;

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

        router.push(DASHBOARD_PATHS[role] || '/fr/dashboard');
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

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !resetEmail.trim()) {
      setErrors({ email: "L'adresse email est requise" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setErrors({ email: "L'adresse email n'est pas valide" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      setStep('reset-verify');
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_identifier_not_found') {
        setErrors({ email: 'Aucun compte trouvé avec cette adresse email' });
      } else {
        setErrors({ general: "Impossible d'envoyer le code de réinitialisation. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    const newErrors: FormErrors = {};
    if (!resetCode.trim()) newErrors.code = 'Veuillez entrer le code reçu par email';
    if (!newPassword) newErrors.newPassword = 'Le nouveau mot de passe est requis';
    else if (newPassword.length < 8) newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    if (newPassword !== confirmNewPassword) newErrors.newPassword = 'Les mots de passe ne correspondent pas';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setResetSuccess(true);
        setTimeout(() => router.push('/fr/dashboard'), 1500);
      } else {
        setErrors({ general: 'Une étape supplémentaire est requise.' });
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code;
      if (code === 'form_code_incorrect' || code === 'verification_failed') {
        setErrors({ code: 'Code incorrect. Vérifiez votre email et réessayez.' });
      } else if (code === 'verification_expired') {
        setErrors({ code: 'Le code a expiré. Retournez en arrière et renvoyez un nouveau code.' });
      } else if (code === 'form_password_pwned') {
        setErrors({ newPassword: 'Ce mot de passe est trop commun. Choisissez-en un plus sécurisé.' });
      } else {
        setErrors({ general: "Une erreur s'est produite. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  if (resetSuccess) {
    return (
      <div className="w-full max-w-screen-md mx-auto">
        <Card className="bg-white/80 border-0 shadow-xl">
          <CardContent className="p-10 text-center">
            <LockClosedIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe réinitialisé !</h2>
            <p className="text-gray-600">Vous allez être redirigé vers votre tableau de bord...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'reset-request') {
    return (
      <div className="w-full max-w-screen-md mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setStep('login'); setErrors({}); }}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Retour à la connexion
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Entrez votre adresse email pour recevoir un code de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleResetRequest} className="space-y-5">
              {errors.general && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={loading}
                  autoFocus
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'reset-verify') {
    return (
      <div className="w-full max-w-screen-md mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setStep('reset-request'); setErrors({}); setResetCode(''); }}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Renvoyer un code
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Réinitialiser le mot de passe</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Un code a été envoyé à <span className="font-medium">{resetEmail}</span>.
                Entrez-le ci-dessous avec votre nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleResetVerify} className="space-y-5">
              {errors.general && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={resetCode}
                  onChange={e => { setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errors.code) setErrors(prev => ({ ...prev, code: undefined })); }}
                  className={`text-center text-xl tracking-widest font-mono ${errors.code ? 'border-red-500' : ''}`}
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined })); }}
                  className={errors.newPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className={errors.newPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-md mx-auto">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50/40 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-50/30 rounded-full translate-y-8 -translate-x-8"></div>

        <CardContent className="p-8 sm:p-10 relative z-10">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(formData.email);
                    setStep('reset-request');
                    setErrors({});
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
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
