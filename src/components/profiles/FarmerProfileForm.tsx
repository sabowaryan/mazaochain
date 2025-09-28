'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface FarmerProfileData {
  nom: string
  superficie: string
  localisation: string
  cropType: string
  rendementHistorique: string
  experienceAnnees: string
}

interface FormErrors {
  nom?: string
  superficie?: string
  localisation?: string
  cropType?: string
  rendementHistorique?: string
  experienceAnnees?: string
  general?: string
}

export function FarmerProfileForm() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [formData, setFormData] = useState<FarmerProfileData>({
    nom: '',
    superficie: '',
    localisation: '',
    cropType: '',
    rendementHistorique: '',
    experienceAnnees: ''
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
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setExistingProfile(data)
        setFormData({
          nom: data.nom || '',
          superficie: data.superficie?.toString() || '',
          localisation: data.localisation || '',
          cropType: data.crop_type || '',
          rendementHistorique: data.rendement_historique?.toString() || '',
          experienceAnnees: data.experience_annees?.toString() || ''
        })
      }
    } catch (error) {
      // Profile doesn't exist yet, which is fine
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.superficie.trim()) {
      newErrors.superficie = 'La superficie est requise'
    } else if (isNaN(Number(formData.superficie)) || Number(formData.superficie) <= 0) {
      newErrors.superficie = 'La superficie doit être un nombre positif'
    }

    if (!formData.localisation.trim()) {
      newErrors.localisation = 'La localisation est requise'
    }

    if (!formData.cropType) {
      newErrors.cropType = 'Le type de culture est requis'
    }

    if (!formData.rendementHistorique.trim()) {
      newErrors.rendementHistorique = 'Le rendement historique est requis'
    } else if (isNaN(Number(formData.rendementHistorique)) || Number(formData.rendementHistorique) <= 0) {
      newErrors.rendementHistorique = 'Le rendement doit être un nombre positif'
    }

    if (!formData.experienceAnnees.trim()) {
      newErrors.experienceAnnees = 'L\'expérience en années est requise'
    } else if (isNaN(Number(formData.experienceAnnees)) || Number(formData.experienceAnnees) < 0) {
      newErrors.experienceAnnees = 'L\'expérience doit être un nombre positif ou zéro'
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
        superficie: Number(formData.superficie),
        localisation: formData.localisation.trim(),
        crop_type: formData.cropType,
        rendement_historique: Number(formData.rendementHistorique),
        experience_annees: Number(formData.experienceAnnees)
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('farmer_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
      } else {
        // Create new profile
        result = await supabase
          .from('farmer_profiles')
          .insert([profileData])
      }

      if (result.error) {
        setErrors({ general: 'Erreur lors de la sauvegarde du profil' })
        return
      }

      // Redirect to dashboard
      router.push('/dashboard/farmer')
    } catch (error) {
      setErrors({ general: 'Une erreur inattendue s\'est produite' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FarmerProfileData) => (
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

  if (!user || profile?.role !== 'agriculteur') {
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
          <CardTitle>Profil Agriculteur</CardTitle>
          <CardDescription>
            {existingProfile ? 'Modifier votre profil' : 'Complétez votre profil pour commencer'}
            {!profile?.is_validated && (
              <div className="mt-2 p-2 bg-secondary-50 border border-secondary-200 rounded text-sm text-secondary-800">
                Votre profil doit être validé par une coopérative avant de pouvoir accéder aux fonctionnalités de prêt.
              </div>
            )}
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
              label="Nom complet"
              type="text"
              value={formData.nom}
              onChange={handleInputChange('nom')}
              error={errors.nom}
              placeholder="Votre nom complet"
              required
            />

            <Input
              label="Superficie (hectares)"
              type="number"
              step="0.1"
              min="0"
              value={formData.superficie}
              onChange={handleInputChange('superficie')}
              error={errors.superficie}
              placeholder="Ex: 2.5"
              required
            />

            <Input
              label="Localisation"
              type="text"
              value={formData.localisation}
              onChange={handleInputChange('localisation')}
              error={errors.localisation}
              placeholder="Village, Territoire, Province"
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Type de culture *
              </label>
              <select
                value={formData.cropType}
                onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Sélectionnez un type de culture</option>
                <option value="manioc">Manioc</option>
                <option value="cafe">Café</option>
              </select>
              {errors.cropType && (
                <p className="text-sm text-red-600">{errors.cropType}</p>
              )}
            </div>

            <Input
              label="Rendement historique (kg/hectare)"
              type="number"
              step="0.1"
              min="0"
              value={formData.rendementHistorique}
              onChange={handleInputChange('rendementHistorique')}
              error={errors.rendementHistorique}
              placeholder="Ex: 1500"
              required
            />

            <Input
              label="Expérience en agriculture (années)"
              type="number"
              min="0"
              value={formData.experienceAnnees}
              onChange={handleInputChange('experienceAnnees')}
              error={errors.experienceAnnees}
              placeholder="Ex: 5"
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