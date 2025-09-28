'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface CooperativeProfileData {
  nom: string
  region: string
}

interface FormErrors {
  nom?: string
  region?: string
  general?: string
}

export function CooperativeProfileForm() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [formData, setFormData] = useState<CooperativeProfileData>({
    nom: '',
    region: ''
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
        .from('cooperative_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setExistingProfile(data)
        setFormData({
          nom: data.nom || '',
          region: data.region || ''
        })
      }
    } catch (error) {
      // Profile doesn't exist yet, which is fine
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la coopérative est requis'
    }

    if (!formData.region.trim()) {
      newErrors.region = 'La région est requise'
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
        nom: formData.nom.trim(),
        region: formData.region.trim(),
        members_count: 0
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('cooperative_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
      } else {
        // Create new profile
        result = await supabase
          .from('cooperative_profiles')
          .insert([profileData])
      }

      if (result.error) {
        setErrors({ general: 'Erreur lors de la sauvegarde du profil' })
        return
      }

      // Redirect to dashboard
      router.push('/dashboard/cooperative')
    } catch (error) {
      setErrors({ general: 'Une erreur inattendue s\'est produite' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CooperativeProfileData) => (
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

  if (!user || profile?.role !== 'cooperative') {
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
          <CardTitle>Profil Coopérative</CardTitle>
          <CardDescription>
            {existingProfile ? 'Modifier votre profil' : 'Complétez votre profil de coopérative'}
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
              label="Nom de la coopérative"
              type="text"
              value={formData.nom}
              onChange={handleInputChange('nom')}
              error={errors.nom}
              placeholder="Nom de votre coopérative"
              required
            />

            <Input
              label="Région d'activité"
              type="text"
              value={formData.region}
              onChange={handleInputChange('region')}
              error={errors.region}
              placeholder="Province ou région"
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