'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { clientAuth } from '@/lib/supabase/client-auth'

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
    <Card className="w-full  mx-auto">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez MazaoChain pour commencer
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
            onChange={handleInputChange('email')}
            error={errors.email}
            placeholder="votre@email.com"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="••••••••"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary-800">
              Votre rôle
            </label>
            <div className="space-y-2">
              {Object.entries(roleLabels).map(([role, { label, description }]) => (
                <label
                  key={role}
                  className="flex items-start space-x-3 p-3 border border-primary-200 rounded-md cursor-pointer hover:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleInputChange('role')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary-900">
                      {label}
                    </div>
                    <div className="text-sm text-primary-600">
                      {description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="text-sm text-secondary-600">{errors.role}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Créer mon compte
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}