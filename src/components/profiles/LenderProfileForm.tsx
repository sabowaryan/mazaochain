'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface LenderProfileData {
  institutionName: string
  availableFunds: string
}

interface FormErrors {
  institutionName?: string
  availableFunds?: string
  general?: string
}

export function LenderProfileForm() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [formData, setFormData] = useState<LenderProfileData>({
    institutionName: '',
    availableFunds: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [existingProfile, setExistingProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchExistingProfile()
    }
  }, [user])

  const fetchExistingProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('lender_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setExistingProfile(data)
        setFormData({
          institutionName: data.institution_name || '',
          availableFunds: data.available_funds?.toString() || ''
        })
      }
    } catch (error) {
      // Profile doesn't exist yet, which is fine
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Le nom de l\'institution est requis'
    }

    if (!formData.availableFunds.trim()) {
      newErrors.availableFunds = 'Le montant des fonds disponibles est requis'
    } else if (isNaN(Number(formData.availableFunds)) || Number(formData.availableFunds) < 0) {
      newErrors.availableFunds = 'Le montant doit être un nombre positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const profileData = {
        user_id: user.id,
        institution_name: formData.institutionName.trim(),
        available_funds: Number(formData.availableFunds)
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('lender_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
      } else {
        // Create new profile
        result = await supabase
          .from('lender_profiles')
          .insert([profileData])
      }

      if (result.error) {
        setErrors({ general: 'Erreur lors de la sauvegarde du profil' })
        return
      }

      // Redirect to dashboard
      router.push('/dashboard/lender')
    } catch (error) {
      setErrors({ general: 'Une erreur inattendue s\'est produite' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof LenderProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  if (!user || profile?.role !== 'preteur') {
    return (
      <div className="text-center">
        <p>Accès non autorisé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Profil Prêteur</CardTitle>
          <CardDescription>
            {existingProfile ? 'Modifier votre profil' : 'Complétez votre profil de prêteur institutionnel'}
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
              label="Nom de l'institution"
              type="text"
              value={formData.institutionName}
              onChange={handleInputChange('institutionName')}
              error={errors.institutionName}
              placeholder="Nom de votre institution financière"
              required
            />

            <Input
              label="Fonds disponibles (USDC)"
              type="number"
              step="0.01"
              min="0"
              value={formData.availableFunds}
              onChange={handleInputChange('availableFunds')}
              error={errors.availableFunds}
              placeholder="Ex: 10000"
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {existingProfile ? 'Mettre à jour le profil' : 'Créer le profil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}