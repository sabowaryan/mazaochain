'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { clientAuth } from '@/lib/supabase/client-auth'
import {
  UserIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

type UserRole = 'agriculteur' | 'cooperative' | 'preteur'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  general?: string
}

const roleLabels: Record<UserRole, { label: string; description: string }> = {
  agriculteur: {
    label: 'Agriculteur',
    description: 'Je suis un fermier qui veut tokeniser mes récoltes'
  },
  cooperative: {
    label: 'Coopérative',
    description: 'Je représente une coopérative agricole'
  },
  preteur: {
    label: 'Prêteur',
    description: 'Je veux investir dans des prêts agricoles'
  }
}

export function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'agriculteur'
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'L\'adresse email est requise'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'adresse email n\'est pas valide'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Veuillez sélectionner votre rôle'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { data, error } = await clientAuth.signUp(
        formData.email,
        formData.password,
        { role: formData.role }
      )

      if (error) {
        setErrors({ general: error.message })
        return
      }

      if (data.user) {
        // Redirect based on role
        if (formData.role === 'agriculteur') {
          router.push('/dashboard/farmer/profile')
        } else if (formData.role === 'cooperative') {
          router.push('/dashboard/cooperative')
        } else {
          router.push('/dashboard/lender')
        }
      }
    } catch (error) {
      setErrors({ general: 'Une erreur inattendue s\'est produite' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  return (
    <div className="w-full max-w-screen-lg mx-auto">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl relative overflow-hidden">
        {/* Subtle decorative elements inside the card */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-teal-50/35 rounded-full -translate-y-12 -translate-x-12 auth-form-decoration"></div>
        <div className="absolute top-1/3 right-0 w-18 h-18 bg-emerald-50/25 rounded-full translate-x-9 auth-form-decoration"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-green-50/30 rounded-full translate-y-10 translate-x-10 auth-form-decoration"></div>
        <div className="absolute bottom-1/4 left-0 w-14 h-14 bg-teal-50/20 rounded-full -translate-x-7 auth-form-decoration"></div>

        <CardContent className="p-8 sm:p-10 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Adresse email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                placeholder="votre@email.com"
                className="h-12 text-base"
                required
              />

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Mot de passe"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder="••••••••"
                  className="h-12 text-base"
                  required
                />

                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  className="h-12 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-900">
                Choisissez votre rôle
              </label>
              <p className="text-gray-600 text-sm">
                Sélectionnez le rôle qui correspond le mieux à votre profil
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(roleLabels).map(([role, { label, description }]) => (
                  <label
                    key={role}
                    className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${formData.role === role
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleInputChange('role')}
                      className="sr-only"
                    />

                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${role === 'agriculteur' ? 'bg-green-100 text-green-600' :
                        role === 'cooperative' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                        {role === 'agriculteur' ? (
                          <UserIcon className="w-6 h-6" />
                        ) : role === 'cooperative' ? (
                          <UserGroupIcon className="w-6 h-6" />
                        ) : (
                          <CurrencyDollarIcon className="w-6 h-6" />
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === role
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300'
                        }`}>
                        {formData.role === role && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        {label}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {errors.role && (
                <p className="text-sm text-red-600 flex items-center space-x-2">
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.role}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Création du compte..." : "Créer mon compte"}
              </Button>

              <div className="text-center">
                <span className="text-gray-600">Déjà un compte ? </span>
                <Link
                  href="/auth/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center leading-relaxed">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                Conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                Politique de confidentialité
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}