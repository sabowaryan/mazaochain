import { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type CropEvaluation = Tables<'crop_evaluations'>
export type CropEvaluationInsert = TablesInsert<'crop_evaluations'>

export interface CropEvaluationForm {
  crop_type: 'manioc' | 'cafe'
  superficie: number
  rendement_historique: number
  prix_reference: number
}

export interface CropEvaluationWithCalculation extends CropEvaluationForm {
  valeur_estimee: number
}

export const CROP_TYPES = {
  manioc: 'Manioc',
  cafe: 'Café'
} as const

export const DEFAULT_PRICES = {
  manioc: 0.5, // USDC per kg
  cafe: 2.0   // USDC per kg
} as const

// Price oracle integration
export interface CropPriceReference {
  crop_type: 'manioc' | 'cafe'
  current_price: number
  last_updated: string
  source: 'manual' | 'oracle' | 'default'
}