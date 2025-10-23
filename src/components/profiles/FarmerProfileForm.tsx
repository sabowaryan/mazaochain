'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import {
  UserIcon,
  MapPinIcon,
  HomeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid'

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
  const params = useParams()
  const lang = params?.lang as string || 'fr'
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
      router.push(`/${lang}/dashboard/farmer`)
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
    <div className="space-y-6">
      {/* En-tête du formulaire */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {existingProfile ? 'Modifier votre profil' : 'Complétez votre profil'}
          </h3>
          <p className="text-sm text-gray-600">
            Renseignez vos informations agricoles
          </p>
        </div>
      </div>

      {/* Alerte de validation */}
      {!profile?.is_validated && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Validation requise</h4>
              <p className="text-sm text-amber-700 mt-1">
                Votre profil doit être validé par une coopérative avant de pouvoir accéder aux fonctionnalités de prêt.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Formulaire principal */}
      <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom complet */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Nom complet *</label>
              </div>
              <Input
                type="text"
                value={formData.nom}
                onChange={handleInputChange('nom')}
                error={errors.nom}
                placeholder="Votre nom complet"
                className="w-full"
                required
              />
            </div>

            {/* Superficie */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <HomeIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Superficie (hectares) *</label>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.superficie}
                onChange={handleInputChange('superficie')}
                error={errors.superficie}
                placeholder="Ex: 2.5"
                required
              />
            </div>

            {/* Localisation */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Localisation *</label>
              </div>
              <Input
                type="text"
                value={formData.localisation}
                onChange={handleInputChange('localisation')}
                error={errors.localisation}
                placeholder="Village, Territoire, Province"
                required
              />
            </div>

            {/* Type de culture */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Type de culture *</label>
              </div>
              <select
                value={formData.cropType}
                onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                required
              >
                <option value="">Sélectionnez un type de culture</option>
                <option value="manioc">🌿 Manioc</option>
                <option value="cafe">☕ Café</option>
              </select>
              {errors.cropType && (
                <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>{errors.cropType}</span>
                </p>
              )}
            </div>

            {/* Rendement historique */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Rendement historique (kg/hectare) *</label>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.rendementHistorique}
                onChange={handleInputChange('rendementHistorique')}
                error={errors.rendementHistorique}
                placeholder="Ex: 1500"
                required
              />
            </div>

            {/* Expérience */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Expérience en agriculture (années) *</label>
              </div>
              <Input
                type="number"
                min="0"
                value={formData.experienceAnnees}
                onChange={handleInputChange('experienceAnnees')}
                error={errors.experienceAnnees}
                placeholder="Ex: 5"
                required
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              className="w-full group bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              loading={loading}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircleIconSolid className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>{existingProfile ? 'Mettre à jour le profil' : 'Créer le profil'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}